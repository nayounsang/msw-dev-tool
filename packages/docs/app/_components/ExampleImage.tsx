import Image, { ImageProps } from "next/image";
import { forwardRef } from "react";

export const ExampleImage = forwardRef<HTMLImageElement | null, ImageProps>(
  ({ alt, ...attr }, ref) => {
    return (
      <Image
        alt={alt}
        className="w-full h-auto my-2"
        width={800}
        height={300}
        {...attr}
        ref={ref}
      />
    );
  }
);

ExampleImage.displayName = "ExampleImage";
