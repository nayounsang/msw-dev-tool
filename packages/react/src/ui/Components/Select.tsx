import React, {
  ForwardedRef,
  PropsWithChildren,
  forwardRef,
  CSSProperties,
} from "react";
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
import { usePortalContainer } from "../PortalContainerProvider";
import clsx from "clsx";

interface SelectProps extends _SelectProps {
  options: { label: string | number; value: string }[];
  placeholder?: string | number;
  label?: string;
  id?: string;
  style?: CSSProperties;
  className?: string;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  ({ options, placeholder, label, id, style, className, ...rest }, ref) => {
    const container = usePortalContainer()
    return (
      <_Select {...rest}>
        <SelectTrigger
          className={clsx("msw-dt-select-trigger", className)}
          aria-label={label ?? "select"}
          onClick={(e) => e.stopPropagation()}
          id={id}
          ref={ref}
          style={style}
        >
          <SelectValue
            placeholder={placeholder}
            className="msw-dt-text-ellipsis"
          />
          <SelectIcon className="msw-dt-select-icon">
            <ChevronDownIcon />
          </SelectIcon>
        </SelectTrigger>
        {container && (
          <SelectPortal container={container}>
            <SelectContent
              className="msw-dt-select-content"
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
        )}
      </_Select>
    );
  }
);

Select.displayName = "Select";

const SelectItem = React.forwardRef(
  (
    {
      children,
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
