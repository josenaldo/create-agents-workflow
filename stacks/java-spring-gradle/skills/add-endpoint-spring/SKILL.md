---
name: add-endpoint-spring
description: "Add a new Spring Boot REST endpoint wired to a Use Case following Clean Architecture. Use when the user says 'add endpoint', 'create route', 'new API', 'expose X via HTTP', 'add a GET/POST/PUT/DELETE'. Don't use for business logic — use create-usecase-spring. Don't use for tests — use write-unit-test-junit."
metadata:
  skill_type: micro
  stack: java-spring-gradle
---

# Add Endpoint (Spring Boot)

## Instructions

1. - [ ] Identify the module name (e.g., `users`), HTTP method + path (e.g., `POST /api/users`), and the use case to invoke (e.g., `CreateUser`).
2. - [ ] Verify the use case exists — if not, create it first using `create-usecase-spring`.
3. - [ ] Create or update the controller at `src/main/java/{basePackage}/{module}/infrastructure/http/{Module}Controller.java`:

```java
@RestController
@RequestMapping("/api/{module}")
public class {Module}Controller {
    private final {UseCaseName} {useCaseName};

    public {Module}Controller({UseCaseName} {useCaseName}) {
        this.{useCaseName} = {useCaseName};
    }

    @{HttpMethod}Mapping("{subPath}")
    public ResponseEntity<{UseCaseName}Output> {methodName}(@Valid @RequestBody {UseCaseName}Input input) {
        var output = {useCaseName}.execute(input);
        return ResponseEntity.status({statusCode}).body(output);
    }
}
```

4. - [ ] Add the endpoint to `docs/specs/{module}/endpoints.md`.
5. - [ ] Update `docs/specs/{module}/route-mapping.md` if a frontend route consumes it.
6. - [ ] Run `enforce-boundary` to verify the controller only depends on application layer.

## Critical

- Controllers do coordination only — business logic in controllers makes it untestable and couples HTTP to domain rules.
- Use `@Valid` on `@RequestBody` — without it, Jakarta Bean Validation annotations on the input DTO are silently ignored.
- Constructor injection only — `@Autowired` on fields breaks immutability and makes dependencies invisible to tests.
- Handle exceptions via `@ControllerAdvice` — per-method try/catch in controllers leads to inconsistent error responses across endpoints.

## Examples

**User says:** "Add a POST endpoint to create a new order."

**Actions:**
1. Module: `orders`, method: `POST /api/orders`, use case: `CreateOrder`.
2. Create `OrdersController.java` with constructor injection of `CreateOrder`.
3. Add `@PostMapping` method with `@Valid @RequestBody CreateOrderInput input`.
4. Return `ResponseEntity.status(HttpStatus.CREATED).body(output)`.
5. Update `docs/specs/orders/endpoints.md`.

**Result:** `POST /api/orders` endpoint created, validated, wired to `CreateOrder` use case.

## Troubleshooting

**Spring can't inject the use case** → Use case class is missing `@Service` annotation → Add `@Service` to the use case class or register it as a bean in a `@Configuration` class.

**Validation not working** → `@Valid` is missing on the `@RequestBody` parameter → Add `@Valid` before `@RequestBody`. Also verify `spring-boot-starter-validation` is in the dependencies.

**Wrong HTTP status returned** → Controller returns 200 for creation → Use `HttpStatus.CREATED` (201) for POST that creates resources, `HttpStatus.NO_CONTENT` (204) for DELETE operations.

## See also

- `create-usecase-spring` — create the use case this endpoint calls
- `write-unit-test-junit` — write tests for the controller or use case
- `enforce-boundary` — verify the controller doesn't leak business logic
