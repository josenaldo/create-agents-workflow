---
name: create-usecase-spring
description: Scaffold a new Use Case class following Clean Architecture in a Java + Spring Boot project.
metadata:
  skill_type: micro
  stack: java-spring-gradle
---

# Create Use Case (Spring)

## Inputs

- **Module name** (e.g., `users`, `orders`)
- **Use case name** in PascalCase (e.g., `CreateUser`, `CancelOrder`)

## Steps

1. Determine the target path: `src/main/java/{basePackage}/{module}/application/usecases/{UseCaseName}.java`
2. Create the input/output DTOs:

```java
// {UseCaseName}Input.java
public record {UseCaseName}Input(
    // fields
) {}

// {UseCaseName}Output.java
public record {UseCaseName}Output(
    // fields
) {}
```

3. Create the use case class:

```java
@Service
public class {UseCaseName} {
    private final {Entity}Repository repository;

    public {UseCaseName}({Entity}Repository repository) {
        this.repository = repository;
    }

    public {UseCaseName}Output execute({UseCaseName}Input input) {
        // implementation
    }
}
```

4. Create or update the repository port interface in `{module}/application/ports/` if it doesn't exist.
5. Create the unit test: `src/test/java/{basePackage}/{module}/application/usecases/{UseCaseName}Test.java`
6. Follow TDD — write the test first, confirm RED, then implement.

## Rules

- Use cases MUST NOT import from `infrastructure/` package.
- Use Java records for Input/Output DTOs.
- Constructor injection only — no `@Autowired` on fields.
- One use case per file. One public class per file.
