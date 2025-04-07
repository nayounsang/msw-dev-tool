import { Button, Dialog, Flex } from "@radix-ui/themes";
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
} from "@radix-ui/react-dialog";
import { ThemeProvider } from "../../ThemeProvider";
import { HandlerForm } from "./HandlerForm";
import { CloseButton } from "../CloseButton";

export const ToolButtonGroup = () => {
  const { resetMSWDevTool } = useHandlerStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <Flex gap="6" py="4">
      <Button onClick={() => resetMSWDevTool()} color="crimson">
        <ReloadIcon />
        Reset Dev tool
      </Button>
      <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <PlusIcon />
            Add Temp Handler
          </Button>
        </DialogTrigger>
        <DialogPortal>
          <ThemeProvider>
            <DialogOverlay className="dialog-overlay" />
            <DialogContent
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                backgroundColor: "#FFF",
                padding: "1rem 2rem",
                display: "flex",
                flexDirection: "column",
                color: "#000",
                borderRadius: "1rem",
                maxHeight: "90vh",
                maxWidth: "90vw",
                overflow: "hidden",
              }}
            >
              <Flex align="center" justify="between">
                <DialogTitle>Add Temp Handler</DialogTitle>
                <DialogClose asChild>
                  <CloseButton />
                </DialogClose>
              </Flex>
              <DialogDescription>
                Temp handler is stored in the session storage. If you{" "}
                <span style={{ fontWeight: "600" }}>reset dev tool</span>, it
                will be <span style={{ color: "red" }}>deleted</span>.
              </DialogDescription>
              <HandlerForm onClose={() => setIsDialogOpen(false)} />
            </DialogContent>
          </ThemeProvider>
        </DialogPortal>
      </Dialog.Root>
    </Flex>
  );
};
