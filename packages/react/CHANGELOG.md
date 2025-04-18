# @msw-dev-tool/react

## 1.1.0

### Minor Changes

- 715d7ac: - Fix Error: disable scroll in shadow dom
  - This is caused by `Dialog.Overlay -> RemoveScroll`. After applying shadow dom, the area where scrolling is blocked is propagated to the content. (The cause of this is not well understood.)
  - So, I make custom Overlay.

## 1.0.0

### Major Changes

- 40bc24c: - First publish of react ui

### Patch Changes

- Updated dependencies [40bc24c]
  - @msw-dev-tool/core@1.0.2
