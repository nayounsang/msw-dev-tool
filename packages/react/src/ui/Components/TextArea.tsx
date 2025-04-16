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
        className={clsx(
          "w-full px-3 py-2 rounded-md",
          "bg-white border border-gray-300",
          "focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500",
          "transition-colors duration-200",
          "resize-none min-h-[100px]",
          className
        )}
        {...props}
      />
    );
  }
);

TextArea.displayName = "TextArea";
