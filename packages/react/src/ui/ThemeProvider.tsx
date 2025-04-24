//import { Theme } from "@radix-ui/themes";
import React, { PropsWithChildren, forwardRef } from "react";
import root from "react-shadow";
import { devToolStyleChunks } from "../style/splitCss";

export const ThemeProvider = forwardRef<HTMLDivElement, PropsWithChildren>(
  ({ children }, ref) => {
    return (
      <>
        <root.div id="msw-dev-tool-shadow-root">
          <div ref={ref} className="fixed z-[9999] inset-0">
            {ref && children}
          </div>
          {devToolStyleChunks.map((chunk, index) => (
            <style key={index} type="text/css">
              {chunk}
            </style>
          ))}
        </root.div>
      </>
    );
  }
);

ThemeProvider.displayName = "ThemeProvider";
