import React, { forwardRef, ComponentProps } from "react";
import { clsx } from "clsx";

export type ButtonVariant = "default" | "outline" | "ghost" | "link";

export type ButtonColor = "gray" | "white" | "primary" | "secondary" | "danger";

export type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  color?: ButtonColor;
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
};

const getColorClass = (variant: ButtonVariant, color: ButtonColor = "primary"): string => {
  if (variant === "ghost") {
    return clsx("msw-dt-btn-ghost", `msw-dt-btn-ghost-${color}`);
  }
  if (variant === "outline" || variant === "link") {
    return `msw-dt-btn-${variant}`;
  }
  return `msw-dt-btn-${color}`;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "default", color, className, icon, iconPosition = "left", children, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={clsx("msw-dt-btn", getColorClass(variant, color), className)}
        {...props}
      >
        {iconPosition === "left" && icon}
        {children}
        {iconPosition === "right" && icon}
      </button>
    );
  },
);

Button.displayName = "Button";
