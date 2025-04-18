---
"@msw-dev-tool/react": minor
---

- Fix Error: disable scroll in shadow dom
- This is caused by `Dialog.Overlay -> RemoveScroll`. After applying shadow dom, the area where scrolling is blocked is propagated to the content. (The cause of this is not well understood.)
- So, I make custom Overlay.
