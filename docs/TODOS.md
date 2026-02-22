# WalletWise Backend – Todos

This document tracks pending tasks and completed items for the WalletWise backend project.

---

## Recently Completed

- [x] Category CRUD API (`GET/POST/PATCH/DELETE /api/v1/categories`) – Pro/Pro Trial gated
- [x] CSV/Excel export API (`GET /api/v1/transactions/export?format=csv|excel`)
- [x] Analytics API (`GET /api/v1/transactions/analytics`) with spending by category, monthly trend
- [x] `requireProPlus` middleware for Pro+ feature gating
- [x] OpenAPI 3.1 specification (`docs/openapi/openapi.yaml`)
- [x] API versioning under `/api/v1` (routes in `src/routes/v1/`)
- [x] API versioning policy (`docs/API_VERSIONING.md`)
- [x] Legacy unversioned routes removed (only `/api/v1` available)

---

## Deployment & Infrastructure

- [ ] Add production base URL (currently placeholder)
- [ ] Add deployment links (production and staging)

---

## IPA / API Compliance

From [docs/ipa/ipa-checklist.md](ipa/ipa-checklist.md):

- [x] Create OpenAPI 3.1 specification
- [x] Implement API versioning (e.g. `/v1`, `/v2`)
- [x] Document API versioning policy
- [ ] Identify and document idempotency rules for applicable operations

---

## Testing

- [ ] Add unit tests for core business logic
- [ ] Add API / integration tests for all public endpoints
- [ ] Add schema validation tests
- [ ] Add error handling tests
- [ ] Configure CI pipeline to run tests automatically

---

## Pro+ Features

- [x] Implement CSV/Excel export API endpoint (Pro+ tier)
- [x] Implement analytics API endpoint (Pro+ tier)

## Pro / Pro Trial Features

- [x] Custom category CRUD API (Pro / active Pro Trial)

---

## Priority Summary (Pending)

| Priority   | Item                  |
|-----------|------------------------|
| **Medium**| Unit & API tests       |
| **Medium**| Idempotency docs       |
| **Lower** | CI pipeline            |
| **Lower** | Deployment URLs        |
