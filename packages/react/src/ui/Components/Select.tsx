import React, { CSSProperties, forwardRef } from "react";
import { Select as BaseSelect } from "@base-ui-components/react/select";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import clsx from "clsx";

export interface SelectProps {
  options: { label: string | number; value: string }[];
  placeholder?: string | number;
  label?: string;
  id?: string;
  style?: CSSProperties;
  className?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string | null) => void;
  name?: string;
  disabled?: boolean;
  required?: boolean;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  ({ options, placeholder, label, id, style, className, value, defaultValue, onValueChange, name, disabled, required }, ref) => {
    const items = options.map((opt) => ({ value: opt.value, label: String(opt.label) }));

    return (
      <BaseSelect.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        name={name}
        disabled={disabled}
        required={required}
        items={items}
      >
        <BaseSelect.Trigger
          className={clsx("msw-dt-select-trigger", className)}
          aria-label={label ?? "select"}
          id={id}
          ref={ref}
          style={style}
        >
          <BaseSelect.Value className="msw-dt-text-ellipsis">
            {(val: string | null) => val ? (items.find((o) => o.value === val)?.label ?? val) : (placeholder ? String(placeholder) : "")}
          </BaseSelect.Value>
          <BaseSelect.Icon className="msw-dt-select-icon">
            <ChevronDown size={16} />
          </BaseSelect.Icon>
        </BaseSelect.Trigger>
        <BaseSelect.Portal>
          <BaseSelect.Positioner className="msw-dt-select-positioner">
            <BaseSelect.Popup className="msw-dt-select-popup">
              <BaseSelect.ScrollUpArrow className="msw-dt-select-scroll-arrow">
                <ChevronUp size={14} />
              </BaseSelect.ScrollUpArrow>
              <BaseSelect.List className="msw-dt-select-list">
                {options.map((opt) => (
                  <BaseSelect.Item
                    key={opt.value}
                    value={opt.value}
                    className="msw-dt-select-item"
                  >
                    <BaseSelect.ItemText>{opt.label}</BaseSelect.ItemText>
                    <BaseSelect.ItemIndicator className="msw-dt-select-item-indicator">
                      <Check size={14} />
                    </BaseSelect.ItemIndicator>
                  </BaseSelect.Item>
                ))}
              </BaseSelect.List>
              <BaseSelect.ScrollDownArrow className="msw-dt-select-scroll-arrow">
                <ChevronDown size={14} />
              </BaseSelect.ScrollDownArrow>
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
    );
  }
);

Select.displayName = "Select";
