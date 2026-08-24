import React from "react";
import { WebSocketResponseConfig } from "@msw-dev-tool/core/browser";
import { Input } from "../../Components/Input";
import { TextArea } from "../../Components/TextArea";

export type WebSocketResponseFormState = {
  type: "send" | "close";
  dataType: "string" | "Blob" | "ArrayBuffer";
  value: string;
  metadataType: string;
  code: string;
  reason: string;
  delay: number;
  repeat: boolean;
  interval: number;
  repetitions: string;
};

export const webSocketResponseFormValues = (
  response?: WebSocketResponseConfig,
): WebSocketResponseFormState => ({
  type: response?.type ?? "send",
  dataType: response?.type === "send" ? response.dataType : "string",
  value: response?.type === "send" ? response.value : "",
  metadataType: response?.type === "send" ? (response.metadata?.type ?? "") : "",
  code: response?.type === "close" && response.code !== undefined ? String(response.code) : "",
  reason: response?.type === "close" ? (response.reason ?? "") : "",
  delay: response?.delay ?? 0,
  repeat: Boolean(response?.repeat),
  interval: response?.repeat?.interval ?? 1000,
  repetitions: String(response?.repeat?.repetitions ?? 3),
});

export const webSocketResponseFromFormValues = (
  values: WebSocketResponseFormState,
): WebSocketResponseConfig => {
  const schedule = {
    delay: Number(values.delay),
    ...(values.repeat
      ? {
          repeat: {
            interval: Number(values.interval),
            repetitions:
              values.repetitions === "Infinity"
                ? ("Infinity" as const)
                : Number(values.repetitions),
          },
        }
      : {}),
  };
  return values.type === "send"
    ? {
        type: "send",
        dataType: values.dataType,
        value: values.value,
        ...(values.metadataType.trim() ? { metadata: { type: values.metadataType.trim() } } : {}),
        ...schedule,
      }
    : {
        type: "close",
        ...(values.code.trim() ? { code: Number(values.code) } : {}),
        ...(values.reason ? { reason: values.reason } : {}),
        ...schedule,
      };
};

export const WebSocketResponseFields = ({
  values,
  update,
  fieldId,
  required = false,
}: {
  values: WebSocketResponseFormState;
  update: <K extends keyof WebSocketResponseFormState>(
    key: K,
    value: WebSocketResponseFormState[K],
  ) => void;
  fieldId: string;
  required?: boolean;
}) => (
  <section className="msw-dt-ws-section" aria-labelledby={`response-title-${fieldId}`}>
    <h3 id={`response-title-${fieldId}`}>Response</h3>
    <div className="msw-dt-ws-response-fields">
      <fieldset>
        <legend className="msw-dt-label">Response type</legend>
        <label>
          <input
            type="radio"
            name={`ws-response-type-${fieldId}`}
            checked={values.type === "send"}
            onChange={() => update("type", "send")}
          />{" "}
          Send
        </label>
        <label>
          <input
            type="radio"
            name={`ws-response-type-${fieldId}`}
            checked={values.type === "close"}
            onChange={() => update("type", "close")}
          />{" "}
          Close
        </label>
      </fieldset>
      {values.type === "send" ? (
        <>
          <fieldset>
            <legend className="msw-dt-label">Data type</legend>
            {(["string", "Blob", "ArrayBuffer"] as const).map((dataType) => (
              <label key={dataType}>
                <input
                  type="radio"
                  name={`ws-data-type-${fieldId}`}
                  checked={values.dataType === dataType}
                  onChange={() => update("dataType", dataType)}
                />{" "}
                {dataType}
              </label>
            ))}
          </fieldset>
          <label className="msw-dt-label" htmlFor={`ws-response-value-${fieldId}`}>
            Value{required ? " *" : ""}
          </label>
          <TextArea
            id={`ws-response-value-${fieldId}`}
            value={values.value}
            placeholder={
              values.dataType === "string"
                ? undefined
                : "Enter bytes as space-separated hexadecimal values."
            }
            onChange={(event) => update("value", event.target.value)}
            required={required}
          />
          <label className="msw-dt-label" htmlFor={`ws-response-metadata-${fieldId}`}>
            Metadata type
          </label>
          <Input
            id={`ws-response-metadata-${fieldId}`}
            value={values.metadataType}
            onChange={(event) => update("metadataType", event.target.value)}
          />
        </>
      ) : (
        <>
          <label className="msw-dt-label" htmlFor={`ws-close-code-${fieldId}`}>
            Close code
          </label>
          <Input
            id={`ws-close-code-${fieldId}`}
            inputMode="numeric"
            value={values.code}
            onChange={(event) => update("code", event.target.value)}
          />
          <label className="msw-dt-label" htmlFor={`ws-close-reason-${fieldId}`}>
            Reason
          </label>
          <Input
            id={`ws-close-reason-${fieldId}`}
            value={values.reason}
            onChange={(event) => update("reason", event.target.value)}
          />
        </>
      )}
      <div className="msw-dt-ws-schedule-grid">
        <label className="msw-dt-ws-field" htmlFor={`ws-delay-${fieldId}`}>
          <span>Delay (ms)</span>
          <Input
            id={`ws-delay-${fieldId}`}
            inputMode="numeric"
            min={0}
            type="number"
            value={values.delay}
            onChange={(event) => update("delay", Number(event.target.value))}
          />
        </label>
        <label className="msw-dt-ws-checkbox msw-dt-ws-repeat-row">
          <input
            type="checkbox"
            checked={values.repeat}
            onChange={(event) => update("repeat", event.target.checked)}
          />
          <span>Repeat</span>
        </label>
        {values.repeat && (
          <>
            <label className="msw-dt-ws-field" htmlFor={`ws-interval-${fieldId}`}>
              <span>Interval (ms)</span>
              <Input
                id={`ws-interval-${fieldId}`}
                inputMode="numeric"
                min={0}
                type="number"
                value={values.interval}
                onChange={(event) => update("interval", Number(event.target.value))}
              />
            </label>
            <label className="msw-dt-ws-field" htmlFor={`ws-repetitions-${fieldId}`}>
              <span>Repetitions</span>
              <Input
                id={`ws-repetitions-${fieldId}`}
                inputMode="numeric"
                value={values.repetitions}
                onChange={(event) => update("repetitions", event.target.value)}
                placeholder="Infinity"
              />
            </label>
          </>
        )}
      </div>
    </div>
  </section>
);
