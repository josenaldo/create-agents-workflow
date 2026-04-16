import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

// Loads a stack directory's manifest (stack.json).
export async function loadStack(stacksDir, name) {
  const dir = join(stacksDir, name);
  const manifestPath = join(dir, 'stack.json');
  if (!existsSync(manifestPath)) {
    throw new Error(`Stack "${name}" not found at ${manifestPath}`);
  }
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  return { name, dir, manifest };
}

// Lists all available stacks grouped by kind ("base" | "overlay").
export async function listStacks(stacksDir) {
  const entries = await readdir(stacksDir, { withFileTypes: true });
  const bases = [];
  const overlays = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const stack = await loadStack(stacksDir, e.name);
    const kind = stack.manifest.kind ?? 'base';
    (kind === 'overlay' ? overlays : bases).push(stack);
  }
  return { bases, overlays };
}

// Merges N stacks' manifests, later ones overriding earlier ones for scalar keys,
// and merging objects like `commands` shallowly.
export function mergeManifests(stacks) {
  const out = { commands: {}, layout: null, testFramework: null, kind: 'base' };
  for (const { manifest } of stacks) {
    out.commands = { ...out.commands, ...(manifest.commands ?? {}) };
    if (manifest.layout) out.layout = manifest.layout;
    if (manifest.testFramework) out.testFramework = manifest.testFramework;
    if (manifest.label) out.label = manifest.label;
  }
  return out;
}
