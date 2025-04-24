---
"@msw-dev-tool/react": patch
---

- Fix bug: tailwind's `@property` is not applied in shadow dom. So, an issue occurred where `border` and `shadow` not applied.
- So, I parse css style and extract `@property`. And add these to shadow root's style sheet.
