import { Button, Flex } from "@radix-ui/themes";
import React from "react";
import { useHandlerStore } from "../../lib/handlerStore";
import { ReloadIcon } from "@radix-ui/react-icons";

export const ToolButtonGroup = () => {
  const { resetMSWDevTool } = useHandlerStore();

  return (
    <Flex gap="8" py="4">
      <Button onClick={() => resetMSWDevTool()}>
        <ReloadIcon />
        Reset Dev tool
      </Button>
    </Flex>
  );
};
