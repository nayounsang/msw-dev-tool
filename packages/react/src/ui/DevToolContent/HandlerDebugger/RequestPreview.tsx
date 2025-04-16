import { PathParams } from "msw";
import React, { useState } from "react";
import { PlayIcon } from "@radix-ui/react-icons";
import {
  getPathWithParams,
  getSearchParams,
  getTotalUrl,
} from "../../../utils/url";
import { Button } from "../../Components/Button";

export const RequestPreview = ({
  url,
  paramValues,
  headers = {},
  searchParams = {},
}: {
  url: URL;
  paramValues?: PathParams<string>;
  headers?: Record<string, string>;
  searchParams?: Record<string, string>;
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [response, setResponse] = useState<any>(null);

  const finalPath = getPathWithParams(url, paramValues);
  const searchParamsString = getSearchParams(searchParams);
  const totalUrl = getTotalUrl(url.origin, finalPath, searchParamsString);

  const handleFetch = () => {
    setLoading(true);
    setError(null);

    fetch(totalUrl, {
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    })
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
    <div>
      <h3>Response</h3>
      <div className="py-1">
        <Button
          onClick={handleFetch}
          disabled={loading}
          color="primary"
          className="w-[140px]"
          style={{
            backgroundColor: loading ? "#6f6f6f" : undefined,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          <PlayIcon />
          {loading ? "Fetching..." : "Send Request"}
        </Button>
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
                fontSize: "0.8rem",
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
