---
name: enforce-boundary
description: Verify Clean Architecture layer boundaries — domain and application must not import infrastructure.
---

# Enforce Boundary

Run as the final step on any code change.

## Checks

1. **Domain layer** (`domain/`):
   - MUST NOT import from `application/` or `infrastructure/`
   - MUST NOT import framework-specific modules (HTTP, ORM, etc.)

2. **Application layer** (`application/`):
   - MUST NOT import from `infrastructure/`
   - MAY import from `domain/`

3. **Infrastructure layer** (`infrastructure/`):
   - MAY import from `domain/` and `application/`

## How to verify

Search for disallowed imports in changed files. Report violations with file path and line number.
Flag but do not auto-fix — the developer decides how to resolve.
