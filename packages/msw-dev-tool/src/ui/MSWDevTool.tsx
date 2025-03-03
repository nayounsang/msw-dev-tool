import React from "react";
import useUiControlStore from "../store/uiControlStore";
import { Button, Flex, Theme } from "@radix-ui/themes";
import { Drawer } from "vaul";
import { HttpControl } from "./DevToolContent/HttpControl";
import { DialogDescription } from "@radix-ui/react-dialog";

export const MSWDevTool = () => {
  return (
    <Theme
      style={{
        minHeight: 0,
        maxHeight: 0,
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 999,
      }}
    >
      <Drawer.Root>
        <Drawer.Trigger asChild>
          <Button
            style={{
              fontSize: "2rem",
              borderRadius: "50%",
              width: "3.5rem",
              height: "3.5rem",
            }}
          >
            M
          </Button>
        </Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Overlay
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              position: "fixed",
              inset: 0,
              zIndex: 1000,
            }}
          />
          <Drawer.Content
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              backgroundColor: "white",
              padding: "1rem 2rem",
            }}
          >
            <Flex align="center" justify="between">
              <Drawer.Title>MSW DEV TOOL</Drawer.Title>
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
            <DialogDescription>
              Dev tool to control mock logic, and monitor handler logic calls.
            </DialogDescription>
            <HttpControl />
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </Theme>
  );
};
