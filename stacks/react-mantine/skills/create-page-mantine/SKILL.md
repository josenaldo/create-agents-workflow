---
name: create-page-mantine
description: Scaffold a new page component using Mantine layout primitives, wired to the router and data layer.
metadata:
  skill_type: micro
  stack: react-mantine
---

# Create Page (Mantine)

## Inputs

- **Feature name** (e.g., `users`, `billing`)
- **Page name** in PascalCase (e.g., `UserListPage`, `InvoiceDetailPage`)
- **Route path** (e.g., `/users`, `/invoices/:id`)

## Steps

1. Determine the target path: `src/features/{feature}/pages/{PageName}.tsx`
2. Create the page with Mantine layout primitives:

```tsx
import { Container, Title, Stack, Group, Loader, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { use{Resource} } from '../hooks/use-{resource}';

export function {PageName}() {
  const { data, isLoading, error } = use{Resource}();

  if (isLoading) return <Loader />;
  if (error) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error">
        {error.message}
      </Alert>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={2}>{/* Page title */}</Title>
          {/* Page actions */}
        </Group>
        {/* Page body */}
      </Stack>
    </Container>
  );
}
```

3. Register the route in the router (e.g., `src/app/router.tsx`):
   ```tsx
   { path: '{route}', element: <{PageName} /> }
   ```

4. Update `docs/specs/{feature}/route-mapping.md` linking the page to its backend endpoint.

## Rules

- Pages handle layout and data orchestration — delegate UI details to components in `components/`.
- Use `Container` with a `size` prop for consistent max-widths across pages.
- Handle three UI states explicitly: loading, error, success. No silent empty states.
- Fetch data via feature hooks in `hooks/` — never call `fetch` directly from pages.
- Use `@mantine/notifications` for user feedback (success, error toasts) — don't roll your own.
- Keep pages thin — if a page exceeds ~150 lines, extract composite components.
