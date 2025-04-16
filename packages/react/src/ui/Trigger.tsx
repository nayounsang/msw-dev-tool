import React, { ComponentProps, forwardRef } from "react";
import { CodeIcon } from "@radix-ui/react-icons";

export const DefaultDevToolTrigger = forwardRef<
  HTMLButtonElement,
  ComponentProps<"button">
>((props, ref) => {
  return (
    <button
      ref={ref}
      className="msw-dt-default-trigger"
      {...props}
    >
      <CodeIcon width={"1rem"} height={"1rem"} />
      msw
    </button>
  );
});

DefaultDevToolTrigger.displayName = "DefaultDevToolTrigger";
