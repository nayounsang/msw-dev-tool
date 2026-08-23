import React, { useState } from "react";
import { Plus, RotateCcw } from "lucide-react";
import { Dialog } from "@base-ui-components/react/dialog";
import { AddTempHandlerForm } from "../AddTempHandler";
import { CloseButton } from "../../Components/CloseButton";
import { useHandlerStore } from "@msw-dev-tool/core/browser";
import { Flex } from "../../Components/Flex";
import { Button } from "../../Components/Button";

export const ToolButtonGroup = ({
  showAddHandler = true,
  secondaryAction,
}: {
  showAddHandler?: boolean;
  secondaryAction?: React.ReactNode;
}) => {
  const resetMSWDevTool = useHandlerStore((state) => state.resetMSWDevTool);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <Flex gap={6} py={4}>
      <Button onClick={() => resetMSWDevTool()} color="danger">
        <RotateCcw size={16} />
        Reset Dev tool
      </Button>
      {secondaryAction}
      {showAddHandler && (
        <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Dialog.Trigger
            render={
              <Button>
                <Plus size={16} />
                Add Temp Handler
              </Button>
            }
          />
          <Dialog.Portal>
            <Dialog.Backdrop className="msw-dt-dialog-backdrop" forceRender />
            <Dialog.Popup className="msw-dt-dialog-popup-viewport">
              <div className="msw-dt-dialog-inner-center">
                <Flex align="center" justify="space-between">
                  <Dialog.Title className="msw-dt-dialog-title-sm">Add Temp Handler</Dialog.Title>
                  <Dialog.Close render={<CloseButton />} />
                </Flex>
                <Dialog.Description className="msw-dt-dialog-description">
                  Temp handler is stored in the session storage. If you{" "}
                  <span className="msw-dt-font-bold">reset dev tool</span>, it will be{" "}
                  <span className="msw-dt-danger-text">deleted</span>.
                </Dialog.Description>
                <AddTempHandlerForm onClose={() => setIsDialogOpen(false)} />
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </Flex>
  );
};
