import React, { ReactNode, useState } from "react";
import { Drawer } from "vaul";
import { HandlerTable } from "./DevToolContent/HandlerTable";
import { HandlerDebugger } from "./DevToolContent/HandlerDebugger";
import { ToolButtonGroup } from "./DevToolContent/ToolButtonGroup";
import { DefaultDevToolTrigger } from "./Trigger";
import { CloseButton } from "./Components/CloseButton";
import { PortalContainerProvider } from "./PortalContainerProvider";
import { ThemeProvider } from "./ThemeProvider";
import { Flex } from "./Components/Flex";

interface MSWDevToolProps {
  trigger?: ReactNode;
}

export const MSWDevTool = ({ trigger }: MSWDevToolProps) => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

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
            <Drawer.Overlay className="msw-dt-dialog-overlay msw-dt-dialog-layout" />
            <Drawer.Content
              className="msw-dt-dialog-content msw-dt-dialog-layout"
              style={{
                bottom: 0,
                left: 0,
                right: 0,
                height: "80%",
                outline: "none",
                padding: "2rem",
              }}
            >
              <Flex align="center" justify="space-between">
                <Drawer.Title className="m-0 text-2xl font-bold">
                  MSW DEV TOOL
                </Drawer.Title>
                <Drawer.Close asChild>
                  <CloseButton />
                </Drawer.Close>
              </Flex>
              <ToolButtonGroup />
              <Flex gap={4} className="flex-grow overflow-hidden">
                <HandlerTable />
                <HandlerDebugger />
              </Flex>
            </Drawer.Content>
          </PortalContainerProvider>
        </ThemeProvider>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
