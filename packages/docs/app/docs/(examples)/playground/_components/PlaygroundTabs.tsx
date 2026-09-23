"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { FetchButton } from "./FetchButton";
import { PostView } from "./PostView";
import { WebSocketDemo } from "./WebSocketDemo";

type DemoTab = "http" | "websocket";

export const PlaygroundTabs = () => {
  const [activeTab, setActiveTab] = useState<DemoTab>("http");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const focusTab = (tab: DemoTab) => {
    setActiveTab(tab);
    tabRefs.current[tab === "http" ? 0 : 1]?.focus();
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      focusTab(activeTab === "http" ? "websocket" : "http");
    } else if (event.key === "Home") {
      event.preventDefault();
      focusTab("http");
    } else if (event.key === "End") {
      event.preventDefault();
      focusTab("websocket");
    }
  };

  return (
    <div className="mt-6">
      <div
        role="tablist"
        aria-label="Playground demos"
        className="flex gap-1 border-b border-neutral-700"
      >
        <button
          ref={(element) => {
            tabRefs.current[0] = element;
          }}
          id="http-tab"
          type="button"
          role="tab"
          aria-selected={activeTab === "http"}
          aria-controls="http-panel"
          tabIndex={activeTab === "http" ? 0 : -1}
          onClick={() => setActiveTab("http")}
          onKeyDown={handleTabKeyDown}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "http"
              ? "border-orange-500 text-orange-400"
              : "border-transparent text-neutral-400 hover:text-neutral-200"
          }`}
        >
          HTTP
        </button>
        <button
          ref={(element) => {
            tabRefs.current[1] = element;
          }}
          id="websocket-tab"
          type="button"
          role="tab"
          aria-selected={activeTab === "websocket"}
          aria-controls="websocket-panel"
          tabIndex={activeTab === "websocket" ? 0 : -1}
          onClick={() => setActiveTab("websocket")}
          onKeyDown={handleTabKeyDown}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "websocket"
              ? "border-orange-500 text-orange-400"
              : "border-transparent text-neutral-400 hover:text-neutral-200"
          }`}
        >
          WebSocket
        </button>
      </div>

      <section
        id="http-panel"
        role="tabpanel"
        aria-labelledby="http-tab"
        tabIndex={0}
        hidden={activeTab !== "http"}
        className="pt-4"
      >
        <p className="text-sm text-neutral-400">Click to fetch and view API results.</p>
        <FetchButton />
        <PostView />
      </section>

      <section
        id="websocket-panel"
        role="tabpanel"
        aria-labelledby="websocket-tab"
        tabIndex={0}
        hidden={activeTab !== "websocket"}
      >
        {activeTab === "websocket" && <WebSocketDemo />}
      </section>
    </div>
  );
};
