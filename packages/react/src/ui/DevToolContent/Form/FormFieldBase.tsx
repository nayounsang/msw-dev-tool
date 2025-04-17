import { Label } from "@radix-ui/react-label";
import React, { PropsWithChildren } from "react";
import { Flex } from "../../Components/Flex";

interface FormFieldBaseProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
}

export const FormFieldBase = ({
  id,
  label,
  required,
  error,
  children,
}: PropsWithChildren<FormFieldBaseProps>) => {
  return (
    <Flex gap={2} direction="column">
      <Label htmlFor={id} className="w-fit">
        {label}
        {required && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </Label>
      {error && (
        <p className="text-red-500 text-sm font-medium">
          {error}
        </p>
      )}
      {children}
    </Flex>
  );
};
