# IPA Compliance Checklist

This checklist defines the acceptance criteria for evaluating the repository against:
- IPA Design Quality Level 2
- IPA API Quality Level 2+ (Intermediate between Level 2 and Level 3)
- IPA Test Quality Level 2

All evaluations must provide concrete evidence such as file paths, folder structures, function names, or configuration files.
If evidence cannot be found, the item must be marked as UNKNOWN.

---

## 1. Design Quality (IPA Level 2)

### 1.1 Module Structure and Responsibility
- [ ] Modules are clearly separated by responsibility (e.g., controller, service, domain, infrastructure).
- [ ] Each module has a single, well-defined responsibility.
- [ ] Business logic is not mixed with transport or framework-specific logic.

### 1.2 Naming Consistency
- [ ] Naming conventions for files, folders, classes, and functions are consistent across the codebase.
- [ ] Function names clearly express intent and responsibility.
- [ ] No ambiguous or misleading naming is used.

### 1.3 Architectural Consistency
- [ ] External specifications (API design, data models) align with the internal architecture.
- [ ] Internal modules are not tightly coupled to external specifications.
- [ ] Changes to external interfaces do not require widespread internal changes.

### 1.4 Dependency Direction
- [ ] High-level modules do not depend directly on low-level implementation details.
- [ ] Dependency direction is consistent throughout the project.
- [ ] Shared utilities are clearly separated from business logic.

### 1.5 Documentation
- [ ] Design policies are documented.
- [ ] Directory structure is documented.
- [ ] Basic usage instructions are documented (e.g., README).
- [ ] Documentation reflects the current implementation.

### 1.6 Maintainability and Extensibility
- [ ] Source code is readable and easy to understand.
- [ ] Functions and classes are reasonably sized and focused.
- [ ] The design supports future feature additions without major refactoring.

---

## 2. API Quality (IPA Level 2+)

### 2.1 API Specification
- [ ] API specifications are defined using OpenAPI 3.1.
- [ ] API specifications maintain compatibility with OpenAPI 3.0 clients.
- [ ] API specifications are published or accessible to consumers.

### 2.2 API Versioning
- [ ] API versioning strategy is clearly defined (e.g., /v1, /v2).
- [ ] Breaking changes are not introduced within the same API version.
- [ ] Breaking changes are released as a new API version when unavoidable.
- [ ] API versioning policy is documented.

### 2.3 Request and Response Consistency
- [ ] Request payloads conform to defined schemas.
- [ ] Response payloads conform to defined schemas.
- [ ] Field naming and data structures are consistent across endpoints.

### 2.4 Error Handling
- [ ] Error responses follow a unified format.
- [ ] Error responses include standardized error codes.
- [ ] Error messages are meaningful and consistent.
- [ ] Error handling behavior is predictable across endpoints.

### 2.5 Contract and Schema Validation
- [ ] Schema consistency is verified using contract tests.
- [ ] Contract tests are automated.
- [ ] Contract tests are executed as part of CI.

### 2.6 Idempotency
- [ ] Operations that require idempotency are identified.
- [ ] Idempotent behavior is implemented where technically feasible.
- [ ] Idempotency rules are documented.

---

## 3. Test Quality (IPA Level 2)

### 3.1 Unit Testing
- [ ] Unit tests are implemented for major functional units.
- [ ] Business logic is testable in isolation.
- [ ] Unit tests are maintainable and readable.

### 3.2 API Testing
- [ ] API input/output tests are implemented for all public endpoints.
- [ ] API tests validate both success and failure cases.
- [ ] API tests reflect actual API behavior.

### 3.3 Schema Validation Testing
- [ ] Schema validation tests are implemented.
- [ ] Schema validation tests are automated.
- [ ] Schema validation tests are executable without manual steps.

### 3.4 Error Handling Tests
- [ ] Tests exist for invalid inputs.
- [ ] Tests exist for unexpected or edge-case scenarios.
- [ ] Error-handling behavior is verified by tests.

### 3.5 Continuous Integration
- [ ] Tests are executed automatically via CI.
- [ ] CI fails when tests do not pass.
- [ ] Test execution is consistent across environments.

---

## 4. Evaluation Rules

- Each checklist item must be marked as PASS, FAIL, or UNKNOWN.
- PASS requires concrete evidence (file path, code reference, or configuration).
- FAIL must include a brief reason and suggested remediation.
- UNKNOWN must be used if evidence cannot be found.
- Overall compliance is determined per section (Design, API, Test).

---

## 5. Output Expectations

The evaluation output should include:
- PASS / FAIL / UNKNOWN for each checklist item
- Evidence references (file paths and notes)
- A summary of critical gaps
- A remediation task list prioritized by impact

