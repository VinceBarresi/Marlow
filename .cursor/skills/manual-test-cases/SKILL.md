---
name: manual-test-cases
description: >-
  Authors manual QA test cases as Markdown for Marlow. Use when the user asks
  for a manual test, test case, QA checklist, test plan, or exploratory test
  script—not automated Cypress, Playwright, or Jest tests.
---

# Manual test cases

## Instructions

1. Follow [`.cursor/rules/manual-test-cases.mdc`](../../rules/manual-test-cases.mdc) and [`.cursor/skills/_shared/marlow-test-conventions.md`](../_shared/marlow-test-conventions.md).
2. Clarify the feature/flow if the user did not name one.
3. Write a new file under `docs/test-cases/` (kebab-case name, e.g. `docs/test-cases/checkout-guest.md`).
4. Include at least one **happy path** and one **negative / edge** case.
5. Prefer `data-testid` in steps; if a control lacks one, note it and add a test id in product code when reasonable.
6. Do not invent credentials; use seed logins from the shared conventions.
7. **Handoff:** When the user says the manual case is done / ready to automate, do not stop at markdown—read the file and continue with `api-test-author`, `e2e-test-author`, and/or `stubbed-ui-test-author` per [`.cursor/rules/test-creation.mdc`](../../rules/test-creation.mdc) (API vs UI vs stubbed split).

## Template

```markdown
# <Feature / flow name>

## Meta
- Area: <shop | account | admin | api | ...>
- Priority: <P0 | P1 | P2>
- Type: manual

## Preconditions
- App running (`npm run dev` or e2e stack)
- Signed in as: <role / email> (or signed out)
- Data: <seed state or setup>

## Cases

### TC-1: <Happy path title>
**Steps**
1. ...
2. ...

**Expected**
- ...

### TC-2: <Negative / edge title>
**Steps**
1. ...

**Expected**
- ...

## Notes
- ...
```

## Examples

User: “Write manual cases for customer login.”

→ Create `docs/test-cases/customer-login.md` with successful sign-in and wrong-password cases using `customer@marlow.test` / `datalab` and test ids like `login-email`, `login-submit`, `login-error`.
