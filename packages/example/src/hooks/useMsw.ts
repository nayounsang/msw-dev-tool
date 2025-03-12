import { useEffect, useRef } from "react";

export const useMsw = () => {
  const flagRef = useRef<boolean>(false);
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (flagRef.current) return;

    const initWorker = async () => {
      const worker = await import("../mocks/browser").then(
        async (mod) => await mod.worker
      );
      worker.start();
      flagRef.current = true;
    };
    initWorker();
  }, []);
};
