---
name: functional-change-description-skill
description: Generate a PR feature specification from changed test cases and the implementation diff, grouped around observable user behavior.
---

# Functional Change Description

Invoke this skill with `$functional-change-description-skill` in Codex or `/functional-change-description-skill` in Claude.

Generate the feature specification for a PR from these inputs:

- the changed test cases, including their titles, setup, actions, and assertions;
- the implementation diff associated with those tests.

The implementation diff explains what was changed. The tests establish which behavior is intentionally observable. Do not require test execution results as an input.

## Workflow

1. Identify the base and changed behavior from the implementation diff. Read the relevant surrounding code when a diff fragment is insufficient.
2. Read every changed test scenario and trace its actor or caller, action, condition, and observable outcome. Prefer the product-facing flow: what a UI user, CLI user, API consumer, or application author can do or observe.
3. Use the implementation diff to validate the behavior described by the tests. Treat implementation-only refactors, new helpers, and internal state changes as evidence only; do not describe them as features unless a test or public contract makes them observable.
4. Classify each supported behavior as:
   - **Removed Spec** — an existing observable behavior is no longer available or is explicitly deleted.
   - **Changed Spec** — an existing observable behavior remains but its input, condition, output, or user-visible result changed. Show the behavior before and after.
   - **Added Spec** — a new observable behavior is introduced without replacing an existing behavior.
   A new or expanded regression test does not by itself make a behavior added. If the implementation preserves an existing contract and the test only protects it, leave that behavior out of the output.
5. Group related changes across packages by the user's flow and remove duplicate descriptions. Mention package boundaries only when they clarify the flow.
6. Do not infer behavior that is absent from both the changed tests and the implementation diff. If the evidence is ambiguous, omit the claim rather than speculate.
7. Return only the following Markdown structure. Use `None` for every section with no supported entries:

```md
### Removed Spec
- ...

### Changed Spec
| Before | After |
| --- | --- |
| ... | ... |

### Added Spec
- ...
```

Write each entry in terms of the behavior a user or caller can observe, not internal function or store names. Preserve concrete details that the evidence establishes, such as supported request fields, response values, status, headers, fallback behavior, or validation outcomes. Do not add implementation rationale, test-run claims, or unsupported limitations to the output.
