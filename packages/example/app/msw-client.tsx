"use client";

import { useEffect, useRef } from "react";
import { MSWDevTool } from "@msw-dev-tool/react";
import "@msw-dev-tool/react/msw-dev-tool.css";

export default function MswClientBootstrap() {
  const started = useRef(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (started.current) return;
    started.current = true;

    void import("../src/mocks/browser").then(async ({ workerPromise }) => {
      const worker = await workerPromise;
      await worker.start({ onUnhandledRequest: "bypass" });
    });
  }, []);

  return <MSWDevTool />;
}
