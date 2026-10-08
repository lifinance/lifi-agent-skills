import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
function git(path, ...args) {
  const result = spawnSync('git', ['-C', path, '-c', 'user.name=test', '-c', 'user.email=test@example.invalid',
    '-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=/dev/null', '-c', 'core.autocrlf=false', ...args], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}
// Copies the source into a fresh repository, applies `change`, commits, then runs `run(path, head)`.
function fixture(change, run) {
  const path = mkdtempSync(resolve(tmpdir(), 'source-check-'));
  try {
    for (const name of ['README.md', 'PROVENANCE.md', 'skills', 'scripts']) {
      cpSync(resolve(root, name), resolve(path, name), { recursive: true });
    }
    change(path);
    git(path, 'init', '-q');
    git(path, 'add', '-A');
    git(path, 'commit', '-qm', 'fixture');
    run(path, git(path, 'rev-parse', 'HEAD'));
  } finally {
    rmSync(path, { recursive: true, force: true });
  }
}
function check(path, args) {
  return spawnSync(process.execPath, [resolve(path, 'scripts/check-source.mjs'), ...args], { encoding: 'utf8' });
}
function edit(path, file, from, to) {
  const target = resolve(path, file);
  const text = readFileSync(target, 'utf8');
  assert.ok(text.includes(from), `${file} does not contain ${from}`);
  writeFileSync(target, text.replace(from, to));
}
function rejects(change, pattern) {
  fixture(change, (path, head) => {
    const result = check(path, ['--commit', head]);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, pattern);
  });
}

test('catalog includes current skills and all reference hashes; deterministic', () => fixture(() => {}, (path, head) => {
  const result = check(path, ['--commit', head]);
  assert.equal(result.status, 0, result.stderr);
  const catalog = JSON.parse(result.stdout);
  assert.equal(catalog.commit, head);
  assert.equal(catalog.source, 'https://github.com/lifinance/lifi-agent-skills');
  assert.deepEqual(catalog.skills.map(({ name }) => name), ['lifi', 'lifi-stablecoin-swap']);
  const files = catalog.skills.flatMap(({ files }) => files);
  assert.equal(files.length, 4);
  for (const { path: file, sha256 } of files) {
    assert.match(sha256, /^[a-f0-9]{64}$/);
    const blob = spawnSync('git', ['-C', path, 'cat-file', 'blob', `${head}:${file}`]);
    assert.equal(blob.status, 0, String(blob.stderr));
    assert.equal(createHash('sha256').update(blob.stdout).digest('hex'), sha256);
  }
  for (const { files } of catalog.skills) assert.ok(files.some(({ path }) => path.includes('/references/')));
  assert.equal(check(path, ['--commit', head]).stdout, result.stdout);
}));

test('rejects invalid, omitted or mismatched commit', () => fixture(() => {}, (path, head) => {
  const other = head.replace(/^./, (c) => (c === 'a' ? 'b' : 'a'));
  for (const args of [[], ['--commit', 'main'], ['--commit', head, 'extra'], ['--commit', head.toUpperCase()], ['--commit', other]]) {
    const result = check(path, args);
    assert.equal(result.status, 1, args.join(' '));
    assert.equal(result.stdout, '');
  }
  assert.match(check(path, ['--commit', other]).stderr, /HEAD is not/);
}));

test('rejects dirty, untracked or ignored source files', () => {
  for (const dirty of [
    (path) => edit(path, 'skills/lifi/references/REFERENCE.md', '#', '##'),
    (path) => writeFileSync(resolve(path, 'skills/lifi/references/extra.md'), 'extra\n'),
    (path) => {
      writeFileSync(resolve(path, '.gitignore'), '*.tmp\n');
      writeFileSync(resolve(path, 'skills/lifi/notes.tmp'), 'ignored\n');
    },
  ]) {
    fixture(() => {}, (path, head) => {
      dirty(path);
      const result = check(path, ['--commit', head]);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /clean checkout/);
    });
  }
});

test('rejects historical skill names', () => rejects((path) => {
  cpSync(resolve(path, 'skills/lifi'), resolve(path, 'skills/li-fi-api'), { recursive: true });
}, /Unexpected skill set/));

test('rejects install placeholder', () => rejects((path) => {
  edit(path, 'README.md', 'npx skills add lifinance/', 'npx skills add <owner>/');
}, /canonical repository/));

test('rejects frontmatter mismatch', () => rejects((path) => {
  edit(path, 'skills/lifi/SKILL.md', 'name: lifi\n', 'name: li-fi-api\n');
}, /Frontmatter name mismatch/));

test('rejects empty description', () => rejects((path) => {
  const file = resolve(path, 'skills/lifi/SKILL.md');
  writeFileSync(file, readFileSync(file, 'utf8').replace(/^description:[\s\S]*?\n---/m, 'description: |\n---'));
}, /Missing description/));

test('rejects missing local references', () => rejects((path) => {
  rmSync(resolve(path, 'skills/lifi/references/REFERENCE.md'));
}, /Missing local link/));

test('rejects local links outside the skill directory', () => rejects((path) => {
  edit(path, 'skills/lifi/SKILL.md', '](references/REFERENCE.md)', '](../../README.md)');
}, /Missing local link/));

test('rejects symlinked skill files', () => rejects((path) => {
  symlinkSync('../../../README.md', resolve(path, 'skills/lifi/references/linked.md'));
}, /symlink/));
