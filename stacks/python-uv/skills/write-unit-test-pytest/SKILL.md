---
name: write-unit-test-pytest
description: "Write a unit test for a Use Case or domain entity using pytest with fixtures and async support in a Python project. Use when the user says 'write test', 'add tests', 'test this', 'TDD', 'cover X with tests'. Don't use for integration tests with real databases. Don't use for API endpoint tests — test the use case directly."
metadata:
  skill_type: micro
  stack: python-uv
---

# Write Unit Test (pytest)

## Instructions

1. - [ ] Identify the target class or function to test (e.g., `CreateUser` use case, `User` entity).
2. - [ ] Determine the test file path — mirror the source under `tests/unit/`:
   - `src/{module}/application/use_cases/create_user.py` → `tests/unit/{module}/application/use_cases/test_create_user.py`
   - `src/{module}/domain/entities/user.py` → `tests/unit/{module}/domain/entities/test_user.py`
3. - [ ] Create the test file with fixtures and test functions:

```python
import pytest
from src.{module}.application.use_cases.{use_case_name} import (
    {UseCaseName},
    {UseCaseName}Input,
)
from tests.fakes.in_memory_{entity}_repository import InMemory{Entity}Repository


@pytest.fixture
def repository() -> InMemory{Entity}Repository:
    return InMemory{Entity}Repository()


@pytest.fixture
def sut(repository: InMemory{Entity}Repository) -> {UseCaseName}:
    return {UseCaseName}(repository)


async def test_{use_case_name}_should_{expected}(sut: {UseCaseName}) -> None:
    # Arrange
    input_data = {UseCaseName}Input(field1="value", field2=42)

    # Act
    result = await sut.execute(input_data)

    # Assert
    assert result.field == expected


async def test_{use_case_name}_should_raise_when_{condition}(sut: {UseCaseName}) -> None:
    with pytest.raises({ExceptionType}):
        await sut.execute(invalid_input)
```

4. - [ ] Run the test: `uv run pytest tests/unit/{module} -x -k {test_name}`
5. - [ ] Confirm RED (test fails for the right reason) before implementing.
6. - [ ] After implementation, verify all tests pass.

## Critical

- Use in-memory fakes for repository ports — mocking with `unittest.mock` hides bugs and tests implementation details instead of behavior.
- Use `pytest.fixture` for setup and teardown — global state and manual setup in each test leads to duplication and fragile tests.
- Use `async def test_*` with `pytest-asyncio` for async tests — sync wrappers around async code mask concurrency bugs.
- Name tests descriptively: `test_{action}_should_{outcome}_when_{condition}` — vague names like `test_1` make failures impossible to diagnose.

## Examples

**User says:** "Write tests for the cancel_order use case."

**Actions:**
1. Target: `CancelOrder` in `src/orders/application/use_cases/cancel_order.py`.
2. Create `tests/unit/orders/application/use_cases/test_cancel_order.py`.
3. Write fixtures: `repository` (InMemoryOrderRepository) and `sut` (CancelOrder).
4. Write tests:
   - `test_cancel_order_should_change_status_when_order_exists` — arrange existing order, cancel, assert status.
   - `test_cancel_order_should_raise_when_order_not_found` — empty repo, assert `OrderNotFoundError`.
   - `test_cancel_order_should_raise_when_already_cancelled` — cancelled order, assert `OrderAlreadyCancelledError`.
5. Run: `uv run pytest tests/unit/orders -x -k cancel_order`.

**Result:** 3 tests created, all RED initially. After implementing `CancelOrder.execute`, all pass.

## Troubleshooting

**Async test not detected** → pytest runs but skips async tests → Install `pytest-asyncio` and set `asyncio_mode = "auto"` in `pyproject.toml` under `[tool.pytest.ini_options]`.

**In-memory repository missing** → `ModuleNotFoundError` on fakes → Create `tests/fakes/in_memory_{entity}_repository.py` implementing the port interface with a `dict` for storage.

**Import path issues** → `ModuleNotFoundError` on `src.*` → Ensure `pyproject.toml` has the correct package configuration and `tests/` has `__init__.py` files, or use `uv run pytest` which handles path resolution.

## See also

- `create-usecase-fastapi` — create the use case to test
- `add-endpoint-fastapi` — create the HTTP endpoint that calls the use case
- `enforce-boundary` — verify test doesn't import from wrong layers
