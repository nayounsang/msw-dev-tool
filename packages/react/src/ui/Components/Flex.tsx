import React, { ComponentProps, forwardRef } from "react";
import { clsx } from "clsx";

export type FlexProps = ComponentProps<"div"> & {
  gap?: number;
  direction?: "row" | "column";
  align?: "flex-start" | "center" | "flex-end" | "stretch" | "baseline";
  justify?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly";
  wrap?: "nowrap" | "wrap" | "wrap-reverse";
  py?: number;
  px?: number;
  p?: number;
  className?: string;
};

const getFlexClasses = (props: FlexProps) => {
  const {
    gap,
    direction = "row",
    wrap = "nowrap",
    py,
    px,
    p,
  } = props;

  const baseClasses = "flex";

  const directionClasses = {
    row: "flex-row",
    column: "flex-col",
  };

  const wrapClasses = {
    nowrap: "flex-nowrap",
    wrap: "flex-wrap",
    "wrap-reverse": "flex-wrap-reverse",
  };

  const paddingClasses = [
    p ? `p-${p}` : "",
    py ? `py-${py}` : "",
    px ? `px-${px}` : "",
  ].filter(Boolean);

  return clsx(
    baseClasses,
    directionClasses[direction],
    wrapClasses[wrap],
    gap ? `gap-${gap}` : "",
    paddingClasses
  );
};

export const Flex = forwardRef<HTMLDivElement, FlexProps>((props, ref) => {
  const {
    align,
    justify,
    className,
    ...restProps
  } = props;

  const flexClasses = getFlexClasses(props);

  return (
    <div
      ref={ref}
      className={clsx(flexClasses, className)}
      style={{
        alignItems: align,
        justifyContent: justify,
      }}
      {...restProps}
    >
      {props.children}
    </div>
  );
});

Flex.displayName = "Flex";
