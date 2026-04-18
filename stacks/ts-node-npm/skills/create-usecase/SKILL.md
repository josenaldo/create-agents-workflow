---
name: create-usecase
description: Scaffold a new Use Case class following Clean Architecture in a TypeScript + Node project.
metadata:
  skill_type: micro
  stack: ts-node-npm
---

# Create Use Case

## Inputs

- **Module name** (e.g., `users`, `orders`)
- **Use case name** in PascalCase (e.g., `CreateUser`, `CancelOrder`)

## Steps

1. Determine the target path: `src/{module}/application/use-cases/{UseCaseName}.ts`
2. Create the use case file with this structure:

```typescript
import type { {Entity}Repository } from '../ports/{entity}-repository';

export interface {UseCaseName}Input {
  // input DTO fields
}

export interface {UseCaseName}Output {
  // output DTO fields
}

export class {UseCaseName} {
  constructor(private readonly repository: {Entity}Repository) {}

  async execute(input: {UseCaseName}Input): Promise<{UseCaseName}Output> {
    // implementation
  }
}
```

3. Create or update the repository port interface in `src/{module}/application/ports/` if it doesn't exist.
4. Create the unit test file: `src/{module}/application/use-cases/{UseCaseName}.test.ts`
5. Follow TDD — write the test first, confirm RED, then implement.

## Rules

- Use cases MUST NOT import from `infrastructure/`.
- Input/Output types are plain objects — no framework dependencies.
- One use case per file. One public class per file.
- Constructor injection for all dependencies (ports/interfaces only).
