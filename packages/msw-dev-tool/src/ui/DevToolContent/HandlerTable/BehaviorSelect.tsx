import { Row } from "@tanstack/react-table";
import { FlattenHandler } from "../../../lib";
import React, { ForwardedRef, PropsWithChildren, useState } from "react";
import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItemIndicator,
  SelectItemProps,
  SelectItemText,
  SelectPortal,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectTrigger,
  SelectValue,
  SelectViewport,
  SelectItem as _SelectItem,
} from "@radix-ui/react-select";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@radix-ui/react-icons";
import { HttpHandlerBehavior } from "../../../lib/type";

export const BehaviorSelect = ({ row }: { row: Row<FlattenHandler> }) => {
  const [value, setValue] = useState(row.original.behavior);

  return (
    <Select onValueChange={(value) => setValue(value as HttpHandlerBehavior)}>
      <SelectTrigger
        className="msw-dt-select-trigger msw-dt-text-ellipsis"
        aria-label="Behavior"
        onClick={(e) => e.stopPropagation()}
      >
        <SelectValue placeholder={value} />
        <SelectIcon className="msw-dt-select-icon">
          <ChevronDownIcon />
        </SelectIcon>
      </SelectTrigger>
      <SelectPortal>
        <SelectContent
          className="msw-dt-select-content"
          style={{ zIndex: 10000 }}
        >
          <SelectScrollUpButton className="msw-dt-select-scroll-button">
            <ChevronUpIcon />
          </SelectScrollUpButton>
          <SelectViewport className="msw-dt-select-viewport">
            {Object.values(HttpHandlerBehavior).map((behavior) => {
              return (
                <SelectItem key={behavior} value={behavior as string}>
                  {behavior}
                </SelectItem>
              );
            })}
          </SelectViewport>
          <SelectScrollDownButton className="msw-dt-select-scroll-button">
            <ChevronDownIcon />
          </SelectScrollDownButton>
        </SelectContent>
      </SelectPortal>
    </Select>
  );
};

const SelectItem = React.forwardRef(
  (
    {
      children,
      className,
      value,
      ...props
    }: PropsWithChildren<SelectItemProps>,
    forwardedRef: ForwardedRef<HTMLDivElement>
  ) => {
    return (
      <_SelectItem
        className="msw-dt-select-item"
        value={value}
        {...props}
        ref={forwardedRef}
      >
        <SelectItemText>{children}</SelectItemText>
        <SelectItemIndicator className="msw-dt-select-item-indicator">
          <CheckIcon />
        </SelectItemIndicator>
      </_SelectItem>
    );
  }
);

SelectItem.displayName = "SelectItem";
