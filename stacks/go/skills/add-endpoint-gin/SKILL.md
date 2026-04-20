---
name: add-endpoint-gin
description: "Add a new Gin HTTP endpoint wired to a Use Case following Clean Architecture in a Go project. Use when the user says 'add endpoint', 'create route', 'new API', 'expose X via HTTP', 'add a GET/POST/PUT/DELETE'. Don't use for business logic — use create-usecase-go. Don't use for tests — use write-unit-test-go."
metadata:
  skill_type: micro
  stack: go
---

# Add Endpoint (Gin)

## Instructions

1. - [ ] Identify the module name (e.g., `users`), HTTP method + path (e.g., `POST /api/users`), and the use case to invoke (e.g., `CreateUser`).
2. - [ ] Create or update the handler at `internal/{module}/infrastructure/http/{module}_handler.go`:

```go
package http

import (
    "net/http"

    "github.com/gin-gonic/gin"
    "{project}/internal/{module}/application/usecases"
)

type {Module}Handler struct {
    {useCaseName} *usecases.{UseCaseName}
}

func New{Module}Handler({useCaseName} *usecases.{UseCaseName}) *{Module}Handler {
    return &{Module}Handler{{useCaseName}: {useCaseName}}
}

func (h *{Module}Handler) {MethodName}(c *gin.Context) {
    var input usecases.{UseCaseName}Input
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    output, err := h.{useCaseName}.Execute(c.Request.Context(), input)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, output)
}
```

3. - [ ] Register the route in the router setup (e.g., `internal/infrastructure/http/router.go`):
   ```go
   {module}Group := router.Group("/api/{module}")
   {module}Group.{METHOD}("/", handler.{MethodName})
   ```

4. - [ ] Add the endpoint to `docs/specs/{module}/endpoints.md`.
5. - [ ] Update `docs/specs/{module}/route-mapping.md` if a frontend route consumes it.
6. - [ ] Verify the use case exists — if not, create it first using `create-usecase-go`.

## Critical

- Handlers do coordination only — business logic in handlers makes it untestable and couples HTTP to domain rules.
- Always pass `c.Request.Context()` to use cases — without context propagation, cancellation and timeouts won't work.
- Use `ShouldBindJSON` (not `BindJSON`) — `BindJSON` writes the error response automatically, removing control over error format.
- Use correct HTTP status codes: 201 for creation, 200 for queries, 204 for deletes, 400 for validation errors — wrong codes confuse API consumers.

## Examples

**User says:** "Add a POST endpoint to create a new order."

**Actions:**
1. Module: `orders`, method: `POST /api/orders`, use case: `CreateOrder`.
2. Create `internal/orders/infrastructure/http/orders_handler.go` with `NewOrdersHandler` and `Create` method.
3. Bind input with `ShouldBindJSON`, call `CreateOrder.Execute(c.Request.Context(), input)`.
4. Return `c.JSON(http.StatusCreated, output)`.
5. Register in router: `ordersGroup.POST("/", handler.Create)`.
6. Update `docs/specs/orders/endpoints.md`.

**Result:** `POST /api/orders` endpoint created, wired to `CreateOrder` use case, documented in specs.

## Troubleshooting

**Handler can't find use case** → Import path is wrong → Verify the use case exists at `internal/{module}/application/usecases/` and the import path matches the Go module path in `go.mod`.

**Input binding always fails** → JSON fields don't match struct tags → Ensure the `Input` struct has `json:"fieldName"` tags matching the request body field names.

**Context not propagating** → Use case ignores cancellation → Confirm the handler passes `c.Request.Context()` (not `context.Background()`) and the use case accepts `context.Context` as its first parameter.

## See also

- `create-usecase-go` — create the use case this endpoint calls
- `write-unit-test-go` — write tests for the handler or use case
- `enforce-boundary` — verify the handler doesn't leak business logic
