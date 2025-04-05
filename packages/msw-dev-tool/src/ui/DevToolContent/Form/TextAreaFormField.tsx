import { TextArea, TextAreaProps } from "@radix-ui/themes";
import React, { forwardRef, useId } from "react";
import { FormFieldBase } from "./FormFieldBase";

interface TextAreaFormFieldProps extends TextAreaProps {
  label: string;
  error?: string;
}

export const TextAreaFormField = forwardRef<HTMLTextAreaElement, TextAreaFormFieldProps>(
  ({ label, error, required, ...rest }, ref) => {
    const id = useId();

    return (
      <FormFieldBase id={id} label={label} error={error} required={required}>
        <TextArea id={id} ref={ref} {...rest} />
      </FormFieldBase>
    );
  }
);

TextAreaFormField.displayName = "TextAreaFormField";
