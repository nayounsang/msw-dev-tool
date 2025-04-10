import { Row } from "@tanstack/react-table";
import { FlattenHandler } from "../../../lib";
import { HttpHandlerBehavior } from "../../../lib/types";
import { useHandlerStore } from "../../../lib/handlerStore";
import { Select } from "../Form/Select";
import React from "react";

const options = Object.values(HttpHandlerBehavior).map((behavior) => ({
  label: behavior,
  value: behavior as string,
}));

export const BehaviorSelect = ({ row }: { row: Row<FlattenHandler> }) => {
  const id = row.original.id;
  const { setHandlerBehavior, getHandlerBehavior } = useHandlerStore();

  return (
    <Select
      options={options}
      placeholder={getHandlerBehavior(id) ?? HttpHandlerBehavior.DEFAULT}
      onValueChange={(_value) => {
        const value = _value as HttpHandlerBehavior;
        setHandlerBehavior(row.original.id, value);
      }}
      data-theme="light"
      data-radix-color-scheme="light"
    />
  );
};
