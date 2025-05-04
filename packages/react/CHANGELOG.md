# @msw-dev-tool/react

## 1.2.9

### Patch Changes

- 6dffa68: use `useHandlerStore` api from core package
- Updated dependencies [53af3bf]
  - @msw-dev-tool/core@1.0.5

## 1.2.8

### Patch Changes

- d036bb5: Fixed a bug where nothing happens when hovering a button
- dbc7c01: Update readme
- 53de587: - fix bug: invisible select because of `z-index` of dialog
- Updated dependencies [7ea2769]
- Updated dependencies [dbc7c01]
  - @msw-dev-tool/core@1.0.4

## 1.2.7

### Patch Changes

- b36a548: remove unused dep: `zustand`

## 1.2.6

### Patch Changes

- 971916f: resolve workspace protocol of `@msw-dev-tool/core`

## 1.2.5

### Patch Changes

- 469395e: - remove `vaul` drawer, replace with `radix` dialog.
  - So, It supports `react19`.

## 1.2.4

### Patch Changes

- Updated dependencies [9e75cfd]
  - @msw-dev-tool/core@1.0.3

## 1.2.3

### Patch Changes

- b02ad6d: - Resolve workspace protocol when publish package
  - Move `react-shadow` dep root to `@msw-dev-tool/react`

## 1.2.2

### Patch Changes

- a8c9e38: - Fix bug: tailwind's `@property` is not applied in shadow dom. So, an issue occurred where `border` and `shadow` not applied.
  - So, I parse css style and extract `@property`. And add these to shadow root's style sheet.

## 1.2.1

### Patch Changes

- 4994c7b: Apply logo to default trigger

## 1.2.0

### Minor Changes

- 4339a62: - Moved the debugger ui to a Dialog.
  - Made it possible to interact with the debugger when clicking on a debug column.
  - Add debug icon

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
