import React from "react";
import { useDebugContext } from "./DebugProvider";
import { KeyValueInputList } from "./KeyValueInputList";

export const HeaderSetter = () => {
  const { requestHeader, setDebug } = useDebugContext();

  return (
    <KeyValueInputList
      items={requestHeader}
      setItems={(items) => {
        setDebug("requestHeader", items);
      }}
      title="Request Headers"
    />
  );
};
