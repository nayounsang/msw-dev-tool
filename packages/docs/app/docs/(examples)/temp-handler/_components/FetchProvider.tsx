"use client";

import { createContext, useContext, useState } from "react";

export interface FetchResult {
  status: number;
  statusText: string;
  headers: string;
  data: string;
}

export interface FetchState {
  result: FetchResult | null;
  error: unknown;
  isLoading: boolean;
}

export interface FetchMutate {
  mutate: (params: Partial<FetchState>) => void;
}

export type FetchContextType = FetchState & FetchMutate;
export const FetchContext = createContext<FetchContextType>({
  result: null,
  error: null,
  isLoading: false,
  mutate: () => {},
});

export const FetchProvider = ({ children }: { children: React.ReactNode }) => {
  const [result, setResult] = useState<FetchResult | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(false);

  const mutate = ({ result, error, isLoading }: Partial<FetchState>) => {
    if (result !== undefined) {
      setResult(result);
    }
    if (error !== undefined) {
      setError(error);
    }
    if (isLoading !== undefined) {
      setIsLoading(isLoading);
    }
  };

  return (
    <FetchContext.Provider value={{ result, error, isLoading, mutate }}>
      {children}
    </FetchContext.Provider>
  );
};

export const useFetchContext = () => {
  return useContext(FetchContext);
};
