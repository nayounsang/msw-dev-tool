import React from "react";
import { useHandlerStore } from "../../lib";
import { flatHandlerMap } from "../../utils/handlerMap";

export const HttpControl = () => {
  const { handlerMap } = useHandlerStore();
  return (
    <div>
      {flatHandlerMap(handlerMap).map((flat) => {
        const { url, method } = flat;
        return (
          <HttpControlElement
            key={`${url}-${method}`}
            url={url}
            method={method}
          />
        );
      })}
    </div>
  );
};

const HttpControlElement = ({
  url,
  method,
}: {
  url: string;
  method: string;
}) => {
  const { getIsChecked, toggleIsChecked } = useHandlerStore();
  return (
    <div>
      <p>{url}</p>
      <p>{method}</p>
      <input
        type="checkbox"
        checked={getIsChecked(url, method)}
        onChange={() => toggleIsChecked(url, method)}
      />
    </div>
  );
};
