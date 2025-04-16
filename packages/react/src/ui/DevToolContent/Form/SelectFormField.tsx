import { CSSProperties, useId } from "react";
import { FormFieldBase } from "./FormFieldBase";
import React, { forwardRef } from "react";
import { SelectProps } from "@radix-ui/react-select";
import { ChangeHandler } from "react-hook-form";
import { Select } from "../../Components/Select";
import clsx from "clsx";

interface SelectFormFieldProps
  extends Omit<SelectProps, "ref" | "onValueChange"> {
  label: string;
  error?: string;
  required?: boolean;
  options: { label: string | number; value: string }[];
  style?: CSSProperties;
  onChange?: ChangeHandler;
  className?: string;
}

export const SelectFormField = forwardRef<
  HTMLButtonElement,
  SelectFormFieldProps
>(({ label, error, required, style, onChange, className, ...rest }, ref) => {
  const id = useId();
  return (
    <FormFieldBase id={id} label={label} error={error} required={required}>
      <Select
        id={id}
        ref={ref}
        {...rest}
        style={style}
        className={clsx("max-w-[160px]", className)}
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
