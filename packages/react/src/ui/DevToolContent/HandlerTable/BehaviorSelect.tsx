import { Row } from "@tanstack/react-table";
import React from "react";
import {
  FlattenHandler,
  useHandlerStore,
  HttpHandlerBehavior,
} from "@msw-dev-tool/core/browser";
import { Select } from "../../Components/Select";

const options = Object.values(HttpHandlerBehavior).map((behavior) => ({
  label: behavior,
  value: behavior as string,
}));

export const BehaviorSelect = ({ row }: { row: Row<FlattenHandler> }) => {
  const id = row.original.id;
  const setHandlerBehavior = useHandlerStore((state)=>state.setHandlerBehavior);
  const getHandlerBehavior = useHandlerStore((state)=>state.getHandlerBehavior);

  return (
    <Select
      options={options}
      placeholder={getHandlerBehavior(id) ?? HttpHandlerBehavior.DEFAULT}
      onValueChange={(_value) => {
        if (!_value) return;
        const value = _value as HttpHandlerBehavior;
        setHandlerBehavior(row.original.id, value);
      }}
      className="msw-dt-w-behavior-select"
    />
  );
};
