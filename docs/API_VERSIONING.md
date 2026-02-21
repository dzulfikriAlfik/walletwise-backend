# API Versioning Policy

WalletWise backend uses URL path versioning for its REST API.

## Version Format

- **Current version:** `v1`
- **Base path:** `/api/v1`

Example: `GET /api/v1/wallets`

## Versioning Strategy

1. **URL path versioning:** Versions are included in the path (e.g. `/api/v1`, `/api/v2`).
2. **Stability within a version:** No breaking changes within the same major version. New endpoints, optional fields, and new enum values are allowed.
3. **Breaking changes:** When breaking changes are unavoidable, a new version (e.g. `v2`) is released. The previous version remains available during a deprecation period.

## Breaking vs Non-Breaking Changes

### Non-Breaking (allowed in v1)

- Adding new endpoints
- Adding optional request/response fields
- Adding new enum values
- Adding new error codes
- Relaxing validation (e.g. increasing max length)

### Breaking (requires new version)

- Removing endpoints
- Removing or renaming fields
- Changing field types
- Adding required fields to existing requests
- Changing error response structure
- Restricting validation (e.g. decreasing max length)

## OpenAPI Specification

The OpenAPI 3.1 specification is available at:

- **Local:** `GET http://localhost:3000/api/v1/openapi.yaml`
- **Production:** `GET {BASE_URL}/api/v1/openapi.yaml`

The spec documents all endpoints, request/response schemas, and error formats.
