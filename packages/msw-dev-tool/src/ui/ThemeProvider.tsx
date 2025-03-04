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
        ref={ref}
        style={{
          minHeight: 0,
          maxHeight: 0,
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 999,
        }}
      >
        {children}
      </Theme>
    );
  }
);

ThemeProvider.displayName = "ThemeProvider";
