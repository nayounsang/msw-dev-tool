import { useEffect, useRef, useState } from "react";

export const useStartMSW = () => {
  const [isLoading, setIsLoading] = useState(true);
  const flagRef = useRef<boolean>(false);

  useEffect(() => {
    if (flagRef.current) return;

    const initWorker = async () => {
      const worker = await import("../../mock/browser").then(
        async (mod) => await mod.worker
      );
      worker.start({
        onUnhandledRequest: "bypass",
      });
      flagRef.current = true;
      setIsLoading(false);
    };
    initWorker();
  }, []);
  return { isLoading };
};
