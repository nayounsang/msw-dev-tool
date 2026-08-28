import React from "react";

export const MockToggle = ({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) => (
  <label className="msw-dt-toggle" onClick={(event) => event.stopPropagation()}>
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      aria-label={label}
    />
    <span aria-hidden="true" />
  </label>
);
