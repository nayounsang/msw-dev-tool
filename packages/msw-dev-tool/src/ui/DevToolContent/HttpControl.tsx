import React from "react";
import { useHandlerStore } from "../../lib";
import { flatHandlerMap } from "../../utils/handlerMap";
import { dummyUrl } from "../../const/handler";

export const HttpControl = () => {
  const { handlerMap } = useHandlerStore();
  return (
    <div>
      {flatHandlerMap(handlerMap).map((flat) => {
        const { url, method } = flat;
        if (url === dummyUrl) {
          return <></>;
        }
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
      <label>
        {method}
        <input
          type="checkbox"
          checked={getIsChecked(url, method)}
          onChange={() => toggleIsChecked(url, method)}
        />
      </label>
    </div>
  );
};
