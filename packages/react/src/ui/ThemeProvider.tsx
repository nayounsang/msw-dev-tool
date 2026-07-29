import React, { PropsWithChildren, forwardRef, useEffect, useRef } from "react";
import root from "react-shadow";
import styles from "../style/msw-dev-tool.css";
import { getCssPropertiesStyleSheet } from "../utils/style";

export const ThemeProvider = forwardRef<HTMLDivElement, PropsWithChildren>(
  ({ children }, ref) => {
    const shadowHostRef = useRef<HTMLDivElement>(null);

    /**
     * - `@property` is not supported in shadow dom.
     * - So we need to use `adoptedStyleSheets` to apply the properties forcefully.
     * - Create the stylesheet only in the browser; CSSStyleSheet is unavailable during SSR.
     */
    useEffect(() => {
      const shadowRoot = shadowHostRef.current?.shadowRoot;
      if (!shadowRoot) {
        return;
      }

      const shadowSheet = getCssPropertiesStyleSheet(styles);
      if (!shadowSheet) {
        return;
      }

      shadowRoot.adoptedStyleSheets = [shadowSheet];
    }, []);

    return (
      <>
        <root.div id="msw-dev-tool-shadow-root" ref={shadowHostRef}>
          <div ref={ref} className="fixed z-[9999] inset-0">
            {children}
          </div>
          {/* Currently, size of styles is about 40kb. If it is over 50kb, We have to separate the styles. */}
          <style type="text/css">{styles}</style>
        </root.div>
      </>
    );
  }
);

ThemeProvider.displayName = "ThemeProvider";
