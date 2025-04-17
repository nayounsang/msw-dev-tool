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

type ColorConfig = {
  text: string;
  hover: string;
  bg: string;
};

const colorConfigs: Record<ButtonColor, ColorConfig> = {
  gray: {
    text: "text-gray-700",
    hover: "hover:bg-gray-100",
    bg: "bg-gray-200",
  },
  white: {
    text: "text-gray-900",
    hover: "hover:bg-gray-50",
    bg: "bg-white",
  },
  primary: {
    text: "text-white",
    hover: "hover:bg-orange-500",
    bg: "bg-orange-600",
  },
  secondary: {
    text: "text-white",
    hover: "hover:bg-teal-500",
    bg: "bg-teal-600",
  },
  danger: {
    text: "text-white",
    hover: "hover:bg-red-500",
    bg: "bg-red-600",
  },
};

type VariantStyleConfig = {
  [K in ButtonVariant]: (color: ColorConfig) => {
    base: string[];
    hover: string[];
  };
};

const getVariantClasses = (
  variant: ButtonVariant,
  color: ButtonColor = "primary"
) => {
  const colorConfig = colorConfigs[color];
  const baseClasses =
    "px-4 py-2 rounded-md cursor-pointer transition-all duration-200 inline-flex items-center justify-center gap-2";

  const variantStyles: VariantStyleConfig = {
    default: (color) => ({
      base: [color.bg, color.text, "border-none"],
      hover: [color.hover],
    }),
    outline: (color) => ({
      base: [
        "bg-transparent",
        "border",
        color.bg.replace("bg-", "border-"),
        color.bg.replace("bg-", "text-"),
      ],
      hover: ["hover:bg-opacity-10", color.bg],
    }),
    ghost: (color) => ({
      base: ["bg-transparent", color.bg.replace("bg-", "text-"), "border-none"],
      hover: ["hover:bg-opacity-10", color.bg],
    }),
    link: (color) => ({
      base: [
        "bg-transparent",
        color.bg.replace("bg-", "text-"),
        "border-none",
        "underline",
      ],
      hover: [color.hover.replace("hover:bg-", "hover:text-")],
    }),
  };

  const { base, hover } = variantStyles[variant](colorConfig);
  const hoverClasses = hover.map((className) =>
    className.startsWith("hover:") ? className : `hover:${className}`
  );

  return clsx(baseClasses, base, hoverClasses);
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "default",
      color,
      className,
      icon,
      iconPosition = "left",
      children,
      ...props
    },
    ref
  ) => {
    const variantClasses = getVariantClasses(variant, color);

    return (
      <button ref={ref} className={clsx(variantClasses, className)} {...props}>
        {iconPosition === "left" && icon}
        {children}
        {iconPosition === "right" && icon}
      </button>
    );
  }
);

Button.displayName = "Button";
