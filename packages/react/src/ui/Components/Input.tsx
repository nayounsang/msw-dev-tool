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
        className={clsx(
          "w-full px-3 py-2 rounded-md",
          "bg-white border border-gray-300",
          "focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500",
          "transition-colors duration-200",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
