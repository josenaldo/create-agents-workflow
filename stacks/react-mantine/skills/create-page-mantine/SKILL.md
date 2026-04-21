---
name: create-page-mantine
description: "Scaffold a new page component using Mantine layout primitives, wired to the router and data hooks. Use when the user says 'create page', 'new screen', 'add a page for X', 'list page', 'detail page'. Don't use for small UI widgets — use create-component-mantine. Don't use for data hooks — use frontend-hooks-react-query."
metadata:
  skill_type: micro
  stack: react-mantine
---

# Create Page (Mantine)

## Instructions

1. - [ ] Identify the feature name (e.g., `users`), page name in PascalCase (e.g., `UserListPage`), and route path (e.g., `/users`).
2. - [ ] Determine the target path: `src/features/{feature}/pages/{PageName}.tsx`.
3. - [ ] Create the page with Mantine layout primitives and three UI states:

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
        {/* Page body — use components from components/ */}
      </Stack>
    </Container>
  );
}
```

4. - [ ] Register the route in the router (e.g., `src/app/router.tsx`):
   ```tsx
   { path: '{route}', element: <{PageName} /> }
   ```
5. - [ ] Update `docs/specs/{feature}/route-mapping.md` linking the page to its backend endpoint.
6. - [ ] Verify the page renders correctly in the browser.

## Critical

- Handle three UI states explicitly: loading, error, success — missing any state causes blank screens or unhandled exceptions visible to the user.
- Fetch data via feature hooks in `hooks/` — calling `fetch` directly from pages couples the page to HTTP details and makes it untestable.
- Keep pages thin (<150 lines) — fat pages are a sign of missing component extraction; delegate UI details to `components/`.
- Use `Container` with a `size` prop for consistent max-widths — pages without `Container` stretch to full viewport width and break layout consistency.

## Examples

**User says:** "Create a page that lists all orders."

**Actions:**
1. Feature: `orders`, page: `OrderListPage`, route: `/orders`.
2. Path: `src/features/orders/pages/OrderListPage.tsx`.
3. Use `useOrders()` hook (create via `frontend-hooks-react-query` if missing).
4. Render `Loader` during fetch, `Alert` on error, list of `OrderCard` on success.
5. Register route: `{ path: '/orders', element: <OrderListPage /> }`.
6. Update `docs/specs/orders/route-mapping.md`.

**Result:** `OrderListPage.tsx` created with loading/error/success states, route registered.

## Troubleshooting

**Blank page with no errors** → Data hook returns `undefined` on success → Check the hook returns `data` correctly. Ensure the query function resolves with the expected shape.

**Layout inconsistency across pages** → Pages use different widths → Always use `<Container size="lg">` (or the project's standard size) for all pages.

**Page exceeds 150 lines** → Too much UI logic inline → Extract repeated or complex sections into components under `components/`. Pages should orchestrate, not render details.

## See also

- `create-component-mantine` — build the components this page uses
- `frontend-hooks-react-query` — create the data hooks this page calls
- `enforce-boundary` — verify page imports stay within feature boundaries
