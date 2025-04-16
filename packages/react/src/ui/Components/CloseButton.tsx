import React from "react";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Button, ButtonProps } from "./Button";

export const CloseButton = ({ ...props }: ButtonProps) => {
  return (
    <Button variant="ghost" color="gray" {...props} className="px-1 py-1">
      <Cross2Icon width={24} height={24} />
    </Button>
  );
};
