import React, { ReactNode } from "react";
import { Flex } from "@radix-ui/themes";
import { Drawer } from "vaul";
import { HandlerTable } from "./DevToolContent/HandlerTable";
import { DialogDescription } from "@radix-ui/react-dialog";
import { HandlerDebugger } from "./DevToolContent/HandlerDebugger";
import { ThemeProvider } from "./ThemeProvider";
import { ToolButtonGroup } from "./DevToolContent/ToolButtonGroup";
import { DefaultDevToolTrigger } from "./Trigger";

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
            <Drawer.Overlay
              style={{
                position: "fixed",
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                backgroundColor: "rgba(0, 0, 0, 0.4)",
              }}
            />
            <Drawer.Content
              style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                height: "80%",
                backgroundColor: "#FFF",
                outline: "none",
                padding: "2rem",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Flex align="center" justify="between">
                <Drawer.Title style={{ margin: 0 }}>MSW DEV TOOL</Drawer.Title>
                <Drawer.Close
                  style={{
                    fontSize: "1.5rem",
                    backgroundColor: "transparent",
                    width: "2rem",
                    height: "2rem",
                    padding: 0,
                    textAlign: "center",
                  }}
                >
                  X
                </Drawer.Close>
              </Flex>
              <DialogDescription
                className="msw-dt-sub-text"
                style={{ display: "none" }}
              >
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
