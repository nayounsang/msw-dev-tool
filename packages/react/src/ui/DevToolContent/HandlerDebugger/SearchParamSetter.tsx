import React from "react";
import { useDebugContext } from "./DebugProvider";
import { KeyValueInputList } from "./KeyValueInputList";

export const SearchParamSetter = () => {
  const { searchParam, setDebug } = useDebugContext();

  return (
    <KeyValueInputList
      items={searchParam}
      setItems={(items) => {
        setDebug("searchParam", items);
      }}
      title="Search Params"
    />
  );
};
