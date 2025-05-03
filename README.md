# Greeting
- Thx for using this package:`msw-dev-tool`!
- This allows you more flexible and extensive API mocking with UI.
- This package is based on [msw](https://mswjs.io/) and [zustand](https://zustand.docs.pmnd.rs/).

# Docs
- [link](https://msw-dev-tool-docs.vercel.app/)

# Structure

This project uses pnpm workspaces.

| Project          | Description                                                                                           |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| **docs**         | The documentation of the library.  
| **core** | `@msw-dev-tool/core`: Core lib logic to control msw handlers |
| **react** | `@msw-dev-tool/lib`: Implement of react UI |                                                                     
| **example**      | A sample project to develop and test `msw-dev-tool`. You need to build `msw-dev-tool` before testing. |
| **msw-dev-tool** | The **LEGACY** source code of the library.                                                                       |
|