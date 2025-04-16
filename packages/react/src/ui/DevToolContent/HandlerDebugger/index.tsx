import React, { PropsWithChildren, useState } from "react";
import useUiControlStore from "../../../store/uiControlStore";
import { HttpHandler, matchRequestUrl, PathParams } from "msw";
import { PathParamSetter } from "./PathParamSetter";
import { KeyValueInputList } from "./KeyValueInputList";
import { RequestPreview } from "./RequestPreview";
import { Flex } from "../../Components/Flex";

/**
 * - It uses `zustand` global state.
 * - remounting of the inner component that uses local states.
 * - To force a component to be remounted, use `key` prop.
 */
export const HandlerDebugger = () => {
  const { currentHandler: handler } = useUiControlStore();

  const key = `${handler?.info.path}-${handler?.info.method}`;

  return (
    <Container>
      {handler ? (
        <_HandlerDebugger handler={handler} key={key} />
      ) : (
        <p>Select a handler from the table to debug</p>
      )}
    </Container>
  );
};

const _HandlerDebugger = ({ handler }: { handler: HttpHandler }) => {
  const path = handler?.info.path;
  const url = new URL(String(path), location.href);
  const { params } = matchRequestUrl(url, path, url.origin);

  const [paramValues, setParamValues] = useState<
    PathParams<string> | undefined
  >(
    params
      ? Object.keys(params).reduce(
          (acc, key) => ({
            ...acc,
            [key]: "",
          }),
          {}
        )
      : undefined
  );
  const [headers, setHeaders] = useState<Record<string, string>>({});
  const [searchParams, setSearchParams] = useState<Record<string, string>>({});

  const handleParamChange = (key: string, value: string) => {
    setParamValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };
  return (
    <>
      <p className="msw-dt-sub-text overflow-x-scroll">{url.toString()}</p>
      <PathParamSetter
        paramValues={paramValues}
        onParamChange={handleParamChange}
      />
      <KeyValueInputList
        items={searchParams}
        setItems={setSearchParams}
        title="Search Params"
      />
      <KeyValueInputList
        items={headers}
        setItems={setHeaders}
        title="Headers"
      />
      <RequestPreview
        url={url}
        paramValues={paramValues}
        headers={headers}
        searchParams={searchParams}
      />
    </>
  );
};

const Container = ({ children }: PropsWithChildren) => {
  return (
    <div className="flex-2 user-select-text overflow-y-auto max-w-full">
      <Flex direction="column" gap={2}>
        <p className="text-xl font-bold">Debugger</p>
        {children}
      </Flex>
    </div>
  );
};
