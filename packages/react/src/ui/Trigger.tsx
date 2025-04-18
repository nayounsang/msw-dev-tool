import React, { ComponentProps, forwardRef } from "react";
import { CodeIcon } from "@radix-ui/react-icons";
import styles from "../style/trigger.css";

export const DefaultDevToolTrigger = forwardRef<
  HTMLButtonElement,
  ComponentProps<"button">
>((props, ref) => {
  return (
    <>
      <button ref={ref} className="msw-dt-default-trigger" {...props}>
        <CodeIcon width={"1rem"} height={"1rem"} />
        msw
      </button>
      <style type="text/css">{styles}</style>
    </>
  );
});

DefaultDevToolTrigger.displayName = "DefaultDevToolTrigger";
