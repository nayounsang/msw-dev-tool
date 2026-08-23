import React, { ComponentProps, CSSProperties, forwardRef } from "react";
import { clsx } from "clsx";

export type FlexProps = ComponentProps<"div"> & {
  gap?: number;
  direction?: "row" | "column";
  align?: "flex-start" | "center" | "flex-end" | "stretch" | "baseline";
  justify?:
    "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly";
  wrap?: "nowrap" | "wrap" | "wrap-reverse";
  py?: number;
  px?: number;
  p?: number;
  className?: string;
};

const REM = 0.25;

export const Flex = forwardRef<HTMLDivElement, FlexProps>((props, ref) => {
  const {
    gap,
    direction = "row",
    align,
    justify,
    wrap = "nowrap",
    py,
    px,
    p,
    className,
    style,
    children,
    ...restProps
  } = props;

  const inlineStyle: CSSProperties = {
    display: "flex",
    flexDirection: direction === "column" ? "column" : "row",
    flexWrap: wrap,
    ...(gap !== undefined && { gap: `${gap * REM}rem` }),
    ...(align && { alignItems: align }),
    ...(justify && { justifyContent: justify }),
    ...(p !== undefined && { padding: `${p * REM}rem` }),
    ...(py !== undefined && { paddingTop: `${py * REM}rem`, paddingBottom: `${py * REM}rem` }),
    ...(px !== undefined && { paddingLeft: `${px * REM}rem`, paddingRight: `${px * REM}rem` }),
    ...style,
  };

  return (
    <div ref={ref} className={clsx(className)} style={inlineStyle} {...restProps}>
      {children}
    </div>
  );
});

Flex.displayName = "Flex";
