import React from "react";
import { useDebugContext } from "./DebugProvider";

export const ResponseViewer = () => {
  const { response } = useDebugContext();

  const getStatusBadgeClass = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) return "msw-dt-status-badge msw-dt-status-badge-success";
    if (statusCode >= 400) return "msw-dt-status-badge msw-dt-status-badge-error";
    return "msw-dt-status-badge msw-dt-status-badge-warning";
  };

  return (
    <div className="msw-dt-response-viewer">
      {response.statusCode && (
        <div className="msw-dt-status-row">
          <span className="msw-dt-font-medium">Status:</span>
          <span className={getStatusBadgeClass(response.statusCode)}>
            {response.statusCode} {response.statusText}
          </span>
        </div>
      )}

      {response.errorMessage && (
        <div className="msw-dt-error-box">
          <span className="msw-dt-font-medium">Error:</span> {response.errorMessage}
        </div>
      )}

      {response.data && (
        <div className="msw-dt-response-box">
          <pre className="msw-dt-response-pre">
            {response.data}
          </pre>
        </div>
      )}
    </div>
  );
};
