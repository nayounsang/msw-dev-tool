import React, { PropsWithChildren, useState, useEffect } from "react";
import useUiControlStore from "../../../store/uiControlStore";
import { matchRequestUrl, PathParams } from "msw";
import { Flex, Heading, Text, Container as _Container } from "@radix-ui/themes";
import { PathParamSetter } from "./PathParamSetter";
import { KeyValueInputList } from "./KeyValueInputList";
import { RequestPreview } from "./RequestPreview";
import { HttpHandler } from "../../../lib/type";
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
        <Text>Select a handler from the table to debug</Text>
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
      <Text className="msw-dt-sub-text" style={{ overflowX: "scroll" }}>
        {url.toString()}
      </Text>
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
    <_Container style={{ flex: 2, userSelect: "text", overflowY: "auto" }}>
      <Flex direction="column" gap="4">
        <Heading as="h2" size="5">
          Debugger
        </Heading>
        {children}
      </Flex>
    </_Container>
  );
};
