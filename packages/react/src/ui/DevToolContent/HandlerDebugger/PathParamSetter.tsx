import { Label } from "@radix-ui/react-label";
import { PathParams } from "msw";
import React from "react";
import { Flex } from "../../Components/Flex";
import { Input } from "../../Components/Input";

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
      <div>
        <Label>Path Parameters</Label>
        <Flex direction="column" gap={2} py={2}>
          {Object.entries(paramValues).map(([key, value]) => (
            <Flex align="center" gap={2} key={key}>
              <Label htmlFor={`param-${key}`} style={{ width:"160px" }}>
                {key}:
              </Label>
              <Input
                id={`param-${key}`}
                type="text"
                value={value as string}
                onChange={(e) => onParamChange(key, e.target.value)}
                placeholder="value of path param"
                className="w-[180px]"
              />
            </Flex>
          ))}
        </Flex>
      </div>
    )
  );
};
