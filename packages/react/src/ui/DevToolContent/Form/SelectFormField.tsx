import { CSSProperties, useId } from "react";
import { FormFieldBase } from "./FormFieldBase";
import React, { forwardRef } from "react";
import { ChangeHandler } from "react-hook-form";
import { Select, SelectProps } from "../../Components/Select";
import clsx from "clsx";

interface SelectFormFieldProps extends Omit<SelectProps, "onValueChange" | "ref"> {
  label: string;
  error?: string;
  required?: boolean;
  style?: CSSProperties;
  onChange?: ChangeHandler;
  className?: string;
}

export const SelectFormField = forwardRef<HTMLButtonElement, SelectFormFieldProps>(
  ({ label, error, required, style, onChange, className, ...rest }, ref) => {
    const id = useId();
    return (
      <FormFieldBase id={id} label={label} error={error} required={required}>
        <Select
          id={id}
          ref={ref}
          {...rest}
          style={style}
          className={clsx("msw-dt-w-select", className)}
          onValueChange={(val) => {
            onChange?.({
              target: { value: val, name: rest.name },
              type: "change",
            });
          }}
        />
      </FormFieldBase>
    );
  },
);

SelectFormField.displayName = "SelectFormField";
