---
name: create-usecase-fastapi
description: Scaffold a new Use Case class following Clean Architecture in a Python + FastAPI project.
---

# Create Use Case (FastAPI)

## Inputs

- **Module name** (e.g., `users`, `orders`)
- **Use case name** in snake_case (e.g., `create_user`, `cancel_order`)

## Steps

1. Determine the target path: `src/{module}/application/use_cases/{use_case_name}.py`
2. Create input/output models and the use case:

```python
from dataclasses import dataclass
from ..ports.{entity}_repository import {Entity}Repository


@dataclass(frozen=True)
class {UseCaseName}Input:
    # fields
    pass


@dataclass(frozen=True)
class {UseCaseName}Output:
    # fields
    pass


class {UseCaseName}:
    def __init__(self, repository: {Entity}Repository) -> None:
        self._repository = repository

    async def execute(self, input: {UseCaseName}Input) -> {UseCaseName}Output:
        # implementation
        ...
```

3. Create or update the repository port (abstract class) in `src/{module}/application/ports/` if it doesn't exist:

```python
from abc import ABC, abstractmethod

class {Entity}Repository(ABC):
    @abstractmethod
    async def save(self, entity: {Entity}) -> None: ...

    @abstractmethod
    async def find_by_id(self, id: str) -> {Entity} | None: ...
```

4. Create the unit test: `tests/unit/{module}/application/use_cases/test_{use_case_name}.py`
5. Follow TDD — write the test first, confirm RED, then implement.

## Rules

- Use cases MUST NOT import from `infrastructure/`.
- Use `dataclass(frozen=True)` or Pydantic `BaseModel` for Input/Output DTOs.
- Constructor injection for all dependencies (ports only).
- Use `async def` for use case methods — FastAPI is async-first.
