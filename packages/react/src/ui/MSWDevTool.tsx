import React, { ReactNode, useId, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { HandlerTable } from "./DevToolContent/HandlerTable";
import { ToolButtonGroup } from "./DevToolContent/ToolButtonGroup";
import { DefaultDevToolTrigger } from "./Trigger";
import { CloseButton } from "./Components/CloseButton";
import { PortalContainerProvider } from "./PortalContainerProvider";
import { ThemeProvider } from "./ThemeProvider";
import { Flex } from "./Components/Flex";
import clsx from "clsx";
import { DialogOverlay } from "./Components/DialogOverlay";
import { RemoveScroll } from "react-remove-scroll";

interface MSWDevToolProps {
  trigger?: ReactNode;
}

export const MSWDevTool = ({ trigger }: MSWDevToolProps) => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const titleId = useId();

  return (
    <Dialog.Root>
      {trigger ? (
        <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      ) : (
        <Dialog.Trigger asChild>
          <DefaultDevToolTrigger />
        </Dialog.Trigger>
      )}
      <Dialog.Portal>
        <ThemeProvider ref={setContainer}>
          <PortalContainerProvider container={container}>
            <DialogOverlay />
            <RemoveScroll>
              <Dialog.Content
                className={clsx(
                  "fixed bottom-0 left-0 right-0",
                  "h-[80vh]",
                  "overflow-y-scroll",
                  "p-8",
                  "bg-white flex flex-col text-gray-900",
                  "outline-none"
                )}
                aria-labelledby={titleId}
              >
                <Flex align="center" justify="space-between">
                  <Dialog.Title id={titleId} className="m-0 text-2xl font-bold">
                    MSW DEV TOOL
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <CloseButton />
                  </Dialog.Close>
                </Flex>
                <ToolButtonGroup />
                <HandlerTable />
              </Dialog.Content>
            </RemoveScroll>
          </PortalContainerProvider>
        </ThemeProvider>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
