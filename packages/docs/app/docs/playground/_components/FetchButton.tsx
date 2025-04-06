"use client";

import { DownloadCloud } from "lucide-react";
import { useState } from "react";
import { Button } from "nextra/components";
import { usePostStore } from "@/store/postStore";

export const FetchButton = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { setPosts } = usePostStore();

  const handleFetch = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    await setPosts();
    setIsRefreshing(false);
  };

  return (
    <Button
      onClick={handleFetch}
      disabled={isRefreshing}
      className={`
        mt-8
        flex items-center gap-2 px-4 py-2 mb-4 
        rounded-lg text-white font-medium
        transition-all duration-300
        ${
          isRefreshing
            ? "bg-neutral-700 cursor-not-allowed"
            : "bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-400 hover:to-teal-500 shadow-md hover:shadow-lg"
        }
      `}
    >
      <DownloadCloud
        className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
      />
      <span>Fetch Data</span>
    </Button>
  );
};
