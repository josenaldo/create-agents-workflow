---
name: add-endpoint-express
description: "Add a new Express HTTP endpoint wired to a Use Case following Clean Architecture in a TypeScript + Node project. Use when the user says 'add endpoint', 'create route', 'new API', 'expose X via HTTP', 'add a GET/POST/PUT/DELETE'. Don't use for business logic — use create-usecase. Don't use for tests — use write-unit-test-jest."
metadata:
  skill_type: micro
  stack: ts-node-npm
---

# Add Endpoint (Express)

## Instructions

1. - [ ] Identify the module name (e.g., `users`), HTTP method + path (e.g., `POST /api/users`), and the use case to invoke (e.g., `CreateUser`).
2. - [ ] Verify the use case exists — if not, create it first using `create-usecase`.
3. - [ ] Create or update the controller at `src/{module}/infrastructure/http/{Module}Controller.ts`:

```typescript
import { Router, Request, Response, NextFunction } from 'express';
import { {UseCaseName} } from '../../application/use-cases/{UseCaseName}';

export function make{Module}Router({useCaseName}: {UseCaseName}): Router {
  const router = Router();

  router.{method}('{path}', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const output = await {useCaseName}.execute(req.body);
      res.status({statusCode}).json(output);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
```

4. - [ ] Register the router in the app's main router (e.g., `src/infrastructure/http/routes.ts`).
5. - [ ] Add the endpoint to `docs/specs/{module}/endpoints.md`.
6. - [ ] Update `docs/specs/{module}/route-mapping.md` if a frontend route consumes it.
7. - [ ] Run `enforce-boundary` to verify the controller only depends on application layer.

## Critical

- Controllers do coordination only — business logic in controllers makes it untestable and couples HTTP to domain rules.
- Always validate input at the controller level (e.g., with zod) — unvalidated input reaches the use case and causes cryptic domain errors instead of clear 400 responses.
- Use `next(error)` in catch blocks — swallowing errors or sending ad-hoc responses leads to inconsistent error formats across endpoints.
- Use correct HTTP status codes: 201 for creation, 200 for queries, 204 for deletes — wrong codes break client integrations.

## Examples

**User says:** "Add a POST endpoint to create a new order."

**Actions:**
1. Module: `orders`, method: `POST /api/orders`, use case: `CreateOrder`.
2. Create `src/orders/infrastructure/http/OrdersController.ts` with `makeOrdersRouter`.
3. Add `router.post('/api/orders', ...)`, call `createOrder.execute(req.body)`.
4. Return `res.status(201).json(output)`.
5. Register in `routes.ts`: `app.use(makeOrdersRouter(createOrder))`.
6. Update `docs/specs/orders/endpoints.md`.

**Result:** `POST /api/orders` endpoint created, wired to `CreateOrder` use case, documented in specs.

## Troubleshooting

**Async errors crash the server** → Unhandled promise rejection → Wrap `await` calls in `try/catch` and pass errors to `next(error)`. Or use a wrapper function: `const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)`.

**req.body is undefined** → JSON body parser not configured → Ensure `app.use(express.json())` is called before routes are registered.

**Use case not found at runtime** → Dependency injection wiring is missing → Verify the use case is instantiated and passed to the router factory function in the app composition root.

## See also

- `create-usecase` — create the use case this endpoint calls
- `write-unit-test-jest` — write tests for the use case
- `enforce-boundary` — verify the controller doesn't leak business logic
