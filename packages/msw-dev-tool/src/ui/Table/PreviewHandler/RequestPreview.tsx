import { PathParams } from "msw";
import React, { useState } from "react";
import { getPathWithParams, getSearchParams, getTotalUrl } from "../../../utils/url";
import { Box, Button, Heading } from "@radix-ui/themes";

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
        'Content-Type': 'application/json',
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
    <Box style={{ marginTop: "20px" }}>
      <Heading as="h3">Response</Heading>
      <Box
        style={{
          fontFamily: "monospace",
          wordBreak: "break-all",
        }}
      >
        <Button
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
        </Button>

        {error && (
          <Box
            style={{
              marginTop: "8px",
              color: "#f44336",
              backgroundColor: "#f5f5f5",
            }}
          >
            Error: {error.message}
          </Box>
        )}

        {response && (
          <Box
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
          </Box>
        )}
      </Box>
    </Box>
  );
};