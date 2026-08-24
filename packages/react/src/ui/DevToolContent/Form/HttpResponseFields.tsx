import { HttpResponseConfig, MimeType, StringHttpStatusCode } from "@msw-dev-tool/core/browser";
import React from "react";
import type { FieldErrors, FieldValues, Path, UseFormRegister } from "react-hook-form";
import { getOptions } from "../ToolButtonGroup/util";
import { InputFormField } from "./InputFormField";
import { SelectFormField } from "./SelectFormField";
import { TextAreaFormField } from "./TextAreaFormField";

const statusOptions = getOptions(StringHttpStatusCode);
const mimeTypeOptions = getOptions(MimeType);

export const HTTP_RESPONSE_DEFAULTS = {
  delay: 0,
  status: StringHttpStatusCode.OK,
  contentType: MimeType.APPLICATION_JSON,
} satisfies Partial<HttpResponseConfig>;

export const HttpResponseFields = <T extends FieldValues & HttpResponseConfig>({
  register,
  errors,
}: {
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
}) => (
  <>
    <InputFormField
      label="Delay"
      {...register("delay" as Path<T>, { setValueAs: Number })}
      error={errors.delay?.message as string | undefined}
      placeholder="delay time (ms)"
      type="number"
      min={0}
      onWheel={(event) => event.currentTarget.blur()}
    />
    <SelectFormField
      label="Status Code"
      {...register("status" as Path<T>)}
      defaultValue={StringHttpStatusCode.OK}
      error={errors.status?.message as string | undefined}
      options={statusOptions}
    />
    <InputFormField
      label="Status Text"
      {...register("statusText" as Path<T>)}
      error={errors.statusText?.message as string | undefined}
      placeholder="status text for status code"
    />
    <SelectFormField
      label="Content Type (MIME types)"
      {...register("contentType" as Path<T>)}
      defaultValue={MimeType.APPLICATION_JSON}
      error={errors.contentType?.message as string | undefined}
      options={mimeTypeOptions}
    />
    <TextAreaFormField
      label="Response"
      {...register("response" as Path<T>)}
      error={errors.response?.message as string | undefined}
      placeholder="response body with 'content-type'"
      className="msw-dt-min-h-textarea"
    />
    <TextAreaFormField
      label="Response Headers"
      {...register("header" as Path<T>)}
      error={errors.header?.message as string | undefined}
      placeholder='response headers as JSON, e.g. {"X-Custom": "value"}'
      className="msw-dt-min-h-textarea"
    />
  </>
);
