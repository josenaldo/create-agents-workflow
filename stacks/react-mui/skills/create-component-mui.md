---
name: create-component-mui
description: Scaffold a new React component using Material UI primitives with typed props and a colocated test.
---

# Create Component (MUI)

## Inputs

- **Feature name** (e.g., `users`, `billing`)
- **Component name** in PascalCase (e.g., `UserCard`, `InvoiceRow`)

## Steps

1. Determine the target path: `src/features/{feature}/components/{ComponentName}/`
2. Create the component file `{ComponentName}.tsx`:

```tsx
import { Card, CardContent, Stack, Typography } from '@mui/material';

export interface {ComponentName}Props {
  // required and optional props (prefer discriminated unions over boolean flags)
}

export function {ComponentName}({ ...props }: {ComponentName}Props) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1}>
          {/* component body */}
        </Stack>
      </CardContent>
    </Card>
  );
}
```

3. Create `index.ts` that re-exports the component and its props type:
   ```ts
   export { {ComponentName} } from './{ComponentName}';
   export type { {ComponentName}Props } from './{ComponentName}';
   ```

4. Create the test file `{ComponentName}.test.tsx` with React Testing Library + Vitest:

```tsx
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { {ComponentName} } from './{ComponentName}';

const theme = createTheme();

function renderWithProviders(ui: React.ReactNode) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('{ComponentName}', () => {
  it('renders with required props', () => {
    renderWithProviders(<{ComponentName} {...requiredProps} />);
    expect(screen.getByRole(/* ... */)).toBeInTheDocument();
  });
});
```

## Rules

- Use MUI primitives (`Card`, `Stack`, `Box`, `Typography`, `Button`) over raw HTML when possible.
- Use MUI's `sx` prop for one-off styles; create themed components via `styled()` for reuse.
- Use `Stack` with `spacing` rather than manual margins — it composes cleanly with responsive props.
- Tests MUST wrap components in `<ThemeProvider>` — raw render breaks theme-aware styles.
- No business logic in components — call hooks/use cases from the `hooks/` or `api/` layer.
- Export props interface alongside the component so consumers can type wrappers.
- Use `Typography` with `variant` for all text (`h1`, `h2`, `body1`, `caption`) — never raw `<p>` or `<h1>`.
