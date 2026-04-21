---
name: create-component-mui
description: "Scaffold a new React component using Material UI primitives with typed props and a colocated test. Use when the user says 'create component', 'new card', 'new widget', 'add a UI element', 'build X component'. Don't use for full pages — use create-page-mui. Don't use for data hooks — use frontend-hooks-react-query."
metadata:
  skill_type: micro
  stack: react-mui
---

# Create Component (MUI)

## Instructions

1. - [ ] Identify the feature name (e.g., `users`) and component name in PascalCase (e.g., `UserCard`).
2. - [ ] Determine the target path: `src/features/{feature}/components/{ComponentName}/`.
3. - [ ] Create the component file `{ComponentName}.tsx`:

```tsx
import { Card, CardContent, Stack, Typography } from '@mui/material';

export interface {ComponentName}Props {
  title: string;
  description?: string;
  // prefer discriminated unions over boolean flags
}

export function {ComponentName}({ title, description }: {ComponentName}Props) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1}>
          <Typography variant="subtitle1" fontWeight={500}>{title}</Typography>
          {description && (
            <Typography variant="body2" color="text.secondary">{description}</Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
```

4. - [ ] Create `index.ts` that re-exports the component and its props type:
   ```ts
   export { {ComponentName} } from './{ComponentName}';
   export type { {ComponentName}Props } from './{ComponentName}';
   ```

5. - [ ] Create the test file `{ComponentName}.test.tsx`:

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
    renderWithProviders(<{ComponentName} title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

6. - [ ] Run the tests: `npm test -- --testPathPattern={ComponentName}`.

## Critical

- Use MUI primitives (`Card`, `Stack`, `Box`, `Typography`, `Button`) over raw HTML — raw HTML ignores the design system and causes visual inconsistency.
- Tests MUST wrap components in `<ThemeProvider>` — raw render crashes on theme context access and produces misleading failures.
- Use `Typography` with `variant` for all text (`h1`, `body1`, `caption`) — raw `<p>` and `<h1>` tags bypass the design system's type scale.
- No business logic in components — components that fetch data or run business rules become untestable and tightly coupled to the backend.

## Examples

**User says:** "Create an OrderCard component."

**Actions:**
1. Feature: `orders`, component: `OrderCard`.
2. Path: `src/features/orders/components/OrderCard/`.
3. Create `OrderCard.tsx` with `OrderCardProps { orderId: string; total: number; status: string }`.
4. Use `Card`, `CardContent`, `Stack`, `Typography`, `Chip` from MUI.
5. Create `index.ts` re-exporting component and props.
6. Create `OrderCard.test.tsx` with `ThemeProvider` wrapper.

**Result:** `OrderCard/` directory with component, barrel export, and passing test.

## Troubleshooting

**MUI styles not applied** → Component renders but looks unstyled → Ensure `ThemeProvider` wraps the app root. In tests, use the `renderWithProviders` helper with `createTheme()`.

**MUI icons not rendering** → `@mui/icons-material` not installed → Run `npm install @mui/icons-material`. Import icons individually: `import CheckIcon from '@mui/icons-material/Check'`.

**Props type not available to consumers** → Only the component is exported → Add `export type { {ComponentName}Props }` to `index.ts`.

## See also

- `create-page-mui` — create a page that uses this component
- `frontend-hooks-react-query` — create data hooks the page will call
- `enforce-boundary` — verify components don't import from wrong layers
