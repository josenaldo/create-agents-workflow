---
name: create-usecase-fastapi
description: "Scaffold a new Use Case class following Clean Architecture with TDD in a Python + FastAPI project. Use when the user says 'create use case', 'new service', 'new business operation', 'add X logic', 'implement Y feature'. Don't use for HTTP endpoints — use add-endpoint-fastapi. Don't use for frontend components — use create-component-mantine or create-component-mui."
metadata:
  skill_type: micro
  stack: python-uv
---

# Create Use Case (FastAPI)

## Instructions

1. - [ ] Identify the module name (e.g., `users`) and use case name in snake_case (e.g., `create_user`).
2. - [ ] Determine the target path: `src/{module}/application/use_cases/{use_case_name}.py`.
3. - [ ] Create or update the repository port (abstract class) in `src/{module}/application/ports/` if it doesn't exist:

```python
from abc import ABC, abstractmethod

class {Entity}Repository(ABC):
    @abstractmethod
    async def save(self, entity: {Entity}) -> None: ...

    @abstractmethod
    async def find_by_id(self, id: str) -> {Entity} | None: ...
```

4. - [ ] Create the use case file with input/output models:

```python
from dataclasses import dataclass
from ..ports.{entity}_repository import {Entity}Repository


@dataclass(frozen=True)
class {UseCaseName}Input:
    field1: str
    field2: int


@dataclass(frozen=True)
class {UseCaseName}Output:
    id: str
    field1: str
    created_at: str


class {UseCaseName}:
    def __init__(self, repository: {Entity}Repository) -> None:
        self._repository = repository

    async def execute(self, input_data: {UseCaseName}Input) -> {UseCaseName}Output:
        # 1. Validate input
        # 2. Execute business logic
        # 3. Persist via repository
        # 4. Return output
        ...
```

5. - [ ] Create the unit test first (TDD): `tests/unit/{module}/application/use_cases/test_{use_case_name}.py`.
6. - [ ] Run the test — confirm RED (fails for the right reason).
7. - [ ] Implement the `execute` method to make the test pass.
8. - [ ] Run `enforce-boundary` to verify no layer violations.

## Critical

- Use cases MUST NOT import from `infrastructure/` — this breaks testability and couples business logic to FastAPI/SQLAlchemy/HTTP.
- Use `dataclass(frozen=True)` or Pydantic `BaseModel` for Input/Output DTOs — mutable DTOs lead to hidden side effects when shared across layers.
- Constructor injection for all dependencies — use cases receive port interfaces, never concrete implementations.
- Use `async def` for execute methods — FastAPI is async-first; sync use cases block the event loop and degrade performance under load.

## Examples

**User says:** "Create a use case to cancel an order."

**Actions:**
1. Module: `orders`, use case: `cancel_order`.
2. Path: `src/orders/application/use_cases/cancel_order.py`.
3. Port: `OrderRepository(ABC)` with `find_by_id` and `save`.
4. Input: `CancelOrderInput(order_id: str, reason: str)`.
5. Output: `CancelOrderOutput(order_id: str, cancelled_at: str)`.
6. Test first: verify order found, status changes, reason stored.
7. Implement: find order → validate cancellable → update status → save → return output.

**Result:** `cancel_order.py` and `test_cancel_order.py` created. Tests pass, no boundary violations.

## Troubleshooting

**Import error on port** → `ModuleNotFoundError` on the repository port → Verify the `__init__.py` files exist in each package directory. Python requires them for package resolution.

**Async test not running** → pytest ignores async test functions → Install `pytest-asyncio` and add `@pytest.mark.asyncio` to async tests, or configure `asyncio_mode = "auto"` in `pyproject.toml`.

**Frozen dataclass can't be modified** → `FrozenInstanceError` when trying to set a field → This is intentional. Create a new instance with the modified values instead: `replace(input_data, field1="new_value")` using `dataclasses.replace`.

## See also

- `add-endpoint-fastapi` — expose this use case via HTTP
- `write-unit-test-pytest` — detailed unit test patterns for pytest
- `enforce-boundary` — verify Clean Architecture layer rules
