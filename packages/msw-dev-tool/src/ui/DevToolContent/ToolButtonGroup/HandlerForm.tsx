import { PlusIcon } from "@radix-ui/react-icons";
import { Button, Flex } from "@radix-ui/themes";
import React from "react";
import { HandlerSchema, handlerSchema } from "../../../schema/handler";
import { HttpMethod, MimeType, StringHttpStatusCode } from "../../../lib/types";
import { InputFormField } from "../Form/InputFormField";
import { TextAreaFormField } from "../Form/TextAreaFormField";
import { SelectFormField } from "../Form/SelectFormField";
import { useHandlerStore } from "../../../lib/handlerStore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getOptions } from "./util";

interface HandlerFormProps {
  onClose?: () => void;
}

const methodOptions = getOptions(HttpMethod);

const statusOptions = getOptions(StringHttpStatusCode);

const mimeTypeOptions = getOptions(MimeType);

export const HandlerForm = ({ onClose }: HandlerFormProps) => {
  const { addTempHandler } = useHandlerStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<HandlerSchema>({
    resolver: zodResolver(handlerSchema),
    defaultValues: {
      method: HttpMethod.GET,
      status: StringHttpStatusCode.OK,
      contentType: MimeType.APPLICATION_JSON,
      delay: 0,
    },
  });

  const onSubmit = handleSubmit((data) => {
    addTempHandler({ data });
    onClose?.();
  });

  return (
    <form
      onSubmit={onSubmit}
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
          {...register("method")}
          error={errors.method?.message}
          options={methodOptions}
          defaultValue={HttpMethod.GET}
        />
        <InputFormField
          label="Path"
          {...register("path")}
          error={errors.path?.message}
          placeholder="api end point"
          required
        />
        <InputFormField
          label="Delay"
          {...register("delay", { setValueAs: Number })}
          error={errors.delay?.message}
          placeholder="delay time (ms)"
          type="number"
          onWheel={(e) => e.currentTarget.blur()}
        />
        <SelectFormField
          label="Status Code"
          {...register("status")}
          defaultValue={StringHttpStatusCode.OK}
          error={errors.status?.message}
          options={statusOptions}
        />
        <InputFormField
          label="Status Text"
          {...register("statusText")}
          error={errors.statusText?.message}
          placeholder="status text for status code"
        />
        <SelectFormField
          label="Content Type (MIME types)"
          {...register("contentType")}
          defaultValue={MimeType.APPLICATION_JSON}
          error={errors.contentType?.message}
          options={mimeTypeOptions}
        />
        <TextAreaFormField
          label="Response"
          {...register("response")}
          error={errors.response?.message}
          placeholder="response body with 'content-type'"
          style={{
            minHeight: "225px",
          }}
        />
        <TextAreaFormField
          label="Header"
          {...register("header")}
          error={errors.header?.message}
          placeholder="header with JSON format"
          style={{
            minHeight: "225px",
          }}
        />
      </Flex>
      <Button type="submit">
        <PlusIcon />
        Add
      </Button>
    </form>
  );
};
