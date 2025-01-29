import React from "react";
import { createPortal } from "react-dom";
import useUiControlStore from "../store/uiControlStore";
import { DevToolContentContainer } from "./DevToolContent/DevToolContentContainer";

export const MSWDevTool = () => {
  const { isOpen, toggleModal } = useUiControlStore();
  return createPortal(
    <>
      <div className="entry-msw-dev-tool" onClick={toggleModal}>
        M
      </div>
      {isOpen && <DevToolContentContainer />}
    </>,
    document.body
  );
};
