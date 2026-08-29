---
name: test-case-quality
description: Use when you write, change, refactor, verify, or review a test, test case, test suite, spec, regression, unit, integration, coverage, or verification task; also when implementing a feature, fixing a bug, or refactoring that requires test changes, and when test files are read or edited. Do not use the full workflow for only running existing tests unless that run leads to test changes.
---

# Test Case Quality

Invoke this skill explicitly with `$test-case-quality` in Codex or `/test-case-quality` in Claude. It may also be selected automatically for the work described in its description.

Apply this workflow whenever tests are written, changed, refactored, or reviewed. A task that only runs existing tests is out of scope until its outcome requires a test change.

## Standard

Each new or changed test proves one scenario: one relevant actor or caller performs one coherent action or flow in one condition and observes one outcome. Split a test when it proves independent behaviors, conditions, or outcomes.

Write each test in Arrange, Act, Assert (AAA) order:

1. Arrange only the inputs, state, and collaborators needed for the scenario.
2. Act by performing the behavior under test once the setup is ready.
3. Assert the observable result of that behavior.

Use a title that states that observable result. Prefer a concrete subject, action, and outcome, such as `rejects a command after its timeout expires` or `returns no endpoint when the requested WebSocket endpoint is absent`. Keep assertions focused on behavior rather than implementation details such as private helper calls, incidental state shape, or call order unless that detail is the public contract.

Default to the relevant user flow at the public boundary: what a UI user, CLI user, API consumer, or other product-facing caller does and sees. For pure functions, schemas, concurrency, and comparable behavior that cannot be expressed as a user flow, test the technical contract from the caller's perspective instead. No per-test comment or code marker is required for that exception.

One scenario can need more than one assertion when those assertions jointly establish the same outcome. Treat enumerating language in a title as a prompt to check whether it combines independent scenarios. This includes `and`, `or`, `nor`, `&`, `/`, comma- or semicolon-separated actions or outcomes, `as well as`, `along with`, `plus`, `together with`, `in addition to`, `including`, `both ... and ...`, `either ... or ...`, `whether ... or ...`, and `not only ... but also ...`.

These expressions are not automatic failures. Split only when they combine independently meaningful behaviors, conditions, or outcomes; keep them when they describe one coherent flow or one result. For example, `returns a response with its status, headers, and body` may state one response contract, while `creates, returns, and deletes a handler` usually covers separate outcomes.

## Title vocabulary

Avoid titles that label a result without saying what the result is. The following words commonly hide the expected behavior:

- `correct` / `correctly`
- `proper` / `properly`
- `appropriate` / `appropriately`
- `desirable`
- `works`
- vague uses of `handles`, such as `handles invalid input`

This is guidance, not a mechanical banned-word list. A title is acceptable when it makes the condition and observable result clear. Replace vague wording by naming the outcome:

| Vague title                      | Observable title                                             |
| -------------------------------- | ------------------------------------------------------------ |
| `works with invalid input`       | `rejects a command when its JSON input is invalid`           |
| `handles missing data`           | `returns no handler when the requested ID is absent`         |
| `properly applies an update`     | `persists a handler behavior change in the session snapshot` |
| `correctly validates the schema` | `rejects a snapshot file that fails schema validation`       |

Useful result verbs include `returns`, `rejects`, `stores`, `persists`, `adds`, `removes`, `changes`, `shows`, `sends`, `keeps`, `uses`, and `does not`—but choose the verb that accurately states the observed behavior.

## Scenario-splitting examples

These representative title changes come from the #189–#192 test cleanup. They show how a compound or enumerating title becomes separately reviewable scenarios.

### Browser CLI (#189)

```ts
// Before
it("resolves matching responses and ignores malformed or unrelated messages", ...)

// After
it("resolves a response that matches the pending CDP command", ...)
it("keeps a pending command open after receiving a malformed CDP message", ...)
it("keeps a pending command open after receiving another command's response", ...)
```

### CLI core (#190)

```ts
// Before
it("parses positional, value, and boolean flags and rejects missing values", ...)

// After
it("parses a command with positional, value, and boolean flags", ...)
it("rejects a flag that requires a value when it is the final argument", ...)
it("rejects a flag that requires a value when the next argument is another flag", ...)
```

### Core (#191)

```ts
// Before
it("initializes server, writes snapshot, and applies external behavior changes", ...)

// After
it("registers HTTP handlers when a Node Dev Tool session starts", ...)
it("writes the initial HTTP handler snapshot when a Node Dev Tool session starts", ...)
it("applies an external handler behavior change during Node session synchronization", ...)
```

### Node CLI (#192)

```ts
// Before
it("prints help and rejects unknown commands", ...)

// After
it("prints command help when called without a command", ...)
it("prints command help when called with --help", ...)
it("rejects an unknown command", ...)
```

In contrast, assertions such as a returned response's status, headers, and body may remain together when they establish the one promised response. A title such as `creates, returns, and deletes a handler` usually covers separate outcomes and should be split.

## Workflow

Before writing or changing a test:

1. State the single scenario in terms of its actor or caller, action, condition, and observable outcome.
2. Decide whether it can be expressed as a user flow. Use a caller-facing technical contract only when a user flow does not fit.
3. When the title uses enumerating language, explicitly check whether each listed action, condition, or outcome needs its own scenario before adding setup or assertions.

While writing or refactoring:

1. Keep Arrange, Act, and Assert in that order.
2. Make setup serve only the scenario under test.
3. Name the observable outcome and remove vague result words where they conceal it.
4. Keep implementation-level assertions only when they are themselves the relevant contract.

When reviewing tests, apply the same checks and identify missing scenario separation, AAA breaks, unclear outcomes, user-flow gaps, and unjustified implementation coupling. Recommend the smallest change that makes the behavior clear.

## Required final report

For every task that writes, changes, refactors, or reviews tests, include a short **Test Quality Report** in the final response. State:

- scenario or scenarios covered or reviewed;
- whether AAA order was confirmed;
- whether the tests follow a user flow, or why a caller-facing technical contract was used;
- whether a technical-contract exception was used.

This is a working standard, not an automatic enforcement mechanism. Do not add CI rules, test annotations, or unrelated policy files solely to enforce it.
