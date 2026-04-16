---
name: write-unit-test-pytest
description: Write a unit test for a Use Case or domain entity using pytest in a Python project.
---

# Write Unit Test (pytest)

## Inputs

- **Target** — the class/function to test (e.g., `CreateUser` use case, `User` entity)

## Steps

1. Determine test file path — mirror the source under `tests/unit/`:
   - `src/{module}/application/use_cases/create_user.py` → `tests/unit/{module}/application/use_cases/test_create_user.py`
   - `src/{module}/domain/entities/user.py` → `tests/unit/{module}/domain/entities/test_user.py`

2. Structure the test:

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
    input = {UseCaseName}Input(...)

    # Act
    result = await sut.execute(input)

    # Assert
    assert result.field == expected


async def test_{use_case_name}_should_raise_when_{condition}(sut: {UseCaseName}) -> None:
    with pytest.raises({ExceptionType}):
        await sut.execute(invalid_input)
```

3. Run the test: `uv run pytest tests/unit/{module} -x -k {test_name}`
4. Confirm RED (test fails for the right reason) before implementing.

## Rules

- Use in-memory implementations of repository ports — NEVER mock the database directly.
- Use `pytest.fixture` for setup. Use `async def test_*` for async tests (with `pytest-asyncio`).
- Test behavior, not implementation. Assert on outputs and side effects.
- One test file per module file. Use classes to group related scenarios if needed.
- Cover: happy path, validation errors, edge cases, business rule violations.
