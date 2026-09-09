# Documentation review rubric

Use this rubric after technical claims have been checked. It is a decision aid, not a scorecard. Report only findings that have evidence and a user consequence.

## Quality dimensions

### Technical accuracy

Check import paths, exported names, function signatures, promise/`await` behavior, CLI command names and positional arguments, JSON schemas, defaults, supported features, and stated version limits against the repository. A claim that cannot be checked in code or tests is **unverified**, not automatically wrong.

### Executability and task completion

Trace install to first success. A runnable example identifies prerequisites, working directory, environment, expected output, and cleanup/reset. Check that examples on different pages use compatible IDs, flags, package versions, and state. Check normal flow, common failure, recovery, and reset/cleanup paths.

### Information architecture and discoverability

Classify each page as tutorial, how-to, reference, or explanation using the [Diátaxis application guide](https://www.diataxis.fr/application/). Check that title, headings, links, navigation, next steps, hidden pages, redirects, README summaries, and site pages form a usable path rather than competing or isolated copies.

### Relevance and information density

Remove or relocate boilerplate, repeated prose, stale scaffold text, implementation detail that does not support a decision, and content unrelated to the reader's task. Put the decision and prerequisites early; keep one dominant purpose per page.

### Terminology

Prefer ordinary words where they preserve meaning. Preserve ecosystem terms such as MSW, CDP, HTTP, WebSocket, `sessionStorage`, and `setupDevToolWorker` when they are the established contract. Accept a project-specific term only when it is visible in code/UI/CLI or explicitly defined. Check first-use definitions, one name per concept, and no overloaded name for distinct concepts.

### Clarity and readability

Apply the [Google developer documentation style guide](https://developers.google.com/style) and [Kubernetes style guide](https://kubernetes.io/docs/contribute/style/style-guide/): direct sentences, concrete subjects, active voice, defined abbreviations, and unambiguous references. Flag long paragraphs that join independent items with commas or conjunctions when they make the choices or sequence hard to scan. Use a list for parallel items or steps, a table for meaningful comparisons, tabs or separate sections for environment alternatives, and a callout for prerequisites or warnings. Do not force a structure when a paragraph is easier to read.

### Consistency and drift

Check product/package names, command spelling, casing, link labels, JSON fields, and behavior descriptions across root README, package READMEs, and site pages. Identify a canonical source and recommend a summary/link elsewhere when the same specification is duplicated.

### Freshness and version clarity

Check deprecated packages, current support, peer/version ranges, migration paths, and future/roadmap language. Do not treat a roadmap promise as an implemented feature.

### Accessibility

Check descriptive link text, sequential headings, useful image alt text, and table semantics. Ensure required information is not communicated only by color, position, or an image.

### Safety and operations

For remote debugging, file deletion, unbounded repetition, or external calls, require a bounded scope, explicit warning, isolated data/profile where appropriate, and a stop/reset/cleanup procedure. A command that is technically valid can still be a high-severity finding when it can affect a regular browser profile or real data unexpectedly.

### Maintainability

Identify which docs must change when a public export, CLI schema, UI label, or generated page changes. Distinguish generated output from a manually maintained canonical source and avoid recommending edits to generated artifacts.

## External references

- [Rustdoc: How to write documentation](https://doc.rust-lang.org/rustdoc/how-to-write-documentation.html) — examples should explain the public contract and be runnable where possible.
- Use official MSW, Chrome DevTools/CDP, and other ecosystem documentation for external terms and setup semantics. Cite the exact page checked in the report.
