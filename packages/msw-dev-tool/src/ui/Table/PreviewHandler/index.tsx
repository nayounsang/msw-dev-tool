import React, { useState } from "react";
import { createPortal } from "react-dom";
import { HttpHandler, matchRequestUrl, PathParams } from "msw";
import { PathParamSetter } from "./PathParamSetter";
import { RequestPreview } from "./RequestPreview";
import { KeyValueInputList } from "./KeyValueInputList";

interface PreviewHandlerProps {
  handler: HttpHandler;
  onClose: () => void;
}

export const PreviewHandler = ({ handler, onClose }: PreviewHandlerProps) => {
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

  const handleParamChange = (key: string, value: string) => {
    setParamValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return createPortal(
    <div
      style={{
        padding: "20px",
        position: "fixed",
        zIndex: 9999,
        backgroundColor: "white",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
        borderRadius: "8px",
        width: "320px",
      }}
    >
      <div style={{ position: "relative" }}>
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "1.2rem",
            padding: "4px",
          }}
        >
          ✕
        </button>

        <h2 style={{ marginBottom: "20px", paddingRight: "24px" }}>
          Handler Preview
        </h2>
        <p style={{ fontSize: "0.8rem", color: "#666", overflow: "scroll" }}>
          {url.toString()}
        </p>
        <PathParamSetter
          paramValues={paramValues}
          onParamChange={handleParamChange}
        />
        <h3>Headers</h3>
        <KeyValueInputList items={headers} setItems={setHeaders} />
        <RequestPreview url={url} paramValues={paramValues} headers={headers} />
      </div>
    </div>,
    document.body
  );
};
