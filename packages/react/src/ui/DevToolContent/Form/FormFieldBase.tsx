import React, { PropsWithChildren } from "react";
import { Flex } from "../../Components/Flex";

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
    <Flex gap={2} direction="column">
      <label htmlFor={id} className="msw-dt-label msw-dt-w-fit">
        {label}
        {required && (
          <span className="msw-dt-label-required">*</span>
        )}
      </label>
      {error && (
        <p className="msw-dt-error-text">
          {error}
        </p>
      )}
      {children}
    </Flex>
  );
};
