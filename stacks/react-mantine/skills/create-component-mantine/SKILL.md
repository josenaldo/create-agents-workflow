---
name: create-component-mantine
description: "Scaffold a new React component using Mantine UI primitives with typed props and a colocated test. Use when the user says 'create component', 'new card', 'new widget', 'add a UI element', 'build X component'. Don't use for full pages — use create-page-mantine. Don't use for data hooks — use frontend-hooks-react-query."
metadata:
  skill_type: micro
  stack: react-mantine
---

# Create Component (Mantine)

## Instructions

1. - [ ] Identify the feature name (e.g., `users`) and component name in PascalCase (e.g., `UserCard`).
2. - [ ] Determine the target path: `src/features/{feature}/components/{ComponentName}/`.
3. - [ ] Create the component file `{ComponentName}.tsx`:

```tsx
import { Card, Group, Text, Stack } from '@mantine/core';

export interface {ComponentName}Props {
  title: string;
  description?: string;
  // prefer discriminated unions over boolean flags
}

export function {ComponentName}({ title, description }: {ComponentName}Props) {
  return (
    <Card withBorder padding="md" radius="md">
      <Stack gap="xs">
        <Text fw={500}>{title}</Text>
        {description && <Text size="sm" c="dimmed">{description}</Text>}
      </Stack>
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
import { MantineProvider } from '@mantine/core';
import { {ComponentName} } from './{ComponentName}';

function renderWithProviders(ui: React.ReactNode) {
  return render(<MantineProvider>{ui}</MantineProvider>);
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

- Use Mantine primitives (`Card`, `Stack`, `Group`, `Text`, `Button`) over raw HTML — raw HTML ignores the design system and causes visual inconsistency.
- Tests MUST wrap components in `<MantineProvider>` — raw render crashes on theme context access and produces misleading failures.
- No business logic in components — components that fetch data or run business rules become untestable and tightly coupled to the backend.
- Export props interface alongside the component — consumers need the type to build typed wrappers and stories.

## Examples

**User says:** "Create an OrderCard component."

**Actions:**
1. Feature: `orders`, component: `OrderCard`.
2. Path: `src/features/orders/components/OrderCard/`.
3. Create `OrderCard.tsx` with `OrderCardProps { orderId: string; total: number; status: string }`.
4. Use `Card`, `Group`, `Text`, `Badge` from Mantine.
5. Create `index.ts` re-exporting component and props.
6. Create `OrderCard.test.tsx` with `MantineProvider` wrapper.

**Result:** `OrderCard/` directory with component, barrel export, and passing test.

## Troubleshooting

**Mantine styles not applied** → Component renders but looks unstyled → Ensure `MantineProvider` wraps the app root. In tests, use the `renderWithProviders` helper.

**Tabler icons not rendering** → `@tabler/icons-react` not installed → Run `npm install @tabler/icons-react`. Import icons individually: `import { IconCheck } from '@tabler/icons-react'`.

**Props type not available to consumers** → Only the component is exported → Add `export type { {ComponentName}Props }` to `index.ts`.

## See also

- `create-page-mantine` — create a page that uses this component
- `frontend-hooks-react-query` — create data hooks the page will call
- `enforce-boundary` — verify components don't import from wrong layers
