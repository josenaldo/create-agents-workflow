// Minimal {{placeholder}} renderer. Supports dotted paths: {{cmd.test:unit}} or {{project.name}}.
// Unknown placeholders are left untouched (visible) so bugs are obvious instead of silently empty.

const PLACEHOLDER = /\{\{\s*([a-zA-Z0-9_.:\-]+)\s*\}\}/g;

export function render(template, context) {
  return template.replace(PLACEHOLDER, (match, path) => {
    const value = resolve(context, path);
    return value === undefined ? match : String(value);
  });
}

function resolve(ctx, path) {
  const parts = path.split('.');
  let cur = ctx;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}
