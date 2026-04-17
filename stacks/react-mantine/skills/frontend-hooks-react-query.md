---
name: frontend-hooks-react-query
description: Create a data-fetching hook using TanStack Query (React Query) for a backend endpoint.
---

# Frontend Hooks (React Query)

## Inputs

- **Feature name** (e.g., `users`, `orders`)
- **Operation** — query (read) or mutation (write)
- **Endpoint** the hook wraps (e.g., `GET /api/users`, `POST /api/users`)

## Steps

1. Determine the target path: `src/features/{feature}/hooks/use-{resource}.ts`
2. Create the API function in `src/features/{feature}/api/{resource}-api.ts` if it doesn't exist:

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

3. Create the hook — query version:

```ts
import { useQuery } from '@tanstack/react-query';
import { fetch{Resources} } from '../api/{resource}-api';

export const {resource}Keys = {
  all: ['{resources}'] as const,
  lists: () => [...{resource}Keys.all, 'list'] as const,
  detail: (id: string) => [...{resource}Keys.all, 'detail', id] as const,
};

export function use{Resources}() {
  return useQuery({
    queryKey: {resource}Keys.lists(),
    queryFn: fetch{Resources},
  });
}
```

4. Create the hook — mutation version:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { create{Resource} } from '../api/{resource}-api';
import { {resource}Keys } from './use-{resources}';

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

## Rules

- Export a `{resource}Keys` factory — queryKeys are strings scattered across the app and MUST be centralized per feature.
- Invalidate related query keys on mutation success — stale caches cause ghost UI state.
- Use Mantine `notifications` for mutation feedback (success/error). Queries typically don't toast.
- Keep API functions (raw HTTP) separate from hooks (React integration) — API functions should be testable without React.
- Never put domain logic in hooks — they are a transport layer only.
- For paginated/filtered lists, include filter params in the query key: `[...{resource}Keys.lists(), filters]`.
