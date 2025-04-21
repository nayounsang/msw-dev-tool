import React from "react";

export const MSWDevToolLogo = ({
  size = "28",
  backgroundColor = "#101010",
  color = "#FF6600",
  className,
}: {
  size?: string | number;
  backgroundColor?: string;
  color?: string;
  className?: string;
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect
        width="28"
        height="28"
        rx="5"
        fill={backgroundColor}
      />
      <rect
        width="24"
        height="24"
        transform="translate(2 2)"
        fill={backgroundColor}
      />
      <path
        d="M24 10C24 13.3135 21.3135 16 18 16C16.9865 16 16.032 15.7485 15.195 15.305L6.5 24L4 21.5L12.695 12.805C12.2373 11.941 11.9987 10.9778 12 10C12 6.6865 14.6865 4 18 4C19.0135 4 19.968 4.251 20.805 4.695L17 8.5L19.5 11L23.305 7.195C23.7627 8.05905 24.0013 9.02222 24 10Z"
        fill={color}
        stroke={color}
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
