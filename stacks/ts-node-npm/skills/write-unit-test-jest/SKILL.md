---
name: write-unit-test-jest
description: Write a unit test for a Use Case or domain entity using Jest in a TypeScript + Node project.
metadata:
  skill_type: micro
  stack: ts-node-npm
---

# Write Unit Test (Jest)

## Inputs

- **Target** — the class/function to test (e.g., `CreateUser` use case, `User` entity)

## Steps

1. Determine test file path — mirror the source path with `.test.ts` suffix:
   - `src/{module}/application/use-cases/CreateUser.ts` → `src/{module}/application/use-cases/CreateUser.test.ts`
   - `src/{module}/domain/entities/User.ts` → `src/{module}/domain/entities/User.test.ts`

2. Structure the test:

```typescript
describe('{ClassName}', () => {
  // Setup — create in-memory fakes for ports
  let repository: InMemory{Entity}Repository;
  let sut: {ClassName};

  beforeEach(() => {
    repository = new InMemory{Entity}Repository();
    sut = new {ClassName}(repository);
  });

  it('should {expected behavior} when {condition}', async () => {
    // Arrange
    // Act
    const result = await sut.execute(input);
    // Assert
    expect(result).toEqual(expected);
  });

  it('should throw when {error condition}', async () => {
    await expect(sut.execute(invalidInput)).rejects.toThrow({ErrorType});
  });
});
```

3. Run the test: `npm run test:unit -- --testPathPattern={test-file}`
4. Confirm RED (test fails for the right reason) before implementing.

## Rules

- Use in-memory implementations of repository ports — NEVER mock the database directly.
- Test behavior, not implementation. Assert on outputs and side effects.
- One `describe` per class. Group related scenarios with nested `describe`.
- Use `beforeEach` to reset state. No shared mutable state between tests.
- Cover: happy path, validation errors, edge cases, business rule violations.
