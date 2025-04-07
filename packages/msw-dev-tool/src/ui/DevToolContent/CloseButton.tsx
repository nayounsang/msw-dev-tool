import React from "react";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Button, ButtonProps } from "@radix-ui/themes";

export const CloseButton = ({ ...props }: ButtonProps) => {
  return (
    <Button variant="ghost" color="gray" {...props}>
      <Cross2Icon width={24} height={24} />
    </Button>
  );
};
