---
name: add-endpoint-express
description: Add a new Express HTTP endpoint wired to a Use Case, following Clean Architecture.
---

# Add Endpoint (Express)

## Inputs

- **Module name** (e.g., `users`)
- **HTTP method + path** (e.g., `POST /users`)
- **Use case** to invoke (e.g., `CreateUser`)

## Steps

1. Create or update the controller at `src/{module}/infrastructure/http/{Module}Controller.ts`:

```typescript
import { Router, Request, Response } from 'express';
import { {UseCaseName} } from '../../application/use-cases/{UseCaseName}';

export function make{Module}Router({useCaseName}: {UseCaseName}): Router {
  const router = Router();

  router.{method}('{path}', async (req: Request, res: Response) => {
    const output = await {useCaseName}.execute(req.body);
    res.status({statusCode}).json(output);
  });

  return router;
}
```

2. Register the router in the app's main router/index (e.g., `src/infrastructure/http/routes.ts`).
3. Add the endpoint to `docs/specs/{module}/endpoints.md`.
4. Update `docs/specs/{module}/route-mapping.md` if a frontend route consumes it.

## Rules

- Controllers do coordination only — NO business logic.
- Always validate input at the controller level (e.g., with zod or express-validator).
- Use proper HTTP status codes: 201 for creation, 200 for queries, 204 for deletes.
- Wrap use case calls in try/catch and return appropriate error responses.
