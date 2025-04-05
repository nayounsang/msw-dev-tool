import React, { ForwardedRef, PropsWithChildren, useState } from "react";
import {
  Select as _Select,
  SelectProps as _SelectProps,
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

interface SelectProps extends _SelectProps {
  options: { label: string | number; value: string }[];
  placeholder?: string | number;
  label?: string;
  id?:string;
}

export const Select = ({
  options,
  placeholder,
  label,
  id,
  ...rest
}: SelectProps) => {
  return (
    <_Select data-theme="light" data-radix-color-scheme="light" {...rest}>
      <SelectTrigger
        className="msw-dt-select-trigger"
        aria-label={label ?? "select"}
        onClick={(e) => e.stopPropagation()}
        id={id}
      >
        <SelectValue
          placeholder={placeholder}
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
            {options.map((opt) => {
              return (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              );
            })}
          </SelectViewport>
          <SelectScrollDownButton className="msw-dt-select-scroll-button">
            <ChevronDownIcon />
          </SelectScrollDownButton>
        </SelectContent>
      </SelectPortal>
    </_Select>
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
