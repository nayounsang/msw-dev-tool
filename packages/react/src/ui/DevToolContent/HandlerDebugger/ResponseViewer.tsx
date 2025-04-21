import React from "react";
import { useDebugContext } from "./DebugProvider";

export const ResponseViewer = () => {
  const { response } = useDebugContext();

  return (
    <div className="flex flex-col gap-2">
      
      {response.statusCode && (
        <div className="flex items-center gap-2">
          <span className="font-medium">Status:</span>
          <span className={`px-2 py-1 rounded text-sm ${
            response.statusCode >= 200 && response.statusCode < 300 
              ? "bg-green-100 text-green-800" 
              : response.statusCode >= 400 
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
          }`}>
            {response.statusCode} {response.statusText}
          </span>
        </div>
      )}

      {response.errorMessage && (
        <div className="p-3 rounded bg-red-50 text-red-900">
          <span className="font-medium">Error:</span> {response.errorMessage}
        </div>
      )}

      {response.data && (
        <div className="p-3 rounded bg-gray-50">
          <pre className="text-sm font-mono">
            {response.data}
          </pre>
        </div>
      )}
    </div>
  );
};
