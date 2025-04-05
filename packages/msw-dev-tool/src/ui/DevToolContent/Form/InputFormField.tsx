import { TextField } from "@radix-ui/themes";
import React, { forwardRef, useId, ForwardedRef } from "react";
import { FormFieldBase } from "./FormFieldBase";

interface InputFormFieldProps extends TextField.RootProps {
  label: string;
  error?: string;
}

export const InputFormField = forwardRef<HTMLInputElement, InputFormFieldProps>(
  ({ label, error, required, ...rest }, ref) => {
    const id = useId();

    return (
      <FormFieldBase id={id} label={label} error={error} required={required}>
        <TextField.Root id={id} ref={ref} {...rest} />
      </FormFieldBase>
    );
  }
);

InputFormField.displayName = "InputFormField";
