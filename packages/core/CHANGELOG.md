# @msw-dev-tool/core

## 1.0.4

### Patch Changes

- 7ea2769: Remove the temp handler
- dbc7c01: Update readme

## 1.0.3

### Patch Changes

- 9e75cfd: Move `zustand` from `peer dep` to `dep`. No need to put this as peer dep

## 1.0.2

### Patch Changes

- 40bc24c: - export setupDevtoolWorker

## 1.0.1

### Patch Changes

- 99ddc24: - Change build script and add info in package.json

## 1.0.0

### Major Changes

- 6510e36: - Separate core logic of `msw-dev-tool`.
  - It is not used internally by `msw-dev-tool` yet.
  - This package includes type, core logic and schema.
  - Same as `msw-dev-tool/src/lib/**`, but files are split.
  - It is test publish.
