import { Label } from "@radix-ui/react-label";
import { Flex, Heading, TextField } from "@radix-ui/themes";
import { PathParams } from "msw";
import React from "react";

export const PathParamSetter = ({
  paramValues,
  onParamChange,
}: {
  paramValues?: PathParams<string>;
  onParamChange: (key: string, value: string) => void;
}) => {
  return (
    paramValues &&
    Object.keys(paramValues).length > 0 && (
      <>
        <Heading as="h3">Path Parameters</Heading>
        <Flex direction="column" gap="8px">
          {Object.entries(paramValues).map(([key, value]) => (
            <Flex
              align="center"
              gap="8px"
              key={key}
            >
              <Label htmlFor={`param-${key}`} style={{ minWidth: "100px" }}>
                {key}:
              </Label>
              <TextField.Root
                id={`param-${key}`}
                type="text"
                value={value as string}
                onChange={(e) => onParamChange(key, e.target.value)}
                placeholder="value of path param"
                style={{
                  padding: "4px 8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  width: "100%",
                }}
              />
            </Flex>
          ))}
        </Flex>
      </>
    )
  );
};
