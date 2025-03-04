import { Label } from "@radix-ui/react-label";
import { Box, Flex, Heading, TextField } from "@radix-ui/themes";
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
      <Box>
        <Label>Path Parameters</Label>
        <Flex direction="column" gap="2" py="2">
          {Object.entries(paramValues).map(([key, value]) => (
            <Flex align="center" gap="2" key={key}>
              <Label htmlFor={`param-${key}`} style={{ width:"160px" }}>
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
                  width: "180px",
                }}
              />
            </Flex>
          ))}
        </Flex>
      </Box>
    )
  );
};
