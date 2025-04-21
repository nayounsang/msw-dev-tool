import { Label } from "@radix-ui/react-label";
import React from "react";
import { Flex } from "../../Components/Flex";
import { Input } from "../../Components/Input";
import { useDebugContext } from "./DebugProvider";

export const PathParamSetter = () => {
  const { pathParam, setDebug } = useDebugContext();

  return (
    pathParam &&
    Object.keys(pathParam).length > 0 && (
      <div>
        <Label>Path Parameters</Label>
        <Flex direction="column" gap={2} py={2}>
          {Object.entries(pathParam).map(([key, value]) => (
            <Flex align="center" gap={2} key={key}>
              <Label htmlFor={`param-${key}`} className="w-[160px]">
                {key}:
              </Label>
              <Input
                id={`param-${key}`}
                type="text"
                value={value as string}
                onChange={(e) => {
                  setDebug("pathParam", {
                    ...pathParam,
                    [key]: e.target.value,
                  });
                }}
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
