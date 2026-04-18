---
name: add-endpoint-fastapi
description: Add a new FastAPI HTTP endpoint wired to a Use Case, following Clean Architecture.
metadata:
  skill_type: micro
  stack: python-uv
---

# Add Endpoint (FastAPI)

## Inputs

- **Module name** (e.g., `users`)
- **HTTP method + path** (e.g., `POST /api/users`)
- **Use case** to invoke (e.g., `CreateUser`)

## Steps

1. Create or update the router at `src/{module}/infrastructure/http/{module}_router.py`:

```python
from fastapi import APIRouter, Depends, status
from ...application.use_cases.{use_case_name} import {UseCaseName}, {UseCaseName}Input, {UseCaseName}Output

router = APIRouter(prefix="/api/{module}", tags=["{module}"])


@router.{method}("/", status_code=status.HTTP_{STATUS_CODE}, response_model={UseCaseName}Output)
async def {handler_name}(
    input: {UseCaseName}Input,
    use_case: {UseCaseName} = Depends(get_{use_case_name}),
) -> {UseCaseName}Output:
    return await use_case.execute(input)
```

2. Register the router in the app factory (e.g., `src/main.py` or `src/app.py`):
   ```python
   app.include_router({module}_router.router)
   ```

3. Create a dependency provider in `src/{module}/infrastructure/dependencies.py` that wires the use case to its concrete repository.
4. Add the endpoint to `docs/specs/{module}/endpoints.md`.
5. Update `docs/specs/{module}/route-mapping.md` if a frontend route consumes it.

## Rules

- Routers do coordination only — NO business logic.
- Use Pydantic models for request/response validation (FastAPI does this automatically).
- Use proper HTTP status codes: 201 for creation, 200 for queries, 204 for deletes.
- Use `Depends()` for dependency injection — wire use cases to concrete implementations.
- Handle exceptions via FastAPI exception handlers, not in individual endpoints.
