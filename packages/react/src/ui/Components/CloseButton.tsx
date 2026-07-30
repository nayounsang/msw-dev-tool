import React, { forwardRef } from "react";
import { X } from "lucide-react";
import { Button, ButtonProps } from "./Button";

export const CloseButton = forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    return (
      <Button
        ref={ref}
        variant="ghost"
        color="gray"
        {...props}
        style={{ padding: "0.25rem", ...props.style }}
      >
        <X size={24} />
      </Button>
    );
  }
);

CloseButton.displayName = "CloseButton";
