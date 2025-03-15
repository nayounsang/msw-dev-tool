"use client";

import { createContext, PropsWithChildren, useContext } from "react";
import { useStartMSW } from "../_hooks/useStartMSW";

export const LoadMSWContext = createContext<{ isLoading: boolean }>({
  isLoading: true,
});

export const MSWProvider = ({ children }: PropsWithChildren) => {
  const { isLoading } = useStartMSW();
  return (
    <LoadMSWContext.Provider value={{ isLoading }}>
      {children}
    </LoadMSWContext.Provider>
  );
};

export const useLoadMSWContext = () => useContext(LoadMSWContext);
