import { Dialog } from "@base-ui-components/react/dialog";
import {
  CustomResponse,
  FlattenHandler,
  HttpStatusCode,
  useHandlerStore,
} from "@msw-dev-tool/core/browser";
import { Pencil } from "lucide-react";
import React, { useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../../Components/Button";
import { CloseButton } from "../../Components/CloseButton";
import { Flex } from "../../Components/Flex";
import { Select } from "../../Components/Select";
import { FormFieldBase } from "../Form/FormFieldBase";
import { TextAreaFormField } from "../Form/TextAreaFormField";

type CustomResponseFormValues = {
  status: string;
  body: string;
  headers: string;
};

const statusOptions = Object.values(HttpStatusCode).map((value) => {
  const status = String(value);
  return { label: status, value: status };
});

const customResponseFormSchema = z
  .object({
    body: z.string().optional(),
    headers: z.record(z.string()).optional(),
    status: z.number().int().min(200).max(599),
  })
  .superRefine((response, context) => {
    if ([204, 205, 304].includes(response.status) && response.body !== undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `HTTP ${response.status} responses cannot include a body`,
        path: ["body"],
      });
    }
    if (!response.headers) return;
    try {
      new Headers(response.headers);
    } catch {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid response headers",
        path: ["headers"],
      });
    }
  });

const toFormValues = (response?: CustomResponse): CustomResponseFormValues => ({
  status: String(response?.status ?? 200),
  body: response?.body ?? "",
  headers: response?.headers ? JSON.stringify(response.headers, null, 2) : "",
});

export const CustomResponseDialog = ({ handler }: { handler: FlattenHandler }) => {
  const setHandlerCustomResponse = useHandlerStore((state) => state.setHandlerCustomResponse);
  const [open, setOpen] = useState(false);
  const statusId = useId();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CustomResponseFormValues>({ defaultValues: toFormValues(handler.customResponse) });

  useEffect(() => {
    if (open) reset(toFormValues(handler.customResponse));
  }, [handler.customResponse, open, reset]);

  const onSubmit = handleSubmit((values) => {
    let headers: Record<string, string> | undefined;
    if (values.headers.trim()) {
      try {
        const parsed = JSON.parse(values.headers) as unknown;
        if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
          throw new Error("Response headers must be a JSON object");
        }
        headers = parsed as Record<string, string>;
      } catch (error) {
        setError("headers", {
          message: error instanceof Error ? error.message : "Invalid response headers JSON",
        });
        return;
      }
    }

    const response = customResponseFormSchema.safeParse({
      status: Number(values.status),
      ...(values.body ? { body: values.body } : {}),
      ...(headers ? { headers } : {}),
    });
    if (!response.success) {
      response.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (field === "status" || field === "body" || field === "headers") {
          setError(field, { message: issue.message });
        }
      });
      return;
    }

    setHandlerCustomResponse(handler.id, response.data);
    setOpen(false);
  });

  const status = watch("status");

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger render={<Button variant="ghost" color="gray" title="Configure custom response"><Pencil size={16} /></Button>} />
      <Dialog.Portal>
        <Dialog.Backdrop className="msw-dt-dialog-backdrop" forceRender />
        <Dialog.Popup className="msw-dt-dialog-popup-viewport">
          <div className="msw-dt-dialog-inner-center">
            <Flex align="center" justify="space-between">
              <Dialog.Title className="msw-dt-dialog-title-sm">Custom Response</Dialog.Title>
              <Dialog.Close render={<CloseButton />} />
            </Flex>
            <Dialog.Description className="msw-dt-dialog-description">
              Saving configures the response only. Select <span className="msw-dt-font-bold">custom response</span> in Behavior to apply it.
            </Dialog.Description>
            <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem", overflow: "auto" }}>
              <Flex direction="column" gap={5}>
                <FormFieldBase id={statusId} label="Status Code" error={errors.status?.message}>
                  <Select
                    id={statusId}
                    options={statusOptions}
                    value={status}
                    onValueChange={(value) => setValue("status", value ?? "200")}
                    searchable
                    alignItemWithTrigger={false}
                    className="msw-dt-w-select"
                    label="Status Code"
                  />
                </FormFieldBase>
                <TextAreaFormField label="Body" {...register("body")} error={errors.body?.message} className="msw-dt-min-h-textarea" />
                <TextAreaFormField label="Response Headers (JSON object)" {...register("headers")} error={errors.headers?.message} className="msw-dt-min-h-textarea" />
              </Flex>
              <Button type="submit" color="primary">Save Custom Response</Button>
            </form>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
