---
name: write-unit-test-junit
description: "Write a unit test for a Use Case or domain entity using JUnit 5 and AssertJ in a Java + Spring Boot project. Use when the user says 'write test', 'add tests', 'test this', 'TDD', 'cover X with tests'. Don't use for integration tests with Spring context — those require @SpringBootTest. Don't use for HTTP endpoint tests — test the use case directly."
metadata:
  skill_type: micro
  stack: java-spring-gradle
---

# Write Unit Test (JUnit 5)

## Instructions

1. - [ ] Identify the target class to test (e.g., `CreateUser` use case, `User` entity).
2. - [ ] Determine the test file path — mirror the source under `src/test/java/`:
   - `src/main/java/.../usecases/CreateUser.java` → `src/test/java/.../usecases/CreateUserTest.java`
3. - [ ] Create the test file:

```java
class {ClassName}Test {
    private InMemory{Entity}Repository repository;
    private {ClassName} sut;

    @BeforeEach
    void setUp() {
        repository = new InMemory{Entity}Repository();
        sut = new {ClassName}(repository);
    }

    @Test
    @DisplayName("should {expected behavior} when {condition}")
    void {testMethodName}() {
        // Arrange
        var input = new {ClassName}Input(/* fields */);

        // Act
        var result = sut.execute(input);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.field()).isEqualTo(expected);
    }

    @Test
    @DisplayName("should throw when {error condition}")
    void {testMethodName}_error() {
        assertThatThrownBy(() -> sut.execute(invalidInput))
            .isInstanceOf({ExceptionType}.class);
    }
}
```

4. - [ ] Run the test: `./gradlew test --tests '*{ClassName}Test*'`
5. - [ ] Confirm RED (test fails for the right reason) before implementing.
6. - [ ] After implementation, verify all tests pass.

## Critical

- Use in-memory implementations of repository ports — mocking the database with Mockito hides bugs and tests implementation details instead of behavior.
- Use AssertJ (`assertThat`) over plain JUnit assertions — AssertJ provides fluent, readable assertions with better error messages.
- Use `@DisplayName` for every test — method names like `test1` or `testCreateUser` don't describe expected behavior.
- One test class per production class, use `@Nested` for grouping scenarios — flat lists of 20+ test methods become unreadable.

## Examples

**User says:** "Write tests for the CancelOrder use case."

**Actions:**
1. Target: `CancelOrder` in `src/main/java/.../usecases/CancelOrder.java`.
2. Create `CancelOrderTest.java` in `src/test/java/.../usecases/`.
3. Write tests:
   - `@DisplayName("should cancel order when order exists and is cancellable")` — arrange existing order, act cancel, assert status and timestamp.
   - `@DisplayName("should throw when order not found")` — empty repo, assert `OrderNotFoundException`.
   - `@DisplayName("should throw when order already cancelled")` — cancelled order, assert `OrderAlreadyCancelledException`.
4. Run: `./gradlew test --tests '*CancelOrderTest*'`.

**Result:** 3 tests created, all RED initially. After implementing `CancelOrder.execute`, all pass.

## Troubleshooting

**In-memory repository missing** → Test can't compile → Create an implementation of the port interface using a `HashMap<UUID, Entity>` in `src/test/java/.../fakes/`.

**AssertJ not available** → Import errors → Add `org.assertj:assertj-core` to `testImplementation` in `build.gradle`. It should already be included via `spring-boot-starter-test`.

**Test passes but shouldn't** → Assertion is too lenient → Use specific assertions: `assertThat(result.status()).isEqualTo(Status.CANCELLED)` instead of `assertThat(result).isNotNull()`.

## See also

- `create-usecase-spring` — create the use case to test
- `add-endpoint-spring` — create the HTTP endpoint that calls the use case
- `enforce-boundary` — verify test doesn't import from wrong layers
