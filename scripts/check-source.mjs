import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = 'https://github.com/lifinance/lifi-agent-skills';
const expected = ['lifi', 'lifi-stablecoin-swap'];
function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}
function git(...args) {
  const result = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' });
  requireCondition(result.status === 0, `git ${args[0]} failed: ${result.error?.message ?? result.stderr?.trim()}`);
  return result.stdout;
}
function filesIn(directory) {
  return readdirSync(directory).sort().flatMap((name) => {
    const path = resolve(directory, name);
    const stat = lstatSync(path);
    requireCondition(stat.isDirectory() || stat.isFile(), `Unexpected symlink or special file: ${relative(root, path)}`);
    return stat.isDirectory() ? filesIn(path) : [path];
  });
}

try {
  requireCondition(process.argv.length === 4 && process.argv[2] === '--commit'
    && /^[a-f0-9]{40}$/.test(process.argv[3]), 'Usage: node scripts/check-source.mjs --commit FULL_40_HEX_COMMIT');
  const commit = process.argv[3];
  // Bind the catalog to a clean checkout of the supplied commit so hashes describe that commit.
  requireCondition(realpathSync(git('rev-parse', '--show-toplevel').trim()) === realpathSync(root),
    'Source check must run from the root of a lifi-agent-skills Git checkout');
  requireCondition(git('rev-parse', '--verify', 'HEAD^{commit}').trim() === commit, `Checked-out HEAD is not ${commit}`);
  requireCondition(git('status', '--porcelain', '--ignored', '--untracked-files=all', '--',
    'README.md', 'PROVENANCE.md', 'skills', 'scripts') === '', 'Source files differ from the commit; use a clean checkout');
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
    requireCondition(lstatSync(directory).isDirectory(), `Skill must be a directory: ${name}`);
    const paths = filesIn(directory);
    const local = new Set(paths);
    requireCondition(local.has(resolve(directory, 'SKILL.md')), `Missing SKILL.md: ${name}`);
    const skill = readFileSync(resolve(directory, 'SKILL.md'), 'utf8');
    const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(skill)?.[1];
    requireCondition(frontmatter, `Missing frontmatter: ${name}`);
    requireCondition(new RegExp(`^name: ${name}$`, 'm').test(frontmatter), `Frontmatter name mismatch: ${name}`);
    requireCondition(/^description:[ \t]*(?:[|>][+-]?[ \t]*\r?\n(?:[ \t]*\r?\n)*[ \t]+\S|[^\s|>])/m.test(frontmatter),
      `Missing description: ${name}`);
    const files = paths.map((path) => {
      const bytes = readFileSync(path);
      if (path.endsWith('.md')) {
        for (const match of bytes.toString('utf8').matchAll(/\]\(([^\s)]+)\)/g)) {
          const link = match[1];
          if (/^(?:[a-z]+:|#)/i.test(link)) continue;
          // Installed skills contain only their own directory, so local links must resolve inside it.
          const target = resolve(dirname(path), link.split('#')[0]);
          requireCondition(local.has(target), `Missing local link (must be a file in ${name}) in ${relative(root, path)}: ${link}`);
        }
      }
      return { path: relative(root, path), sha256: createHash('sha256').update(bytes).digest('hex') };
    });
    return { name, files };
  });
  process.stdout.write(`${JSON.stringify({ source, commit, skills }, null, 2)}\n`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
