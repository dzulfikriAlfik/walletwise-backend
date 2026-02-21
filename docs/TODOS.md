# WalletWise Backend – Unimplemented Todos

This document tracks pending tasks and unimplemented items for the WalletWise backend project.

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

- [ ] Implement CSV/Excel export API endpoint (Pro+ tier)
- [ ] Implement analytics API endpoint (Pro+ tier)

---

## Priority Summary

| Priority  | Item                             |
|----------|-----------------------------------|
| **High** | OpenAPI 3.1 specification         |
| **High** | API versioning                    |
| **Medium** | CSV/Excel export API            |
| **Medium** | Analytics API                    |
| **Lower** | Unit & API tests                 |
| **Lower** | CI pipeline                      |
| **Lower** | Deployment URLs                  |
