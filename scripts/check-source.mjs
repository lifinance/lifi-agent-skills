import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = 'https://github.com/lifinance/lifi-agent-skills';
const expected = ['lifi', 'lifi-stablecoin-swap'];
function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}
function filesIn(directory) {
  return readdirSync(directory).sort().flatMap((name) => {
    const path = resolve(directory, name);
    requireCondition(!lstatSync(path).isSymbolicLink(), `Unexpected symlink: ${path}`);
    return statSync(path).isDirectory() ? filesIn(path) : [path];
  });
}

try {
  requireCondition(process.argv.length === 4 && process.argv[2] === '--commit'
    && /^[a-f0-9]{40}$/.test(process.argv[3]), 'Usage: node scripts/check-source.mjs --commit FULL_40_HEX_COMMIT');
  const readme = readFileSync(resolve(root, 'README.md'), 'utf8');
  requireCondition(readme.includes('npx skills add lifinance/lifi-agent-skills')
    && !readme.includes('<owner>'), 'README must install from the canonical repository');
  requireCondition(readme.includes(source) && readme.includes('(PROVENANCE.md)'), 'README must link source and provenance');
  const skillsRoot = resolve(root, 'skills');
  const names = readdirSync(skillsRoot).sort();
  requireCondition(JSON.stringify(names) === JSON.stringify(expected), `Unexpected skill set: ${names.join(', ')}`);
  const skills = names.map((name) => {
    requireCondition(readme.includes(`### ${name}\n`), `Missing README skill: ${name}`);
    const directory = resolve(skillsRoot, name);
    const skill = readFileSync(resolve(directory, 'SKILL.md'), 'utf8');
    const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(skill)?.[1];
    requireCondition(frontmatter, `Missing frontmatter: ${name}`);
    requireCondition(new RegExp(`^name: ${name}$`, 'm').test(frontmatter), `Frontmatter name mismatch: ${name}`);
    requireCondition(/^description: .+/m.test(frontmatter), `Missing description: ${name}`);
    const files = filesIn(directory).map((path) => {
      const bytes = readFileSync(path);
      if (path.endsWith('.md')) {
        for (const match of bytes.toString('utf8').matchAll(/\]\(([^\s)]+)\)/g)) {
          const link = match[1];
          if (/^(?:[a-z]+:|#)/i.test(link)) continue;
          const target = resolve(dirname(path), link.split('#')[0]);
          requireCondition(target.startsWith(`${root}/`) && existsSync(target), `Missing local link in ${relative(root, path)}: ${link}`);
        }
      }
      return { path: relative(root, path), sha256: createHash('sha256').update(bytes).digest('hex') };
    });
    return { name, files };
  });
  process.stdout.write(`${JSON.stringify({ source, commit: process.argv[3], skills }, null, 2)}\n`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
