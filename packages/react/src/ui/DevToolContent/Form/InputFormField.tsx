import React, { forwardRef, useId } from "react";
import { FormFieldBase } from "./FormFieldBase";
import { Input, InputProps } from "../../Components/Input";

interface InputFormFieldProps extends InputProps {
  label: string;
  error?: string;
}

export const InputFormField = forwardRef<HTMLInputElement, InputFormFieldProps>(
  ({ label, error, required, ...rest }, ref) => {
    const id = useId();

    return (
      <FormFieldBase id={id} label={label} error={error} required={required}>
        <Input id={id} ref={ref} {...rest} className="box-border"/>
      </FormFieldBase>
    );
  }
);

InputFormField.displayName = "InputFormField";
