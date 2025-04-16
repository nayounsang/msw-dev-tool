//import { Theme } from "@radix-ui/themes";
import React, { PropsWithChildren, forwardRef } from "react";

/**
 * - Because of `portal`, It should be used when rendering in an independent area.
 * - `Theme` has its own size, so the size must be cleared.
 */
export const ThemeProvider = forwardRef<HTMLDivElement, PropsWithChildren>(
  ({ children }, ref) => {
    return (
      <div
        //appearance="light"
        ref={ref}
        style={{
          // minHeight: 0,
          // minWidth: 0,
          // maxHeight: "fit-content",
          // maxWidth: "fit-content",
          width: 0,
          height: 0,
          backgroundColor: "transparent",
          zIndex: "inherit",
        }}
      >
        {children}
      </div>
    );
  }
);

ThemeProvider.displayName = "ThemeProvider";
