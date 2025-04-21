import React from "react";
import { HttpHandler } from "msw";
import { PathParamSetter } from "./PathParamSetter";
import { DebugProvider } from "./DebugProvider";
import { HeaderSetter } from "./HeaderSetter";
import { SearchParamSetter } from "./SearchParamSetter";
import { ResponseViewer } from "./ResponseViewer";
import { FetchButton } from "./FetchButton";
import { Flex } from "../../Components/Flex";
import { DialogDescription } from "@radix-ui/react-dialog";

export const HandlerDebugger = ({ handler }: { handler: HttpHandler }) => {
  const path = handler?.info.path;
  const url = new URL(String(path), location.href);

  return (
    <DebugProvider url={url} path={path}>
      <DialogDescription asChild>
        <p className="msw-dt-sub-text overflow-x-scroll my-2.5">
          <span className="font-bold mr-4">{handler?.info.method.toString()}</span>
          {url.toString()}
        </p>
      </DialogDescription>
      <Flex gap={2} className="flex-1 overflow-hidden">
        <Flex gap={2} direction="column" className="flex-1">
          <Flex gap={2} direction="column" className="flex-1 overflow-y-auto">
            <p className="m-0 font-semibold">Params</p>
            <PathParamSetter />
            <SearchParamSetter />
            <HeaderSetter />
          </Flex>
          <FetchButton />
        </Flex>
        <Flex gap={2} direction="column" className="flex-1 overflow-y-auto">
          <p className="m-0 font-semibold">Response</p>
          <ResponseViewer />
        </Flex>
      </Flex>
    </DebugProvider>
  );
};
