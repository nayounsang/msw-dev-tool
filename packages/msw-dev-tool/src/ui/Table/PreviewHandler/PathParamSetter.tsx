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
        <h3>Path Parameters</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {Object.entries(paramValues).map(([key, value]) => (
            <div
              key={key}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <label htmlFor={`param-${key}`} style={{ minWidth: "100px" }}>
                {key}:
              </label>
              <input
                id={`param-${key}`}
                type="text"
                value={value}
                onChange={(e) => onParamChange(key, e.target.value)}
                style={{
                  padding: "4px 8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  width: "100%",
                }}
              />
            </div>
          ))}
        </div>
      </>
    )
  );
};
