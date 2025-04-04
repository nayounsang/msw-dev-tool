import { PlusIcon } from "@radix-ui/react-icons";
import { Button, Flex, TextArea, TextField, Text } from "@radix-ui/themes";
import React, { useState } from "react";
import { HandlerSchema, handlerSchema } from "./schema";
import { TextFormField } from "./TextFormField";

interface HandlerFormProps {
  onClose?: () => void;
}

type FormErrors = {
  [K in keyof HandlerSchema]?: string;
};

export const HandlerForm = ({ onClose }: HandlerFormProps) => {
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const data = {
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
        <TextFormField
          label="Path"
          name="path"
          error={errors.path}
          placeholder="api end point"
          required
        />
        <TextFormField
          label="Response"
          name="response"
          error={errors.response}
          placeholder="JSON response"
          as={TextArea}
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
