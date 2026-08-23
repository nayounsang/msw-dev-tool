import { Dialog } from "@base-ui-components/react/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FlattenHandler,
  HttpResponseConfig,
  httpResponseConfigSchema,
  useHandlerStore,
} from "@msw-dev-tool/core/browser";
import { Pencil } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../Components/Button";
import { CloseButton } from "../../Components/CloseButton";
import { Flex } from "../../Components/Flex";
import { HTTP_RESPONSE_DEFAULTS, HttpResponseFields } from "../Form/HttpResponseFields";
import { CUSTOM_RESPONSE_DESCRIPTION } from "../constants";

const toFormValues = (response?: HttpResponseConfig): HttpResponseConfig => ({
  ...HTTP_RESPONSE_DEFAULTS,
  ...response,
});

export const CustomResponseDialog = ({ handler }: { handler: FlattenHandler }) => {
  const setHandlerCustomResponse = useHandlerStore((state) => state.setHandlerCustomResponse);
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HttpResponseConfig>({
    resolver: zodResolver(httpResponseConfigSchema),
    defaultValues: toFormValues(handler.customResponse),
  });

  useEffect(() => {
    if (open) reset(toFormValues(handler.customResponse));
  }, [handler.customResponse, open, reset]);

  const onSubmit = handleSubmit((response) => {
    setHandlerCustomResponse(handler.id, response);
    setOpen(false);
  });

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        render={
          <Button variant="ghost" color="gray" title="Configure custom response">
            <Pencil size={16} />
          </Button>
        }
      />
      <Dialog.Portal>
        <Dialog.Backdrop className="msw-dt-dialog-backdrop" forceRender />
        <Dialog.Popup className="msw-dt-dialog-popup-viewport">
          <div className="msw-dt-dialog-inner-center">
            <Flex align="center" justify="space-between">
              <Dialog.Title className="msw-dt-dialog-title-sm">Custom Response</Dialog.Title>
              <Dialog.Close render={<CloseButton />} />
            </Flex>
            <Dialog.Description className="msw-dt-dialog-description">
              {CUSTOM_RESPONSE_DESCRIPTION}
            </Dialog.Description>
            <form
              onSubmit={onSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "1.25rem", overflow: "auto" }}
            >
              <Flex direction="column" gap={5}>
                <HttpResponseFields register={register} errors={errors} />
              </Flex>
              <Button type="submit" color="primary">
                Save Custom Response
              </Button>
            </form>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
