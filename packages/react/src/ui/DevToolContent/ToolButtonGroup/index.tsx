import React, { useState } from "react";
import { PlusIcon, ReloadIcon } from "@radix-ui/react-icons";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  Root as DialogRoot,
} from "@radix-ui/react-dialog";
import { HandlerForm } from "./HandlerForm";
import { CloseButton } from "../../Components/CloseButton";
import { usePortalContainer } from "../../PortalContainerProvider";
import { handlerStore } from "@msw-dev-tool/core";
import { Flex } from "../../Components/Flex";
import { Button } from "../../Components/Button";
import clsx from "clsx";

export const ToolButtonGroup = () => {
  const { resetMSWDevTool } = handlerStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const container = usePortalContainer();

  return (
    <Flex gap={6} py={4}>
      <Button onClick={() => resetMSWDevTool()} color="danger">
        <ReloadIcon />
        Reset Dev tool
      </Button>
      <DialogRoot open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <PlusIcon />
            Add Temp Handler
          </Button>
        </DialogTrigger>
        {container && (
          <DialogPortal container={container}>
            <DialogOverlay className="msw-dt-dialog-overlay msw-dt-dialog-layout" />
            <DialogContent
              className={clsx(
                "msw-dt-dialog-content msw-dt-dialog-layout",
                "top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%]",
                "max-h-[90vh] max-w-[90vw]",
                "overflow-hidden rounded-lg px-[1rem] py-[2rem] box-border"
              )}
            >
              <Flex align="center" justify="space-between">
                <DialogTitle className="m-0 text-2xl font-bold">
                  Add Temp Handler
                </DialogTitle>
                <DialogClose asChild>
                  <CloseButton />
                </DialogClose>
              </Flex>
              <DialogDescription className="m-0">
                Temp handler is stored in the session storage. If you{" "}
                <span className="font-bold">reset dev tool</span>, it will be{" "}
                <span style={{ color: "red" }}>deleted</span>.
              </DialogDescription>
              <HandlerForm onClose={() => setIsDialogOpen(false)} />
            </DialogContent>
          </DialogPortal>
        )}
      </DialogRoot>
    </Flex>
  );
};
