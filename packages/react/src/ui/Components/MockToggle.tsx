import React from "react";

export const MockToggle = ({
  checked,
  disabled = false,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) => (
  <label className="msw-dt-toggle" onClick={(event) => event.stopPropagation()}>
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={(event) => onChange(event.target.checked)}
      aria-label={label}
    />
    <span aria-hidden="true" />
  </label>
);
