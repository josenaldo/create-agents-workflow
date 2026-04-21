---
name: frontend-hooks-react-query
description: "Create a data-fetching hook using TanStack Query (React Query) for a backend endpoint with centralized query keys. Use when the user says 'create hook', 'fetch data', 'add query', 'add mutation', 'connect to API', 'wire up the endpoint'. Don't use for UI components — use create-component-mantine. Don't use for backend endpoints — use the backend stack's add-endpoint skill."
metadata:
  skill_type: micro
  stack: react-mantine
---

# Frontend Hooks (React Query)

## Instructions

1. - [ ] Identify the feature name (e.g., `users`), operation type (query or mutation), and the backend endpoint to wrap (e.g., `GET /api/users`).
2. - [ ] Create the API function in `src/features/{feature}/api/{resource}-api.ts` if it doesn't exist:

```ts
import { apiClient } from '@/shared/api-client';

export async function fetch{Resources}(): Promise<{Resource}[]> {
  const res = await apiClient.get('/api/{resources}');
  return res.data;
}

export async function create{Resource}(input: Create{Resource}Input): Promise<{Resource}> {
  const res = await apiClient.post('/api/{resources}', input);
  return res.data;
}
```

3. - [ ] Create the query keys factory in `src/features/{feature}/hooks/use-{resource}.ts`:

```ts
export const {resource}Keys = {
  all: ['{resources}'] as const,
  lists: () => [...{resource}Keys.all, 'list'] as const,
  detail: (id: string) => [...{resource}Keys.all, 'detail', id] as const,
};
```

4. - [ ] Create the hook — **query** version (for reads):

```ts
import { useQuery } from '@tanstack/react-query';
import { fetch{Resources} } from '../api/{resource}-api';

export function use{Resources}() {
  return useQuery({
    queryKey: {resource}Keys.lists(),
    queryFn: fetch{Resources},
  });
}
```

5. - [ ] Create the hook — **mutation** version (for writes):

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { create{Resource} } from '../api/{resource}-api';

export function useCreate{Resource}() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: create{Resource},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: {resource}Keys.lists() });
      notifications.show({ color: 'green', message: '{Resource} created' });
    },
    onError: (error) => {
      notifications.show({ color: 'red', title: 'Failed', message: error.message });
    },
  });
}
```

6. - [ ] For paginated or filtered lists, include filter params in the query key: `[...{resource}Keys.lists(), filters]`.

## Critical

- Export a `{resource}Keys` factory and use it everywhere — scattered query key strings cause cache misses and stale data that's nearly impossible to debug.
- Invalidate related query keys on mutation success — without invalidation, the UI shows stale data until manual refresh.
- Keep API functions (raw HTTP) separate from hooks (React integration) — API functions must be testable without React, and hooks should only orchestrate.
- Never put domain logic in hooks — hooks are a transport layer; domain logic belongs in the backend use case.

## Examples

**User says:** "Create hooks to list and create orders."

**Actions:**
1. Feature: `orders`, endpoints: `GET /api/orders` and `POST /api/orders`.
2. Create `src/features/orders/api/orders-api.ts` with `fetchOrders` and `createOrder`.
3. Create `src/features/orders/hooks/use-orders.ts` with `orderKeys` factory.
4. Add `useOrders()` query hook for listing.
5. Add `useCreateOrder()` mutation hook with cache invalidation and notifications.

**Result:** Two hooks exported, query keys centralized, mutation invalidates list cache on success.

## Troubleshooting

**Stale data after mutation** → List doesn't update after create/update → Verify `queryClient.invalidateQueries` uses the correct key from the `{resource}Keys` factory. Check that mutation `onSuccess` fires.

**Query runs on every render** → Component re-renders trigger refetch loops → Ensure query key is stable (no inline object/array creation). Use the keys factory instead of `['{resources}']` inline.

**Notifications not showing** → `notifications.show()` called but nothing appears → Ensure `<Notifications />` component is mounted at the app root, typically in `App.tsx`.

## See also

- `create-page-mantine` — create the page that consumes these hooks
- `create-component-mantine` — build components that display the fetched data
- `enforce-boundary` — verify hooks don't import from wrong layers
