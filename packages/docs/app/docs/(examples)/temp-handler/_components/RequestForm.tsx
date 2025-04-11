"use client";

import React, { useState } from "react";
import { DownloadCloud } from "lucide-react";
import { useFetchContext } from "./FetchProvider";

export const RequestForm = () => {
  const [method, setMethod] = useState("GET");
  const [path, setPath] = useState("");
  const { mutate, isLoading } = useFetchContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    mutate({ isLoading: true, result: null });
    const response = await fetch(path, {
      method,
    });

    const status = response.status;
    const statusText = response.statusText;
    const headers = JSON.stringify(Object.fromEntries(response.headers),null,2);
    const data = await response.text();

    mutate({ isLoading: false, result: { status, statusText, headers, data } });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex flex-col gap-2 md:w-32">
          <label htmlFor="method" className="text-sm font-medium text-gray-300">
            Method
          </label>
          <select
            id="method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-800 text-gray-100"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>

        <div className="flex flex-col gap-2 flex-1">
          <label htmlFor="path" className="text-sm font-medium text-gray-300">
            Path
          </label>
          <input
            id="path"
            type="text"
            placeholder="Enter path"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            className="p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-800 text-gray-100"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`
            mt-2 flex items-center gap-2 px-4 py-2
            rounded-lg text-white font-medium
            transition-all duration-300
            ${
              isLoading
                ? "bg-neutral-700 cursor-not-allowed"
                : "bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-400 hover:to-teal-500 shadow-md hover:shadow-lg"
            }
            md:mt-0
          `}
        >
          <DownloadCloud
            className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
          />
          <span>Fetch Data</span>
        </button>
      </div>
    </form>
  );
};
