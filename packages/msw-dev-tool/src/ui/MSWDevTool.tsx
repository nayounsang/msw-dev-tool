import React, { ReactNode } from "react";
import { Flex } from "@radix-ui/themes";
import { Drawer } from "vaul";
import { HandlerTable } from "./DevToolContent/HandlerTable";
import { DialogDescription } from "@radix-ui/react-dialog";
import { HandlerDebugger } from "./DevToolContent/HandlerDebugger";
import { ThemeProvider } from "./ThemeProvider";
import { ToolButtonGroup } from "./DevToolContent/ToolButtonGroup";
import { DefaultDevToolTrigger } from "./Trigger";
import { CloseButton } from "./DevToolContent/CloseButton";

interface MSWDevToolProps {
  trigger?: ReactNode;
}

export const MSWDevTool = ({ trigger }: MSWDevToolProps) => {
  return (
    <ThemeProvider>
      <Drawer.Root>
        {trigger ? (
          <Drawer.Trigger asChild>{trigger}</Drawer.Trigger>
        ) : (
          <Drawer.Trigger asChild>
            <DefaultDevToolTrigger />
          </Drawer.Trigger>
        )}
        <Drawer.Portal>
          <ThemeProvider>
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
              <Flex align="center" justify="between">
                <Drawer.Title
                  style={{ margin: 0, fontSize: "1.5rem", fontWeight: "bold" }}
                >
                  MSW DEV TOOL
                </Drawer.Title>
                <Drawer.Close asChild>
                  <CloseButton />
                </Drawer.Close>
              </Flex>
              <DialogDescription hidden className="msw-dt-sub-text">
                Dev tool to control mock logic, and monitor handler logic calls.
              </DialogDescription>
              <ToolButtonGroup />
              <Flex gap="6" style={{ flex: 1, overflow: "hidden" }}>
                <HandlerTable />
                <HandlerDebugger />
              </Flex>
            </Drawer.Content>
          </ThemeProvider>
        </Drawer.Portal>
      </Drawer.Root>
    </ThemeProvider>
  );
};
