import React, { createContext, PropsWithChildren, useContext } from "react";

export const PortalContainerContext = createContext<HTMLDivElement | null>(
  null
);
export const PortalContainerProvider = ({
  children,
  container,
}: PropsWithChildren<{ container: HTMLDivElement | null }>) => {
  return (
    <PortalContainerContext.Provider value={container}>
      {children}
    </PortalContainerContext.Provider>
  );
};

export const usePortalContainer = () => {
  return useContext(PortalContainerContext);
};
