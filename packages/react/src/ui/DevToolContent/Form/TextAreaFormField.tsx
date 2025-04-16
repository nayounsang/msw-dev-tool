import React, { forwardRef, useId } from "react";
import { FormFieldBase } from "./FormFieldBase";
import { TextArea, TextAreaProps } from "../../Components/TextArea";
import clsx from "clsx";

interface TextAreaFormFieldProps extends TextAreaProps {
  label: string;
  error?: string;
}

export const TextAreaFormField = forwardRef<HTMLTextAreaElement, TextAreaFormFieldProps>(
  ({ label, error, required,className, ...rest }, ref) => {
    const id = useId();

    return (
      <FormFieldBase id={id} label={label} error={error} required={required}>
        <TextArea id={id} ref={ref} {...rest} className={clsx("box-border", className)}/>
      </FormFieldBase>
    );
  }
);

TextAreaFormField.displayName = "TextAreaFormField";
