import React, { forwardRef, ComponentProps } from "react";
import { clsx } from "clsx";

export type TextAreaProps = ComponentProps<"textarea"> & {
  className?: string;
};

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={clsx("msw-dt-textarea", className)}
        {...props}
      />
    );
  }
);

TextArea.displayName = "TextArea";
