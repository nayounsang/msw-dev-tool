import React, { ReactNode, useId, useState } from "react";
import { Drawer } from "vaul";
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
    <Drawer.Root autoFocus>
      {trigger ? (
        <Drawer.Trigger asChild>{trigger}</Drawer.Trigger>
      ) : (
        <Drawer.Trigger asChild>
          <DefaultDevToolTrigger />
        </Drawer.Trigger>
      )}
      <Drawer.Portal>
        <ThemeProvider ref={setContainer}>
          <PortalContainerProvider container={container}>
            <DialogOverlay />
            <RemoveScroll>
              <Drawer.Content
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
                  <Drawer.Title id={titleId} className="m-0 text-2xl font-bold">
                    MSW DEV TOOL
                  </Drawer.Title>
                  <Drawer.Close asChild>
                    <CloseButton />
                  </Drawer.Close>
                </Flex>
                <ToolButtonGroup />
                <HandlerTable />
              </Drawer.Content>
            </RemoveScroll>
          </PortalContainerProvider>
        </ThemeProvider>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
