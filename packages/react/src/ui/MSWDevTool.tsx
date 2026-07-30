import React, { ReactNode, useId } from "react";
import { Dialog } from "@base-ui-components/react/dialog";
import { HandlerTable } from "./DevToolContent/HandlerTable";
import { ToolButtonGroup } from "./DevToolContent/ToolButtonGroup";
import { DefaultDevToolTrigger } from "./Trigger";
import { CloseButton } from "./Components/CloseButton";
import { Flex } from "./Components/Flex";

interface MSWDevToolProps {
  trigger?: ReactNode;
}

export const MSWDevTool = ({ trigger }: MSWDevToolProps) => {
  const titleId = useId();

  return (
    <div className="msw-dt-root">
      <Dialog.Root>
        {trigger ? (
          <Dialog.Trigger render={<button style={{ all: "unset", display: "contents" }} />}>{trigger}</Dialog.Trigger>
        ) : (
          <Dialog.Trigger render={<DefaultDevToolTrigger />} />
        )}
        <Dialog.Portal>
          <Dialog.Backdrop className="msw-dt-dialog-backdrop" />
          <Dialog.Popup className="msw-dt-dialog-popup-viewport" aria-labelledby={titleId}>
            <div className="msw-dt-dialog-inner-bottom">
              <Flex align="center" justify="space-between">
                <Dialog.Title id={titleId} className="msw-dt-dialog-title">
                  MSW DEV TOOL
                </Dialog.Title>
                <Dialog.Close render={<CloseButton />} />
              </Flex>
              <ToolButtonGroup />
              <HandlerTable />
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};
