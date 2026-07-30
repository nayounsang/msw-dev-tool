import React from "react";
import { HttpHandler } from "msw";
import { PathParamSetter } from "./PathParamSetter";
import { DebugProvider } from "./DebugProvider";
import { HeaderSetter } from "./HeaderSetter";
import { SearchParamSetter } from "./SearchParamSetter";
import { ResponseViewer } from "./ResponseViewer";
import { FetchButton } from "./FetchButton";
import { Flex } from "../../Components/Flex";

export const HandlerDebugger = ({ handler }: { handler: HttpHandler }) => {
  const path = handler?.info.path;
  const url = new URL(String(path), location.href);

  return (
    <DebugProvider url={url} path={path}>
      <p className="msw-dt-sub-text msw-dt-overflow-x-scroll msw-dt-my-2">
        <span className="msw-dt-font-bold msw-dt-mr-4">{handler?.info.method.toString()}</span>
        {url.toString()}
      </p>
      <Flex gap={2} className="msw-dt-flex-1 msw-dt-overflow-hidden">
        <Flex gap={2} direction="column" className="msw-dt-flex-1">
          <Flex gap={2} direction="column" className="msw-dt-flex-1 msw-dt-overflow-y-auto">
            <p className="msw-dt-m-0 msw-dt-font-semibold">Params</p>
            <PathParamSetter />
            <SearchParamSetter />
            <HeaderSetter />
          </Flex>
          <FetchButton />
        </Flex>
        <Flex gap={2} direction="column" className="msw-dt-flex-1 msw-dt-overflow-y-auto">
          <p className="msw-dt-m-0 msw-dt-font-semibold">Response</p>
          <ResponseViewer />
        </Flex>
      </Flex>
    </DebugProvider>
  );
};
