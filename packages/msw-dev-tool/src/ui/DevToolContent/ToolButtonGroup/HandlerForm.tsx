import { PlusIcon } from "@radix-ui/react-icons";
import { Button, Flex, TextArea, TextField, Text } from "@radix-ui/themes";
import React, { useState } from "react";
import { HandlerSchema, handlerSchema } from "./schema";
import { Label } from "@radix-ui/react-label";
import { HttpMethod } from "../../../lib/type";
import { Select } from "../Form/Select";
import { InputFormField } from "../Form/InputFormField";
import { TextAreaFormField } from "../Form/TextAreaFormField";
import { SelectFormField } from "../Form/SelectFormField";
import { useHandlerStore } from "../../../lib/handlerStore";

interface HandlerFormProps {
  onClose?: () => void;
}

type FormErrors = {
  [K in keyof HandlerSchema]?: string;
};

const options = Object.values(HttpMethod).map((method) => ({
  label: method,
  value: method,
}));

export const HandlerForm = ({ onClose }: HandlerFormProps) => {
  const { addTempHandler } = useHandlerStore();

  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const data = {
      method: formData.get("method") as HttpMethod,
      path: formData.get("path") as string,
      response: formData.get("response") as string,
    };

    const result = handlerSchema.safeParse(data);

    if (!result.success) {
      const formattedErrors: FormErrors = {};

      result.error.issues.forEach((issue) => {
        issue.path.forEach((path) => {
          const key = path as keyof HandlerSchema;
          formattedErrors[key] = issue.message;
        });
      });

      setErrors(formattedErrors);
      return;
    }

    setErrors({});
    addTempHandler(result.data);
    onClose?.();
  };

  return (
    <form
      onSubmit={validateForm}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-5)",
        overflow: "hidden",
      }}
    >
      <Flex gap="5" direction="column" overflow="scroll" flexGrow={"1"}>
        <SelectFormField
          label="Method"
          name="method"
          error={errors.method}
          options={options}
          required
          defaultValue={HttpMethod.GET}
        />
        <InputFormField
          label="Path"
          name="path"
          error={errors.path}
          placeholder="api end point"
          required
        />
        <TextAreaFormField
          label="Response"
          name="response"
          error={errors.response}
          placeholder="JSON response"
          style={{
            minHeight: "225px",
          }}
          required
        />
      </Flex>
      <Button type="submit">
        <PlusIcon />
        Add
      </Button>
    </form>
  );
};
