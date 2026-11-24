---
name: manual-test-case-author
description: >-
  Writes Marlow manual / QA test case markdown under docs/test-cases. Use when
  the user asks for a manual test case, QA checklist, exploratory case, or
  pre-automation test steps.
---

# Manual test case author

## Instructions

1. Follow [`.cursor/rules/manual-test-cases.mdc`](../../rules/manual-test-cases.mdc) and [`.cursor/rules/tests.mdc`](../../rules/tests.mdc).
2. Create or update `docs/test-cases/<topic>.md`.
3. Use clear preconditions, steps, and expected results. Prefer `data-testid` (and iOS accessibility ids when relevant) in steps.
4. Use seed logins from `tests.mdc` (customer / staff / admin).
5. Tag or section cases by likely automation layer (API / browser e2e / mock UI / mock component / iOS e2e) when obvious.
6. When the user later says a case is ready to automate, hand off via the split in `tests.mdc`.

## Doc shape

```md
# Shop — customer browse

## Preconditions

- Shop running (`npm run dev`)
- Customer: customer@marlow.test / datalab

## Cases

### Opens shop after sign-in

1. Sign in as customer.
2. Land on `/` — see `[data-testid=shop-title]` = "Shop".
3. See `[data-testid=nav-user]` contains customer@marlow.test.
```

## Checklist

- [ ] File under `docs/test-cases/`
- [ ] Preconditions + steps + expected results
- [ ] Test ids / accessibility ids where UI is involved
