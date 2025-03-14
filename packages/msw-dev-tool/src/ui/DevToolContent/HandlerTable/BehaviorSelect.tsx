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
import { useHandlerStore } from "../../../lib/handlerStore";

export const BehaviorSelect = ({ row }: { row: Row<FlattenHandler> }) => {
  const id = row.original.id;
  const { setHandlerBehavior, getHandlerBehavior } = useHandlerStore();

  return (
    <Select
      onValueChange={(_value) => {
        const value = _value as HttpHandlerBehavior;
        setHandlerBehavior(row.original.id, value);
      }}
      data-theme="light"
      data-radix-color-scheme="light"
    >
      <SelectTrigger
        className="msw-dt-select-trigger"
        aria-label="Behavior"
        onClick={(e) => e.stopPropagation()}
      >
        <SelectValue
          placeholder={getHandlerBehavior(id) ?? HttpHandlerBehavior.DEFAULT}
          className="msw-dt-text-ellipsis"
        />
        <SelectIcon className="msw-dt-select-icon">
          <ChevronDownIcon />
        </SelectIcon>
      </SelectTrigger>
      <SelectPortal>
        <SelectContent
          className="msw-dt-select-content"
          style={{ zIndex: 10000 }}
          data-theme="light"
          data-radix-color-scheme="light"
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
