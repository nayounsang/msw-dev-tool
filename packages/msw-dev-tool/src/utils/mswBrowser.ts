export const getMSWBrowser = async () => {
  if (typeof window === "undefined") return undefined;
  const mswBrowser = await import("msw/browser");
  return mswBrowser;
};

export const setupWorker = getMSWBrowser()
  .then((mod) => mod?.setupWorker)
  .catch(() => {
    console.error("Fail to import 'msw/browser' dynamically.");
    return undefined;
  });
