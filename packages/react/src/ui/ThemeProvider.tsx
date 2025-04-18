//import { Theme } from "@radix-ui/themes";
import React, { PropsWithChildren, forwardRef } from "react";
import root from "react-shadow";
import styles from "../style/msw-dev-tool.css";

export const ThemeProvider = forwardRef<HTMLDivElement, PropsWithChildren>(
  ({ children }, ref) => {
    return (
      <>
        <root.div id="msw-dev-tool-shadow-root">
          <div ref={ref} className="fixed z-[9999] inset-0">
            {ref && children}
          </div>
          <style type="text/css">{styles}</style>
        </root.div>
      </>
    );
  }
);

ThemeProvider.displayName = "ThemeProvider";
