import { Theme } from "@radix-ui/themes";
import React, { PropsWithChildren, forwardRef } from "react";

/**
 * - Because of `portal`, It should be used when rendering in an independent area.
 * - `Theme` has its own size, so the size must be cleared.
 */
export const ThemeProvider = forwardRef<HTMLDivElement, PropsWithChildren>(
  ({ children }, ref) => {
    return (
      <Theme
        appearance="light"
        ref={ref}
        style={{
          minHeight: 0,
          minWidth: 0,
          maxHeight: "fit-content",
          maxWidth: "fit-content",
          backgroundColor: "transparent",
          zIndex: "inherit",
        }}
      >
        {children}
      </Theme>
    );
  }
);

ThemeProvider.displayName = "ThemeProvider";
