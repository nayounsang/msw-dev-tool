import { PropsWithChildren } from "react";

export const Separator = ({ children }: PropsWithChildren) => {
  return <p className="font-extralight">{children}</p>;
};
