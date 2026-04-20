---
name: create-usecase-spring
description: "Scaffold a new Use Case class following Clean Architecture with TDD in a Java + Spring Boot project. Use when the user says 'create use case', 'new service', 'new business operation', 'add X logic', 'implement Y feature'. Don't use for HTTP endpoints — use add-endpoint-spring. Don't use for frontend components — use create-component-mantine or create-component-mui."
metadata:
  skill_type: micro
  stack: java-spring-gradle
---

# Create Use Case (Spring)

## Instructions

1. - [ ] Identify the module name (e.g., `users`) and use case name in PascalCase (e.g., `CreateUser`).
2. - [ ] Determine the target path: `src/main/java/{basePackage}/{module}/application/usecases/{UseCaseName}.java`.
3. - [ ] Create the input/output DTOs as Java records:

```java
// {UseCaseName}Input.java
public record {UseCaseName}Input(
    @NotBlank String field1,
    @NotNull Long field2
) {}

// {UseCaseName}Output.java
public record {UseCaseName}Output(
    UUID id,
    String field1,
    Instant createdAt
) {}
```

4. - [ ] Create or update the repository port interface in `{module}/application/ports/` if it doesn't exist:

```java
public interface {Entity}Repository {
    {Entity} save({Entity} entity);
    Optional<{Entity}> findById(UUID id);
}
```

5. - [ ] Create the use case class:

```java
@Service
public class {UseCaseName} {
    private final {Entity}Repository repository;

    public {UseCaseName}({Entity}Repository repository) {
        this.repository = repository;
    }

    public {UseCaseName}Output execute({UseCaseName}Input input) {
        // 1. Validate input
        // 2. Execute business logic
        // 3. Persist via repository
        // 4. Return output
    }
}
```

6. - [ ] Create the unit test first (TDD): `src/test/java/{basePackage}/{module}/application/usecases/{UseCaseName}Test.java`.
7. - [ ] Run the test — confirm RED (fails for the right reason).
8. - [ ] Implement the `execute` method to make the test pass.
9. - [ ] Run `enforce-boundary` to verify no layer violations.

## Critical

- Use cases MUST NOT import from `infrastructure/` — this breaks testability and couples business logic to Spring/JPA/HTTP.
- Use Java records for Input/Output DTOs — they are immutable, concise, and automatically provide `equals`, `hashCode`, and `toString`.
- Constructor injection only — `@Autowired` on fields hides dependencies, prevents immutability, and complicates testing.
- One use case per file, one public class per file — multiple use cases in one file makes them hard to find and test independently.

## Examples

**User says:** "Create a use case to cancel an order."

**Actions:**
1. Module: `orders`, use case: `CancelOrder`.
2. Path: `src/main/java/com/example/orders/application/usecases/CancelOrder.java`.
3. Input: `CancelOrderInput(UUID orderId, String reason)`.
4. Output: `CancelOrderOutput(UUID orderId, Instant cancelledAt)`.
5. Port: `OrderRepository` with `findById` and `save`.
6. Test first: verify order found, status changes, reason stored, timestamp set.
7. Implement: find order → validate cancellable → update status → save → return output.

**Result:** `CancelOrder.java`, `CancelOrderInput.java`, `CancelOrderOutput.java`, and `CancelOrderTest.java` created. Tests pass, no boundary violations.

## Troubleshooting

**Spring can't find the bean** → Use case is not in a package scanned by `@ComponentScan` → Ensure the use case class has `@Service` and is under the base package configured in the main application class.

**Circular dependency** → Two use cases depend on each other → Extract shared logic into a domain service in the `domain/` layer. Use cases should be independent orchestrators, not peers.

**Record validation not triggering** → `@NotBlank` on record fields is ignored → Ensure `spring-boot-starter-validation` is in dependencies and `@Valid` is used on the input parameter at the controller level.

## See also

- `add-endpoint-spring` — expose this use case via HTTP
- `write-unit-test-junit` — detailed unit test patterns for JUnit 5
- `enforce-boundary` — verify Clean Architecture layer rules
