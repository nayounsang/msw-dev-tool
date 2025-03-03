import React, { useState } from "react";
import { createPortal } from "react-dom";
import { HttpHandler, matchRequestUrl, PathParams } from "msw";
import { PathParamSetter } from "./PathParamSetter";
import { RequestPreview } from "./RequestPreview";
import { KeyValueInputList } from "./KeyValueInputList";
import { Box, Heading, Text } from "@radix-ui/themes";
import { DialogDescription } from "@radix-ui/react-dialog";

interface PreviewHandlerProps {
  handler: HttpHandler;
}

export const PreviewHandler = ({ handler }: PreviewHandlerProps) => {
  const path = handler.info.path;
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
    <Box style={{ position: "relative" }}>
      <DialogDescription asChild>
        <Text style={{ fontSize: "0.8rem", color: "#666", overflow: "scroll" }}>
          {url.toString()}
        </Text>
      </DialogDescription>
      <PathParamSetter
        paramValues={paramValues}
        onParamChange={handleParamChange}
      />
      <Heading as="h3">Search Params</Heading>
      <KeyValueInputList items={searchParams} setItems={setSearchParams} />
      <Heading as="h3">Headers</Heading>
      <KeyValueInputList items={headers} setItems={setHeaders} />
      <RequestPreview
        url={url}
        paramValues={paramValues}
        headers={headers}
        searchParams={searchParams}
      />
    </Box>
  );
};
