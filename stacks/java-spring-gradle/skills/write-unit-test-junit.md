---
name: write-unit-test-junit
description: Write a unit test for a Use Case or domain entity using JUnit 5 in a Java + Spring Boot project.
---

# Write Unit Test (JUnit 5)

## Inputs

- **Target** — the class to test (e.g., `CreateUser` use case, `User` entity)

## Steps

1. Determine test file path — mirror the source under `src/test/java/`:
   - `src/main/java/.../usecases/CreateUser.java` → `src/test/java/.../usecases/CreateUserTest.java`

2. Structure the test:

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
        var input = new {ClassName}Input(/* ... */);

        // Act
        var result = sut.execute(input);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.field()).isEqualTo(expected);
    }

    @Test
    @DisplayName("should throw when {error condition}")
    void {testMethodName}() {
        assertThatThrownBy(() -> sut.execute(invalidInput))
            .isInstanceOf({ExceptionType}.class);
    }
}
```

3. Run the test: `./gradlew test --tests '*{ClassName}Test*'`
4. Confirm RED (test fails for the right reason) before implementing.

## Rules

- Use in-memory implementations of repository ports — NEVER mock the database directly.
- Use AssertJ (`assertThat`) over plain JUnit assertions for readability.
- Use `@DisplayName` for human-readable test descriptions.
- One test class per production class. Use `@Nested` for grouping scenarios.
- Cover: happy path, validation errors, edge cases, business rule violations.
