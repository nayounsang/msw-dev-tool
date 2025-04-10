import clsx from "clsx";
import Image, { ImageProps } from "next/image";
import { forwardRef } from "react";

export const ExampleImage = forwardRef<HTMLImageElement | null, ImageProps>(
  ({ alt, width, height, className, ...attr }, ref) => {
    return (
      <Image
        alt={alt}
        className={clsx("w-full h-auto my-2", className)}
        width={width ?? 800}
        height={height ?? 300}
        {...attr}
        ref={ref}
      />
    );
  }
);

ExampleImage.displayName = "ExampleImage";
