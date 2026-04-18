import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm, lstat, readlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createSymlinks } from '../lib/copy.js';

const TMP = '/tmp/ccw-symlink-test';

describe('createSymlinks', () => {
  before(async () => {
    await rm(TMP, { recursive: true, force: true });
    await mkdir(join(TMP, '.agents/skills/foo'), { recursive: true });
    await writeFile(join(TMP, '.agents/skills/foo/SKILL.md'), '# foo');
  });

  after(async () => {
    await rm(TMP, { recursive: true, force: true });
  });

  it('creates .claude/skills symlink to ../.agents/skills on Unix', async () => {
    if (process.platform === 'win32') return; // skipped on Windows
    await createSymlinks(TMP, ['claude']);
    const link = join(TMP, '.claude/skills');
    assert.ok(existsSync(link), '.claude/skills should exist');
    const stat = await lstat(link);
    assert.ok(stat.isSymbolicLink(), 'should be a symlink');
    const target = await readlink(link);
    assert.equal(target, '../.agents/skills');
  });

  it('creates .github/skills symlink for copilot agent', async () => {
    if (process.platform === 'win32') return;
    await createSymlinks(TMP, ['copilot']);
    const link = join(TMP, '.github/skills');
    assert.ok(existsSync(link), '.github/skills should exist');
  });

  it('skips agents not in AGENTS_WITH_SYMLINK (e.g., gemini)', async () => {
    await createSymlinks(TMP, ['gemini']);
    assert.ok(!existsSync(join(TMP, '.gemini/skills')), 'no symlink expected for gemini');
  });
});
