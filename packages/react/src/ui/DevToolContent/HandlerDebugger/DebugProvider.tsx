import { matchRequestUrl, Path, PathParams } from "msw";
import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useState,
} from "react";

export interface DebugResponse {
  errorMessage?: string;
  data?: string;
  statusCode?: number;
  statusText?: string;
}

export interface DebugState {
  loading: boolean;
  requestHeader: Record<string, string>;
  searchParam: Record<string, string>;
  pathParam: PathParams<string> | undefined;
  response: DebugResponse;
  url: URL;
}

export interface DebugContextValue extends DebugState {
  setDebug: <K extends keyof DebugState>(
    key: K,
    value: DebugState[K] | ((prev: DebugState[K]) => DebugState[K])
  ) => void;
  reset: () => void;
}

const getInitialState = (
  params: PathParams<string> | undefined
): DebugState => ({
  url: new URL(window.location.href),
  loading: false,
  requestHeader: {},
  searchParam: {},
  pathParam: params
    ? Object.keys(params).reduce(
        (acc, key) => ({
          ...acc,
          [key]: "",
        }),
        {}
      )
    : undefined,
  response: {},
});

const DebugContext = createContext<DebugContextValue | null>(null);

export const DebugProvider = ({
  children,
  url,
  path,
}: PropsWithChildren<{ url: URL; path: Path }>) => {
  const { params } = matchRequestUrl(url, path, url.origin);
  const [state, setState] = useState<DebugState>(getInitialState(params));

  const setDebug = <K extends keyof DebugState>(
    key: K,
    value: DebugState[K] | ((prev: DebugState[K]) => DebugState[K])
  ) => {
    setState((prev) => ({
      ...prev,
      [key]: typeof value === "function" ? value(prev[key]) : value,
    }));
  };

  const reset = () => {
    setState(getInitialState(params));
  };

  return (
    <DebugContext.Provider
      value={{
        ...state,
        url,
        setDebug,
        reset,
      }}
    >
      {children}
    </DebugContext.Provider>
  );
};

export const useDebugContext = () => {
  const context = useContext(DebugContext);
  if (!context) {
    throw new Error("useDebug must be used within a DebugProvider");
  }
  return context;
};
