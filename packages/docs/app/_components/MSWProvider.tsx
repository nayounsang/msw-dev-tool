"use client";

import { PropsWithChildren, use, Suspense } from "react";

export const initWorkerPromise =
  typeof window === "undefined"
    ? Promise.resolve()
    : import("../../mock/browser")
        .then(async (mod) => await mod.worker)
        .then((worker) => {
          worker.start({
            onUnhandledRequest: "bypass",
          });
        });

export const MSWProviderContent = ({ children }: PropsWithChildren) => {
  use(initWorkerPromise);
  return children;
};

export const MSWProvider = ({ children }: PropsWithChildren) => {
  return (
    <Suspense fallback={null}>
      <MSWProviderContent>{children}</MSWProviderContent>
    </Suspense>
  );
};
