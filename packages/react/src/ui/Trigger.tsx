import React, { ComponentProps, forwardRef } from "react";
import styles from "../style/trigger.css";
import { MSWDevToolLogo } from "./Components/Logo";

export const DefaultDevToolTrigger = forwardRef<
  HTMLButtonElement,
  ComponentProps<"button">
>((props, ref) => {
  return (
    <>
      <button ref={ref} className="msw-dt-default-trigger" name="msw-dev-tool trigger" {...props}>
        <MSWDevToolLogo size={"3rem"} backgroundColor="currentColor" />
      </button>
      <style type="text/css">{styles}</style>
    </>
  );
});

DefaultDevToolTrigger.displayName = "DefaultDevToolTrigger";
