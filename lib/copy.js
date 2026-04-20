import { cp, readFile, writeFile, readdir, mkdir, stat, rm, symlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import pc from 'picocolors';
import { render } from './renderer.js';

// Recursively copies `from` into `to`.
// Files ending in `.tmpl` are rendered (with {{placeholders}}) and written WITHOUT the `.tmpl` suffix.
// options.skipRelative: array of relative paths (from the initial `from`) to skip.
export async function copyTree(from, to, context, options = {}) {
  const { skipRelative = [], _rel = '' } = options;
  const entries = await readdir(from, { withFileTypes: true });
  for (const entry of entries) {
    const src = join(from, entry.name);
    const dst = join(to, entry.name);
    const relPath = _rel ? `${_rel}/${entry.name}` : entry.name;
    if (skipRelative.includes(relPath)) continue;
    if (entry.isDirectory()) {
      await mkdir(dst, { recursive: true });
      await copyTree(src, dst, context, { ...options, _rel: relPath });
    } else if (entry.isFile()) {
      if (entry.name.endsWith('.tmpl')) {
        const content = await readFile(src, 'utf8');
        const rendered = render(content, context);
        const finalDst = dst.replace(/\.tmpl$/, '');
        await mkdir(dirname(finalDst), { recursive: true });
        await writeFile(finalDst, rendered);
      } else {
        await cp(src, dst);
      }
    }
  }
}

// Appends the content of `file` (if it exists) to `target` (creating it if needed).
export async function appendFile(file, target) {
  if (!existsSync(file)) return;
  const addition = await readFile(file, 'utf8');
  let existing = '';
  if (existsSync(target)) existing = await readFile(target, 'utf8');
  const sep = existing && !existing.endsWith('\n') ? '\n' : '';
  await writeFile(target, existing + sep + addition);
}

const AGENTS_WITH_SYMLINK_PATHS = {
  claude: '.claude/skills',
  copilot: '.github/skills',
};

// Creates relative directory symlinks from each agent's native skills directory
// to the canonical .agents/skills/ source of truth.
// On Windows or when symlink fails, falls back to a recursive copy and emits a warning.
export async function createSymlinks(targetDir, agents) {
  for (const agent of agents) {
    const relPath = AGENTS_WITH_SYMLINK_PATHS[agent];
    if (!relPath) continue; // agent does not need a symlink

    const linkPath = join(targetDir, relPath);
    await mkdir(dirname(linkPath), { recursive: true });

    // Remove any pre-existing file/dir/link at the target path
    try {
      await rm(linkPath, { recursive: true, force: true });
    } catch { }

    // Compute relative target based on path depth
    const depth = relPath.split('/').length;
    const relTarget = '../'.repeat(depth - 1) + '.agents/skills';

    try {
      await symlink(relTarget, linkPath, 'dir');
    } catch (err) {
      if (err.code === 'EPERM' || err.code === 'ENOSYS') {
        // Windows or restricted environment — fall back to copy
        const source = join(targetDir, '.agents/skills');
        await cp(source, linkPath, { recursive: true });
        console.warn(
          pc.yellow(`⚠ Symlink unavailable at ${relPath}. Skills duplicated instead. Edit only .agents/skills/ and re-run to sync.`)
        );
      } else {
        throw err;
      }
    }
  }
}
