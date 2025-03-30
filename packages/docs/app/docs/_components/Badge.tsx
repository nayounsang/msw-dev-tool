import React from "react";
import clsx from "clsx";

export type BadgeVariant =
  | "new"
  | "updated"
  | "beta"
  | "warning"
  | "important"
  | "info";
export type BadgeSize = "sm" | "md" | "lg";

interface BadgeProps {
  variant: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  new: "bg-green-100 text-green-800 border-green-300",
  updated: "bg-blue-100 text-blue-800 border-blue-300",
  beta: "bg-purple-100 text-purple-800 border-purple-300",
  warning: "bg-amber-100 text-amber-800 border-amber-300",
  important: "bg-red-100 text-red-800 border-red-300",
  info: "bg-gray-100 text-gray-800 border-gray-300",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "text-xs px-1.5 py-0.5",
  md: "text-xs px-2 py-1",
  lg: "text-sm px-2.5 py-1",
};

export const Badge = ({
  variant,
  size = "sm",
  children,
  className,
}: BadgeProps) => {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded border font-medium",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  );
}
