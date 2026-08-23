import React, { useId, useState } from "react";
import { Dialog } from "@base-ui-components/react/dialog";
import { HandlerTable } from "./DevToolContent/HandlerTable";
import { ToolButtonGroup } from "./DevToolContent/ToolButtonGroup";
import { DefaultDevToolTrigger } from "./Trigger";
import { CloseButton } from "./Components/CloseButton";
import { Flex } from "./Components/Flex";
import { Button } from "./Components/Button";
import { AddWebSocketEndpointDialog, WebSocketPanel } from "./DevToolContent/WebSocketPanel";

interface MSWDevToolProps {
  trigger?: React.ReactElement<Record<string, unknown>, string | React.JSXElementConstructor<any>>;
}

export const MSWDevTool = ({ trigger }: MSWDevToolProps) => {
  const titleId = useId();
  const [tab, setTab] = useState<"http" | "websocket">("http");

  return (
    <Dialog.Root>
      {trigger ? (
        <Dialog.Trigger render={trigger} />
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
            <div className="msw-dt-tabs" role="tablist" aria-label="Mock handlers">
              <Button
                variant="ghost"
                role="tab"
                aria-selected={tab === "http"}
                className={tab === "http" ? "msw-dt-tab-active" : ""}
                onClick={() => setTab("http")}
              >
                HTTP
              </Button>
              <Button
                variant="ghost"
                role="tab"
                aria-selected={tab === "websocket"}
                className={tab === "websocket" ? "msw-dt-tab-active" : ""}
                onClick={() => setTab("websocket")}
              >
                WebSocket
              </Button>
            </div>
            <ToolButtonGroup
              showAddHandler={tab === "http"}
              secondaryAction={tab === "websocket" ? <AddWebSocketEndpointDialog /> : undefined}
            />
            {tab === "http" ? <HandlerTable /> : <WebSocketPanel />}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
