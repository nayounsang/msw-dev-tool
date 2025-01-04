import React from "react";
import { createPortal } from "react-dom";
import useUiControlStore from "../../store/uiControlStore";

export const DevToolContentContainer = () => {
    const { toggleModal } = useUiControlStore();
  return createPortal(
    <div
      style={{
        width: "100%",
        padding: "1.5rem",
        position: "absolute",
        top: 0,
        left: 0,
        border: "1px solid black",
        boxSizing: "border-box",
        zIndex: 1000,
        backgroundColor: "white",
        color: "black",
      }}
    >
     <div style={{display:"flex",justifyContent:"space-between"}}>
        <p>MSW DEV TOOL</p>
        <button onClick={toggleModal}>X</button>
     </div>
    </div>,
    document.body
  );
};
