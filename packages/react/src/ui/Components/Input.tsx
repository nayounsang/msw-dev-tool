import React, { forwardRef, ComponentProps } from "react";
import { clsx } from "clsx";

export type InputProps = ComponentProps<"input"> & {
  className?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={clsx("msw-dt-input", className)}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
