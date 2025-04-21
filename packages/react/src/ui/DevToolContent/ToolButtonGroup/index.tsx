import React, { useState } from "react";
import { PlusIcon, ReloadIcon } from "@radix-ui/react-icons";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
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
import { DialogOverlay } from "../../Components/DialogOverlay";

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
            <DialogOverlay/>
            <DialogContent
              className="dialog-content"
            >
              <Flex align="center" justify="space-between">
                <DialogTitle className="m-1 text-xl font-semibold">
                  Add Temp Handler
                </DialogTitle>
                <DialogClose asChild>
                  <CloseButton />
                </DialogClose>
              </Flex>
              <DialogDescription className="m-0 my-2.5">
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
