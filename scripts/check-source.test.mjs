import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const commit = 'a'.repeat(40);
function fixture(run) {
  const path = mkdtempSync(resolve(tmpdir(), 'source-check-'));
  try {
    for (const name of ['README.md', 'PROVENANCE.md', 'skills', 'scripts']) {
      cpSync(resolve(root, name), resolve(path, name), { recursive: true });
    }
    run(path);
  } finally {
    rmSync(path, { recursive: true, force: true });
  }
}
function check(path, args = ['--commit', commit]) {
  return spawnSync(process.execPath, [resolve(path, 'scripts/check-source.mjs'), ...args], { encoding: 'utf8' });
}

test('catalog includes current skills and all reference hashes; deterministic', () => {
  const result = check(root);
  assert.equal(result.status, 0, result.stderr);
  const catalog = JSON.parse(result.stdout);
  assert.equal(catalog.commit, commit);
  assert.equal(catalog.source, 'https://github.com/lifinance/lifi-agent-skills');
  assert.deepEqual(catalog.skills.map(({ name }) => name), ['lifi', 'lifi-stablecoin-swap']);
  assert.equal(catalog.skills.flatMap(({ files }) => files).length, 4);
  for (const { files } of catalog.skills) {
    assert.ok(files.some(({ path }) => path.includes('/references/')));
    for (const { sha256 } of files) assert.match(sha256, /^[a-f0-9]{64}$/);
  }
  assert.equal(check(root).stdout, result.stdout);
});

test('rejects invalid or omitted commit', () => {
  for (const args of [[], ['--commit', 'main'], ['--commit', commit, 'extra']]) {
    assert.equal(check(root, args).status, 1);
  }
});

test('rejects historical skill names', () => fixture((path) => {
  cpSync(resolve(path, 'skills/lifi'), resolve(path, 'skills/li-fi-api'), { recursive: true });
  assert.match(check(path).stderr, /Unexpected skill set/);
  assert.equal(check(path).status, 1);
}));

test('rejects install placeholder', () => fixture((path) => {
  const file = resolve(path, 'README.md');
  writeFileSync(file, readFileSync(file, 'utf8').replace('npx skills add lifinance/', 'npx skills add <owner>/'));
  assert.equal(check(path).status, 1);
  assert.match(check(path).stderr, /canonical repository/);
}));

test('rejects frontmatter mismatch', () => fixture((path) => {
  const file = resolve(path, 'skills/lifi/SKILL.md');
  writeFileSync(file, readFileSync(file, 'utf8').replace('name: lifi\n', 'name: li-fi-api\n'));
  assert.equal(check(path).status, 1);
  assert.match(check(path).stderr, /Frontmatter name mismatch/);
}));

test('rejects missing local references', () => fixture((path) => {
  rmSync(resolve(path, 'skills/lifi/references/REFERENCE.md'));
  assert.equal(check(path).status, 1);
  assert.match(check(path).stderr, /Missing local link/);
}));
