import { Plus } from "lucide-react";
import React from "react";
import { InputFormField } from "../Form/InputFormField";
import { SelectFormField } from "../Form/SelectFormField";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  handlerSchema,
  HandlerSchema,
  useHandlerStore,
  HttpMethod,
} from "@msw-dev-tool/core/browser";
import { Flex } from "../../Components/Flex";
import { Button } from "../../Components/Button";
import { getOptions } from "../ToolButtonGroup/util";
import { HTTP_RESPONSE_DEFAULTS, HttpResponseFields } from "../Form/HttpResponseFields";

interface HandlerFormProps {
  onClose?: () => void;
}

const methodOptions = getOptions(HttpMethod);

export const AddTempHandlerForm = ({ onClose }: HandlerFormProps) => {
  const addTempHandler = useHandlerStore((state) => state.addTempHandler);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<HandlerSchema>({
    resolver: zodResolver(handlerSchema),
    defaultValues: {
      method: HttpMethod.GET,
      ...HTTP_RESPONSE_DEFAULTS,
    },
  });

  const onSubmit = handleSubmit((data) => {
    addTempHandler({ data });
    onClose?.();
  });

  return (
    <form
      onSubmit={onSubmit}
      style={{ display: "flex", flexDirection: "column", overflow: "hidden", gap: "1.25rem" }}
    >
      <Flex gap={5} direction="column" style={{ overflow: "scroll", flexGrow: 1 }}>
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
        <HttpResponseFields register={register} errors={errors} />
      </Flex>
      <Button type="submit" color="primary">
        <Plus size={16} />
        Add
      </Button>
    </form>
  );
};
