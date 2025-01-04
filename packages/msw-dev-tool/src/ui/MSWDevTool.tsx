import React from "react";
import { createPortal } from "react-dom";
import useUiControlStore from "../store/uiControlStore";
import { DevToolContentContainer } from "./DevToolContent/DevToolContentContainer";

export const MSWDevTool = () => {
  const { isOpen, toggleModal } = useUiControlStore();
  return createPortal(
    <>
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          borderRadius: "50%",
          border: "1px solid black",
          backgroundColor: "white",
          color: "black",
          width: "50px",
          height: "50px",
          fontSize: "30px",
          textAlign: "center",
          cursor: "pointer",
          zIndex:999,
        }}
        onClick={toggleModal}
      >
        M
      </div>
      {isOpen && <DevToolContentContainer />}
    </>,
    document.body
  );
};
