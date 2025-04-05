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
        const path = issue.path[0] as keyof HandlerSchema;
        formattedErrors[path] = issue.message;
      });

      setErrors(formattedErrors);
      return;
    }

    setErrors({});
    console.log(result.data);
    onClose?.();
  };

  return (
    <form onSubmit={validateForm} style={{ overflowY: "auto", flexGrow: 1 }}>
      <Flex gap="5" direction="column">
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
            minHeight: "250px",
          }}
          required
        />
        <Button type="submit">
          <PlusIcon />
          Add
        </Button>
      </Flex>
    </form>
  );
};
