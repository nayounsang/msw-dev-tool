import { Button, ButtonProps } from "@radix-ui/themes";
import React, { forwardRef } from "react";

export const DefaultDevToolTrigger = forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    return (
      <Button
        ref={ref}
        style={{
          fontSize: "2rem",
          borderRadius: "50%",
          width: "3.5rem",
          height: "3.5rem",
          margin: "1rem",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 999,
          cursor: "pointer",
        }}
        {...props}
      >
        M
      </Button>
    );
  }
);

DefaultDevToolTrigger.displayName = "DefaultDevToolTrigger";
