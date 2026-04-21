---
name: add-endpoint-fastapi
description: "Add a new FastAPI HTTP endpoint wired to a Use Case following Clean Architecture. Use when the user says 'add endpoint', 'create route', 'new API', 'expose X via HTTP', 'add a GET/POST/PUT/DELETE'. Don't use for business logic — use create-usecase-fastapi. Don't use for tests — use write-unit-test-pytest."
metadata:
  skill_type: micro
  stack: python-uv
---

# Add Endpoint (FastAPI)

## Instructions

1. - [ ] Identify the module name (e.g., `users`), HTTP method + path (e.g., `POST /api/users`), and the use case to invoke (e.g., `CreateUser`).
2. - [ ] Verify the use case exists — if not, create it first using `create-usecase-fastapi`.
3. - [ ] Create or update the router at `src/{module}/infrastructure/http/{module}_router.py`:

```python
from fastapi import APIRouter, Depends, status
from ...application.use_cases.{use_case_name} import (
    {UseCaseName},
    {UseCaseName}Input,
    {UseCaseName}Output,
)

router = APIRouter(prefix="/api/{module}", tags=["{module}"])


@router.{method}("/", status_code=status.HTTP_{STATUS_CODE}, response_model={UseCaseName}Output)
async def {handler_name}(
    input_data: {UseCaseName}Input,
    use_case: {UseCaseName} = Depends(get_{use_case_name}),
) -> {UseCaseName}Output:
    return await use_case.execute(input_data)
```

4. - [ ] Create a dependency provider in `src/{module}/infrastructure/dependencies.py` that wires the use case to its concrete repository.
5. - [ ] Register the router in the app factory (e.g., `src/main.py`):
   ```python
   app.include_router({module}_router.router)
   ```
6. - [ ] Add the endpoint to `docs/specs/{module}/endpoints.md`.
7. - [ ] Update `docs/specs/{module}/route-mapping.md` if a frontend route consumes it.
8. - [ ] Run `enforce-boundary` to verify the router only depends on application layer.

## Critical

- Routers do coordination only — business logic in routers makes it untestable and couples HTTP to domain rules.
- Use `Depends()` for dependency injection — hardcoding use case instantiation in the router prevents testing and configuration flexibility.
- Use Pydantic models for request/response — FastAPI validates automatically, but only if types are Pydantic `BaseModel` subclasses or `dataclass`.
- Don't name the parameter `input` — it shadows the built-in. Use `input_data` or a domain-specific name.

## Examples

**User says:** "Add a POST endpoint to create a new order."

**Actions:**
1. Module: `orders`, method: `POST /api/orders`, use case: `CreateOrder`.
2. Create `src/orders/infrastructure/http/orders_router.py` with `@router.post("/")`.
3. Parameter: `input_data: CreateOrderInput`, dependency: `use_case: CreateOrder = Depends(get_create_order)`.
4. Return `await use_case.execute(input_data)` with `status_code=status.HTTP_201_CREATED`.
5. Create `dependencies.py` with `get_create_order` function.
6. Register in `main.py`: `app.include_router(orders_router.router)`.

**Result:** `POST /api/orders` endpoint created, validated via Pydantic, wired to `CreateOrder` use case.

## Troubleshooting

**Dependency injection fails** → `get_{use_case_name}` not found → Create the dependency provider function in `src/{module}/infrastructure/dependencies.py` that instantiates the use case with its concrete repository.

**Pydantic validation errors not returned** → Client gets 500 instead of 422 → Ensure the input type is a Pydantic `BaseModel` or `dataclass`, not a plain Python class. FastAPI only validates Pydantic types automatically.

**Async/sync mismatch** → `RuntimeWarning: coroutine was never awaited` → Ensure the endpoint function is `async def` and uses `await` when calling async use case methods. If the use case is sync, remove `async`/`await` from both.

## See also

- `create-usecase-fastapi` — create the use case this endpoint calls
- `write-unit-test-pytest` — write tests for the use case
- `enforce-boundary` — verify the router doesn't leak business logic
