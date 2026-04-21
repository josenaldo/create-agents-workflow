---
name: write-unit-test-jest
description: "Write a unit test for a Use Case or domain entity using Jest in a TypeScript + Node project. Use when the user says 'write test', 'add tests', 'test this', 'TDD', 'cover X with tests'. Don't use for integration tests with real databases. Don't use for API endpoint tests — test the use case directly."
metadata:
  skill_type: micro
  stack: ts-node-npm
---

# Write Unit Test (Jest)

## Instructions

1. - [ ] Identify the target class or function to test (e.g., `CreateUser` use case, `User` entity).
2. - [ ] Determine the test file path — mirror the source path with `.test.ts` suffix:
   - `src/{module}/application/use-cases/CreateUser.ts` → `src/{module}/application/use-cases/CreateUser.test.ts`
   - `src/{module}/domain/entities/User.ts` → `src/{module}/domain/entities/User.test.ts`
3. - [ ] Create the test file with `describe`/`beforeEach`/`it` structure:

```typescript
import { InMemory{Entity}Repository } from '../../../../tests/fakes/InMemory{Entity}Repository';
import { {UseCaseName}, {UseCaseName}Input } from './{UseCaseName}';

describe('{UseCaseName}', () => {
  let repository: InMemory{Entity}Repository;
  let sut: {UseCaseName};

  beforeEach(() => {
    repository = new InMemory{Entity}Repository();
    sut = new {UseCaseName}(repository);
  });

  it('should {expected behavior} when {condition}', async () => {
    // Arrange
    const input: {UseCaseName}Input = { field1: 'value', field2: 42 };

    // Act
    const result = await sut.execute(input);

    // Assert
    expect(result.field).toBe(expected);
  });

  it('should throw when {error condition}', async () => {
    await expect(sut.execute(invalidInput)).rejects.toThrow({ErrorType});
  });
});
```

4. - [ ] Run the test: `npm run test:unit -- --testPathPattern={test-file}`
5. - [ ] Confirm RED (test fails for the right reason) before implementing.
6. - [ ] After implementation, verify all tests pass: `npm test`.

## Critical

- Use in-memory implementations of repository ports — mocking with `jest.fn()` hides bugs and tests implementation details instead of behavior.
- Use `beforeEach` to reset state — shared mutable state between tests causes flaky test suites that fail in random order.
- Name tests descriptively: `should {outcome} when {condition}` — vague names like `test case 1` make failures impossible to diagnose.
- One `describe` per class, nested `describe` for scenarios — flat test files become unreadable past 5 test cases.

## Examples

**User says:** "Write tests for the CancelOrder use case."

**Actions:**
1. Target: `CancelOrder` in `src/orders/application/use-cases/CancelOrder.ts`.
2. Create test at same path with `.test.ts` suffix.
3. `describe('CancelOrder')` with `beforeEach` creating `InMemoryOrderRepository` and `sut`.
4. Write tests:
   - `should change status to cancelled when order exists`
   - `should throw OrderNotFoundError when order does not exist`
   - `should throw OrderAlreadyCancelledError when already cancelled`
5. Run: `npm run test:unit -- --testPathPattern=CancelOrder`.

**Result:** 3 tests created, all RED initially. After implementing `CancelOrder.execute`, all pass.

## Troubleshooting

**TypeScript import errors in tests** → `Cannot find module` → Check `tsconfig.json` has paths configured for test files, or use relative imports consistently.

**In-memory repository missing** → `Cannot find module` on fakes → Create `tests/fakes/InMemory{Entity}Repository.ts` implementing the port interface with a `Map` for storage.

**Async test timeout** → Jest hangs on async test → Ensure the use case `execute` resolves or rejects. Avoid `setTimeout` in production code without proper cleanup.

## See also

- `create-usecase` — create the use case to test
- `add-endpoint-express` — create the HTTP endpoint that calls the use case
- `enforce-boundary` — verify test doesn't import from wrong layers
