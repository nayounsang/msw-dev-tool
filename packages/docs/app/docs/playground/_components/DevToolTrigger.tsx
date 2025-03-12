"use client";

import { MSWDevTool } from "msw-dev-tool";
import { Button } from "nextra/components";
import "msw-dev-tool/msw-dev-tool.css";
import { Terminal } from "lucide-react";

export const DevToolTrigger = () => {
  return (
    <div className="w-full py-4 flex justify-center items-center">
      <MSWDevTool
        trigger={
          <Button className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600 text-white font-medium shadow-md hover:shadow-xl hover:bg-gradient-to-r hover:from-orange-400 hover:to-amber-500 transition-all duration-200 border border-orange-500/30 hover:border-orange-400/70 flex items-center gap-2">
            <Terminal />
            Open msw-dev-tool
          </Button>
        }
      />
    </div>
  );
};
