import { useState } from "react";

export const useFetch = <T>(
  input: string | URL | globalThis.Request,
  init?: RequestInit
) => {
  const [isFetching, setIsFetching] = useState(false);
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const fetchData = async () => {
    try {
      setIsFetching(true);
      const response = await fetch(input, init);
      if (!response.ok) {
        setIsFetching(false);
        throw new Error("Failed to fetch users.");
      }
      const data: T = await response.json();
      setIsFetching(false);
      setData(data);
      setError(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    }
  };
  return { data, error, fetchData, isFetching };
};
