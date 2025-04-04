import { Label } from "@radix-ui/react-label";
import { Flex, Text, TextField } from "@radix-ui/themes";
import React, { ElementType, ComponentPropsWithoutRef, useId } from "react";

type AsProp<C extends ElementType> = {
  as?: C;
};

type PropsWithAs<C extends ElementType, P = {}> = AsProp<C> &
  Omit<ComponentPropsWithoutRef<C>, keyof AsProp<C>> &
  P;

type TextFormFieldProps<C extends ElementType = typeof TextField.Root> =
  PropsWithAs<
    C,
    {
      label: React.ReactNode;
      error?: string;
    }
  >;

export const TextFormField = <C extends ElementType = typeof TextField.Root>({
  as,
  label,
  error,
  ...rest
}: TextFormFieldProps<C>) => {
  const id = useId();
  const Component = as || TextField.Root;

  return (
    <Flex gap="2" direction="column">
      <Label htmlFor={id}>
        {label}
        {rest.required && (
          <span style={{ color: "red", marginLeft: "0.2rem" }}>*</span>
        )}
      </Label>
      <Component id={id} {...rest} />
      {error && (
        <Text size="1" color="red" weight="medium">
          {error}
        </Text>
      )}
    </Flex>
  );
};
