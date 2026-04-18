---
name: create-component-mantine
description: Scaffold a new React component using Mantine UI primitives with typed props and a colocated test.
metadata:
  skill_type: micro
  stack: react-mantine
---

# Create Component (Mantine)

## Inputs

- **Feature name** (e.g., `users`, `billing`)
- **Component name** in PascalCase (e.g., `UserCard`, `InvoiceRow`)

## Steps

1. Determine the target path: `src/features/{feature}/components/{ComponentName}/`
2. Create the component file `{ComponentName}.tsx`:

```tsx
import { Card, Group, Text, Stack } from '@mantine/core';

export interface {ComponentName}Props {
  // required and optional props (prefer discriminated unions over boolean flags)
}

export function {ComponentName}({ ...props }: {ComponentName}Props) {
  return (
    <Card withBorder padding="md" radius="md">
      <Stack gap="xs">
        {/* component body */}
      </Stack>
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
import { MantineProvider } from '@mantine/core';
import { {ComponentName} } from './{ComponentName}';

function renderWithProviders(ui: React.ReactNode) {
  return render(<MantineProvider>{ui}</MantineProvider>);
}

describe('{ComponentName}', () => {
  it('renders with required props', () => {
    renderWithProviders(<{ComponentName} {...requiredProps} />);
    expect(screen.getByRole(/* ... */)).toBeInTheDocument();
  });
});
```

## Rules

- Use Mantine primitives (`Card`, `Stack`, `Group`, `Text`, `Button`) over raw HTML when possible.
- Use Mantine's `gap`, `padding`, `radius` props rather than custom CSS for spacing.
- Prefer `@mantine/hooks` (`useDisclosure`, `useMediaQuery`, `useLocalStorage`) over writing equivalent hooks.
- Tests MUST wrap components in `<MantineProvider>` — raw render breaks theming.
- No business logic in components — call hooks/use cases from the `hooks/` or `api/` layer.
- Export props interface alongside the component so consumers can type wrappers.
