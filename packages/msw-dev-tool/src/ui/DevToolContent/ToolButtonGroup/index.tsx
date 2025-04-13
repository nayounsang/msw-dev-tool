import { Button, Flex } from "@radix-ui/themes";
import React, { useState } from "react";
import { useHandlerStore } from "../../../lib/handlerStore";
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
import { CloseButton } from "../CloseButton";
import { usePortalContainer } from "../../PortalContainerProvider";

export const ToolButtonGroup = () => {
  const { resetMSWDevTool } = useHandlerStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const container = usePortalContainer()

  return (
    <Flex gap="6" py="4">
      <Button onClick={() => resetMSWDevTool()} color="crimson">
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
              className="msw-dt-dialog-content msw-dt-dialog-layout"
              style={{
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                padding: "1rem 2rem",
                borderRadius: "1rem",
                maxHeight: "90vh",
                maxWidth: "90vw",
                overflow: "hidden",
              }}
            >
              <Flex align="center" justify="between">
                <DialogTitle
                  style={{ margin: 0, fontSize: "1.5rem", fontWeight: "bold" }}
                >
                  Add Temp Handler
                </DialogTitle>
                <DialogClose asChild>
                  <CloseButton />
                </DialogClose>
              </Flex>
              <DialogDescription style={{ margin: "1rem 0" }}>
                Temp handler is stored in the session storage. If you{" "}
                <span style={{ fontWeight: "600" }}>reset dev tool</span>, it
                will be <span style={{ color: "red" }}>deleted</span>.
              </DialogDescription>
              <HandlerForm onClose={() => setIsDialogOpen(false)} />
            </DialogContent>
          </DialogPortal>
        )}
      </DialogRoot>
    </Flex>
  );
};
