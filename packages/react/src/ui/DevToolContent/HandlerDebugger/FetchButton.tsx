import React from "react";
import { Button } from "../../Components/Button";
import { Play, RotateCcw } from "lucide-react";
import { useDebugContext } from "./DebugProvider";
import {
  getPathWithParams,
  getSearchParams,
  getTotalUrl,
} from "../../../utils/url";

const getResponseString = async (res: Response): Promise<string> => {
  const contentType = res.headers.get("content-type")?.toLowerCase() || "";

  if (contentType.includes("application/json")) {
    const data = await res.json();
    return JSON.stringify(data, null, 2);
  }

  if (contentType.includes("multipart/form-data")) {
    const formData = await res.formData();
    const formDataObj: Record<string, string> = {};
    formData.forEach((value, key) => {
      formDataObj[key] = value.toString();
    });
    return JSON.stringify(formDataObj, null, 2);
  }

  return await res.text();
};

export const FetchButton = () => {
  const { loading, requestHeader, setDebug, url, pathParam, searchParam } =
    useDebugContext();

  const finalPath = getPathWithParams(url, pathParam);
  const searchParamsString = getSearchParams(searchParam);
  const totalUrl = getTotalUrl(url.origin, finalPath, searchParamsString);

  const handleFetch = () => {
    setDebug("loading", true);
    setDebug("response", {});

    fetch(totalUrl, {
      headers: {
        ...requestHeader,
      },
    })
      .then(async (res) => {
        const data = await getResponseString(res);
        setDebug("response", {
          data,
          statusCode: res.status,
          statusText: res.statusText,
        });
      })
      .catch((err) => {
        setDebug("response", {
          errorMessage: err instanceof Error ? err.message : "Failed to fetch",
        });
      })
      .finally(() => {
        setDebug("loading", false);
      });
  };

  return (
    <Button
      onClick={handleFetch}
      color="primary"
      style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
    >
      {loading ? <RotateCcw size={16} className="msw-dt-spin" /> : <Play size={16} />}
      Send Request
    </Button>
  );
};
