---
name: add-endpoint-spring
description: Add a new Spring Boot REST endpoint wired to a Use Case, following Clean Architecture.
metadata:
  skill_type: micro
  stack: java-spring-gradle
---

# Add Endpoint (Spring Boot)

## Inputs

- **Module name** (e.g., `users`)
- **HTTP method + path** (e.g., `POST /api/users`)
- **Use case** to invoke (e.g., `CreateUser`)

## Steps

1. Create or update the controller at `src/main/java/{basePackage}/{module}/infrastructure/http/{Module}Controller.java`:

```java
@RestController
@RequestMapping("/api/{module}")
public class {Module}Controller {
    private final {UseCaseName} {useCaseName};

    public {Module}Controller({UseCaseName} {useCaseName}) {
        this.{useCaseName} = {useCaseName};
    }

    @{HttpMethod}Mapping("{subPath}")
    public ResponseEntity<{UseCaseName}Output> {methodName}(@RequestBody {UseCaseName}Input input) {
        var output = {useCaseName}.execute(input);
        return ResponseEntity.status({statusCode}).body(output);
    }
}
```

2. Add the endpoint to `docs/specs/{module}/endpoints.md`.
3. Update `docs/specs/{module}/route-mapping.md` if a frontend route consumes it.

## Rules

- Controllers do coordination only — NO business logic.
- Use `@Valid` and Jakarta Bean Validation annotations for input validation.
- Use proper HTTP status codes: 201 for creation, 200 for queries, 204 for deletes.
- Handle exceptions via `@ControllerAdvice`, not in individual controllers.
- Constructor injection only — no `@Autowired` on fields.
