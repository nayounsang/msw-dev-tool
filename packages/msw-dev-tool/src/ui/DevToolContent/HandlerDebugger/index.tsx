import React, {
  PropsWithChildren,
  useState,
  useEffect,
} from "react";
import useUiControlStore from "../../../store/uiControlStore";
import { matchRequestUrl, PathParams } from "msw";
import { Flex, Heading, Text, Container as _Container } from "@radix-ui/themes";
import { PathParamSetter } from "./PathParamSetter";
import { KeyValueInputList } from "./KeyValueInputList";
import { RequestPreview } from "./RequestPreview";

export const HandlerDebugger = () => {
  const { currentHandler: handler } = useUiControlStore();

  const path = handler?.info.path ?? "";
  const url = new URL(String(path), location.href);
  const { params } = matchRequestUrl(url, path, url.origin);

  const [paramValues, setParamValues] = useState<
    PathParams<string> | undefined
  >(undefined);
  const [headers, setHeaders] = useState<Record<string, string>>({});
  const [searchParams, setSearchParams] = useState<Record<string, string>>({});

  /**
   * Initialize state to clear previous handler data
   */
  useEffect(() => {
    if (params) {
      setParamValues(
        Object.keys(params).reduce(
          (acc, key) => ({
            ...acc,
            [key]: "",
          }),
          {}
        )
      );
    } else {
      setParamValues(undefined);
    }
    setHeaders({});
    setSearchParams({});
  }, [handler]);

  const handleParamChange = (key: string, value: string) => {
    setParamValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  if (!handler)
    return (
      <Container>
        <Text>Select a handler from the table to debug</Text>
      </Container>
    );

  return (
    <Container>
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
    </Container>
  );
};

const Container = ({ children }: PropsWithChildren) => {
  return (
    <_Container style={{ flex: 2, userSelect: "text",overflowY:"auto" }}>
      <Flex direction="column" gap="4">
        <Heading as="h2" size="5">
          Debugger
        </Heading>
        {children}
      </Flex>
    </_Container>
  );
};
