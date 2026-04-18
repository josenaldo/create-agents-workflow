---
name: create-page-mui
description: Scaffold a new page component using Material UI layout primitives, wired to the router and data layer.
metadata:
  skill_type: micro
  stack: react-mui
---

# Create Page (MUI)

## Inputs

- **Feature name** (e.g., `users`, `billing`)
- **Page name** in PascalCase (e.g., `UserListPage`, `InvoiceDetailPage`)
- **Route path** (e.g., `/users`, `/invoices/:id`)

## Steps

1. Determine the target path: `src/features/{feature}/pages/{PageName}.tsx`
2. Create the page with MUI layout primitives:

```tsx
import { Container, Stack, Typography, Box, CircularProgress, Alert } from '@mui/material';
import { use{Resource} } from '../hooks/use-{resource}';

export function {PageName}() {
  const { data, isLoading, error } = use{Resource}();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4">{/* Page title */}</Typography>
          {/* Page actions */}
        </Stack>
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
- Use `Container` with a `maxWidth` prop for consistent page widths across the app.
- Handle three UI states explicitly: loading, error, success. No silent empty states.
- Fetch data via feature hooks in `hooks/` — never call `fetch` directly from pages.
- Use `notistack` or MUI `Snackbar` for user feedback — don't roll your own toast system.
- Use the `sx` prop for page-level spacing/layout tweaks; extract to `styled()` if reused.
- Keep pages thin — if a page exceeds ~150 lines, extract composite components.
