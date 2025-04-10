import { Label } from "@radix-ui/react-label";
import { Flex, Text } from "@radix-ui/themes";
import React, { PropsWithChildren } from "react";

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
    <Flex gap="2" direction="column">
      <Label htmlFor={id} style={{width:"fit-content"}}>
        {label}
        {required && (
          <span style={{ color: "red", marginLeft: "0.2rem" }}>*</span>
        )}
      </Label>
      {error && (
        <Text size="1" color="red" weight="medium">
          {error}
        </Text>
      )}
      {children}
    </Flex>
  );
};
