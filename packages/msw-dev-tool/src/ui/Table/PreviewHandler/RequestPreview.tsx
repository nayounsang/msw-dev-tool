import { PathParams } from "msw";
import React, { useState } from "react";
import { getPathWithParams, getTotalUrl } from "../../../utils/url";

export const RequestPreview = ({
  url,
  paramValues,
}: {
  url: URL;
  paramValues?: PathParams<string>;
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [response, setResponse] = useState<any>(null);

  const finalPath = getPathWithParams(url, paramValues);
  const totalUrl = getTotalUrl(url.origin, finalPath);

  const handleFetch = () => {
    setLoading(true);
    setError(null);

    fetch(totalUrl)
      .then((res) => res.json())
      .then((data) => {
        setResponse(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error("Failed to fetch"));
        setLoading(false);
      });
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <h3>Response</h3>
      <div
        style={{
          fontFamily: "monospace",
          wordBreak: "break-all",
        }}
      >
        <button
          onClick={handleFetch}
          disabled={loading}
          style={{
            padding: "4px 12px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            backgroundColor: loading ? "#f5f5f5" : "white",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Fetching..." : "Send Request"}
        </button>

        {error && (
          <div
            style={{
              marginTop: "8px",
              color: "#f44336",
              backgroundColor: "#f5f5f5",
            }}
          >
            Error: {error.message}
          </div>
        )}

        {response && (
          <div
            style={{
              marginTop: "8px",
              maxHeight: "200px",
              overflow: "scroll",
              backgroundColor: "#f5f5f5",
            }}
          >
            <pre
              style={{
                margin: 0,
                overflow: "auto",
                borderRadius: "4px",
                fontFamily: "monospace",
                wordBreak: "break-all",
              }}
            >
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
