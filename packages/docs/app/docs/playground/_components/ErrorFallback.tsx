"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { usePostStore } from "@/store/postStore";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ErrorFallback = ({ error }: { error: any }) => {
  const { setPosts } = usePostStore();

  return (
    <div className="bg-neutral-800 p-4 rounded-lg shadow-md border border-red-500/30 text-center">
      <AlertCircle className="text-red-400 w-8 h-8 mx-auto mb-3" />
      <h3 className="text-lg font-medium text-red-400 mb-3">Error</h3>
      <p className="text-sm text-neutral-300 mb-4">
        {error?.message || "Error fetching data"}
      </p>
      <button
        onClick={async () => {
          setPosts();
        }}
        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-md transition-colors text-sm font-medium flex items-center gap-2 mx-auto"
      >
        <RefreshCw className="w-4 h-4" />
        Retry
      </button>
    </div>
  );
};
