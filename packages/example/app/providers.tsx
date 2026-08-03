"use client";

import dynamic from "next/dynamic";

const MswClientBootstrap = dynamic(() => import("./msw-client"), {
  ssr: false,
});

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <MswClientBootstrap />
      {children}
    </>
  );
};
