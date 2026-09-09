---
name: documentation-review
description: Audit this repository's English developer documentation against its code, types, CLI and UI contracts, reporting evidence-based findings and actionable rewrites without editing documentation or source files.
---

# Documentation Review

Use this skill for a full documentation audit or for reviewing a documentation change. The report follows the user's language, even though the source documentation is normally English.

## Non-negotiable boundary

- Review only. Do not edit documentation, source, tests, generated output, or configuration.
- Do not invent a project term, API behavior, command syntax, or migration path. If the repository and authoritative ecosystem documentation do not establish a claim, report it as **unverified** rather than guessing.
- Treat the repository's implementation as the primary source of truth. Use external sources for ecosystem terminology and standards, not to override the implementation.
- Do not assign numeric scores or an overall grade. Group one root cause across affected locations and report each root cause once.

## Modes and workflow

1. Identify the requested scope, audience, and mode. For a full audit, inventory all relevant source docs. For a change review, inspect `git diff` and the surrounding pages, then check links and duplicated claims that the change may affect. Do not broaden a change review merely because another page could be improved.
2. Build a document inventory and a user journey: entry point, prerequisites, install/setup, first successful result, recovery/reset, and next step. Mark canonical pages, hidden pages, redirects, README copies, and isolated or competing content using [project-profile.md](references/project-profile.md).
3. Build a claim/evidence matrix. For every API, import, type, CLI command, JSON example, default, support claim, and project-specific term, verify in this order: package exports and public types; implementation and schemas; CLI/UI code; focused tests; then official ecosystem documentation. Use repository-wide `rg` search (excluding generated output and dependencies) before calling a term unsupported. Record the exact path, symbol, test, command, or URL used as evidence.
4. Evaluate technical correctness and task completion before prose or formatting. Check copied examples end to end: install, working directory, prerequisites, command/code, expected result, cleanup, and whether examples on different pages conflict.
5. Check information architecture, relevance, terminology, clarity, accessibility, safety, consistency, freshness, and maintainability with [rubric.md](references/rubric.md). Recommend a list, table, tab, callout, or separate section only when it materially improves scanning for the stated audience.
6. Run proportionate read-only verification where possible. Prefer the repository's existing scripts (for example, docs build, typecheck, lint, or focused tests); record commands and failures. Never treat a successful build as proof that prose or runtime claims are correct.
7. Produce the report format below. Include a concise limitation when a claim could not be exercised or when generated/runtime state was unavailable.

## Evidence rules

- Quote only the smallest useful fragment; prefer a paraphrase plus a file-and-line location.
- Distinguish **implemented**, **documented**, **officially defined**, **runtime-observed**, and **unverified** claims.
- A wording preference alone is not a finding. A terminology finding requires evidence from a public API/type/CLI/UI label, a recognized standard term (for example MSW, CDP, HTTP, or WebSocket), an official ecosystem source, or an explicit project definition.
- When the same concept is named in multiple ways, show the canonical observed name and list the affected locations. Do not “simplify” a standard term if that changes its meaning.
- Do not flag a valid project-specific term merely because it is unfamiliar; flag it only when it is undefined, unnecessary, inconsistent, or unsupported by repository evidence.
- For dangerous commands or runtime mutations, verify scope, warning, isolated profile/data, and cleanup/termination instructions. For browser CLI work, follow the repository's separate Chrome profile and target-selection procedure in `AGENTS.md`; use Browser CLI for mutations and Chrome DevTools inspection for the visible result.

## Severity

Use exactly one severity per root cause:

- `blocker`: cannot run, contradicts the current API, or creates data/security/operational risk.
- `high`: prevents a core task or produces a wrong result; a missing prerequisite or recovery path can be high when the task commonly fails without it.
- `medium`: causes substantial guessing, backtracking, or terminology confusion but has a reliable workaround.
- `low`: a non-blocking clarity, format, accessibility, or consistency improvement.

Use the smallest severity supported by evidence. Do not elevate a preference to `medium` or higher.

## Required report

1. **Audit scope and verification** — audience, full/change mode, source paths, commands/tests/builds run, and runtime checks (if any).
2. **Findings by severity** — highest severity first. Each finding must include:
   - **Location:** path and heading, command, or line range.
   - **Problem:** one precise statement.
   - **Evidence:** code/type/schema/test, official usage, or execution result with an exact reference.
   - **User impact:** what the reader cannot do, may misunderstand, or may put at risk.
   - **Recommended structure and replacement wording:** the smallest actionable change; preserve verified names and syntax. If structure is already sound, say so and give only replacement wording.
3. **Missing user tasks** — tasks a target reader needs but cannot complete from the reviewed docs.
4. **Unverified or remaining limits** — claims not exercised, inaccessible runtime state, or external sources not checked, with the reason.

If no evidence-backed issue remains, write `No findings` and still state residual verification limits.

Read [rubric.md](references/rubric.md) for the detailed review criteria and [project-profile.md](references/project-profile.md) before auditing this repository's docs.
