import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { describe, expect, it } from "vitest";
import { useHandlerStore } from "./react";

function UnstableSelectorComponent() {
  const ids = useHandlerStore((state) =>
    state.flattenHandlers.map((handler) => handler.id)
  );

  return <span data-testid="ids">{ids.length}</span>;
}

describe("useHandlerStore", () => {
  it("does not loop when selector returns a new array reference", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(<UnstableSelectorComponent />);
    });

    expect(container.querySelector("[data-testid='ids']")?.textContent).toBe(
      "0"
    );

    await act(async () => {
      root.unmount();
    });
  });
});
