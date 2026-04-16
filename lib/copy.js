import { cp, readFile, writeFile, readdir, mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { render } from './renderer.js';

// Recursively copies `from` into `to`.
// Files ending in `.tmpl` are rendered (with {{placeholders}}) and written WITHOUT the `.tmpl` suffix.
export async function copyTree(from, to, context) {
  const entries = await readdir(from, { withFileTypes: true });
  for (const entry of entries) {
    const src = join(from, entry.name);
    const dst = join(to, entry.name);
    if (entry.isDirectory()) {
      await mkdir(dst, { recursive: true });
      await copyTree(src, dst, context);
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
