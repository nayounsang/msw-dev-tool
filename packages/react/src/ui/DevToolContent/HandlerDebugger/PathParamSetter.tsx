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
        <label className="msw-dt-label">Path Parameters</label>
        <Flex direction="column" gap={2} py={2}>
          {Object.entries(pathParam).map(([key, value]) => (
            <Flex align="center" gap={2} key={key}>
              <label htmlFor={`param-${key}`} className="msw-dt-label msw-dt-w-param-label">
                {key}:
              </label>
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
                className="msw-dt-w-param-input"
              />
            </Flex>
          ))}
        </Flex>
      </div>
    )
  );
};
