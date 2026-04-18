---
name: add-endpoint-gin
description: Add a new Gin HTTP endpoint wired to a Use Case, following Clean Architecture.
metadata:
  skill_type: micro
  stack: go
---

# Add Endpoint (Gin)

## Inputs

- **Module name** (e.g., `users`)
- **HTTP method + path** (e.g., `POST /api/users`)
- **Use case** to invoke (e.g., `CreateUser`)

## Steps

1. Create or update the handler at `internal/{module}/infrastructure/http/{module}_handler.go`:

```go
package http

import (
    "net/http"

    "github.com/gin-gonic/gin"
    "internal/{module}/application/usecases"
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

    c.JSON(http.Status{StatusCode}, output)
}
```

2. Register the route in the router setup (e.g., `internal/infrastructure/http/router.go`):
   ```go
   {module}Group := router.Group("/api/{module}")
   {module}Group.{METHOD}("/", handler.{MethodName})
   ```

3. Add the endpoint to `docs/specs/{module}/endpoints.md`.
4. Update `docs/specs/{module}/route-mapping.md` if a frontend route consumes it.

## Rules

- Handlers do coordination only — NO business logic.
- Use `ShouldBindJSON` for input binding and validation (add struct tags for constraints).
- Use proper HTTP status codes: 201 for creation, 200 for queries, 204 for deletes.
- Always pass `c.Request.Context()` to use cases for cancellation propagation.
- Handle errors with a centralized middleware when the project grows.
