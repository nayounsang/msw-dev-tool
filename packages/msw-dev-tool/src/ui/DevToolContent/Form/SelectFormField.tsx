import { useId } from "react";
import { FormFieldBase } from "./FormFieldBase";
import { Select } from "./Select";
import React from "react";
import { SelectProps } from "@radix-ui/react-select";

interface SelectFormFieldProps extends SelectProps {
  label: string;
  error?: string;
  required?: boolean;
  options: { label: string; value: string }[];
}

export const SelectFormField = ({
  label,
  error,
  required,
  ...rest
}: SelectFormFieldProps) => {
  const id = useId();
  return (
    <FormFieldBase id={id} label={label} error={error} required={required}>
      <Select id={id} {...rest} />
    </FormFieldBase>
  );
};
