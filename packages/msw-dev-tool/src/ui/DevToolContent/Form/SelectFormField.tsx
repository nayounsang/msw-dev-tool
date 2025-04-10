import { CSSProperties, useId } from "react";
import { FormFieldBase } from "./FormFieldBase";
import { Select } from "./Select";
import React, { forwardRef } from "react";
import { SelectProps } from "@radix-ui/react-select";
import { ChangeHandler } from "react-hook-form";

interface SelectFormFieldProps
  extends Omit<SelectProps, "ref" | "onValueChange"> {
  label: string;
  error?: string;
  required?: boolean;
  options: { label: string | number; value: string }[];
  style?: CSSProperties;
  onChange?: ChangeHandler;
}

export const SelectFormField = forwardRef<
  HTMLButtonElement,
  SelectFormFieldProps
>(({ label, error, required, style, onChange, ...rest }, ref) => {
  const id = useId();
  return (
    <FormFieldBase id={id} label={label} error={error} required={required}>
      <Select
        id={id}
        ref={ref}
        {...rest}
        style={{ ...style, maxWidth: "160px" }}
        onValueChange={(val) => {
          onChange?.({
            target: { value: val, name: rest.name },
            type: "change",
          });
        }}
      />
    </FormFieldBase>
  );
});

SelectFormField.displayName = "SelectFormField";
