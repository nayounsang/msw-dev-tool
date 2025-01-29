import React from "react";
import { createPortal } from "react-dom";
import useUiControlStore from "../../store/uiControlStore";
import { HttpControl } from "./HttpControl";

export const DevToolContentContainer = () => {
  const { toggleModal } = useUiControlStore();
  return createPortal(
    <div className="msw-dev-tool-container">
      <div className="msw-dev-tool-title-container">
        <p>MSW DEV TOOL</p>
        <button onClick={toggleModal}>X</button>
      </div>
      <HttpControl />
    </div>,
    document.body
  );
};
