import React, { useEffect, useState } from "react";
import { Dialog } from "@base-ui-components/react/dialog";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  SerializableWebSocketMatcher,
  WebSocketBehaviorSelection,
  WebSocketResponse,
  WebSocketEndpointConfig,
  WebSocketListenerConfig,
  useHandlerStore,
} from "@msw-dev-tool/core/browser";
import { webSocketCustomResponseSchema } from "@msw-dev-tool/core/shared";
import { Button } from "../../Components/Button";
import { CloseButton } from "../../Components/CloseButton";
import { Input } from "../../Components/Input";
import { Select } from "../../Components/Select";
import { TextArea } from "../../Components/TextArea";
import { CUSTOM_RESPONSE_DESCRIPTION } from "../constants";

type EndpointFormValues = { matcherType: "string" | "regexp"; value: string; flags: string };
type FormErrors = Record<string, string | undefined>;

const TEST_MESSAGE = "Test message from MSW Dev Tool";

const behaviorOptions = [
  { label: "Default", value: "default", behavior: { preset: "default" } },
  { label: "No reply (delay)", value: "no-reply", behavior: { preset: "no-reply" } },
  { label: "Send null", value: "send-null", behavior: { preset: "send-null" } },
  { label: "Close (4000 — Error)", value: "close-4000", behavior: { preset: "close", options: { code: 4000, reason: "Error" } } },
  { label: "Send test message", value: "send", behavior: { preset: "send", options: { message: TEST_MESSAGE } } },
  { label: "Echo message", value: "echo", behavior: { preset: "echo" } },
  { label: "Repeat message (3 times, every 1 sec)", value: "send-sequence", behavior: { preset: "send-sequence" } },
  { label: "Custom response", value: "custom response", behavior: { preset: "custom response" } },
  { label: "Close (1000 — Normal)", value: "close-1000", behavior: { preset: "close", options: { code: 1000, reason: "Normal closure" } } },
  { label: "Close (4001 — Unauthorized)", value: "close-4001", behavior: { preset: "close", options: { code: 4001, reason: "Unauthorized" } } },
  { label: "Close (4008 — Rate limited)", value: "close-4008", behavior: { preset: "close", options: { code: 4008, reason: "Rate limited" } } },
] as const satisfies ReadonlyArray<{ label: string; value: string; behavior: WebSocketBehaviorSelection }>;

const closeBehaviorValue = (code?: number) => `close-${code ?? 1000}`;

const behaviorValue = (behavior: WebSocketBehaviorSelection) =>
  behavior.preset === "close"
    ? closeBehaviorValue((behavior.options as { code?: number } | undefined)?.code)
    : behavior.preset;

const behaviorLabel = (behavior: WebSocketBehaviorSelection) =>
  behavior.preset === "close"
    ? `Close (${(behavior.options as { code?: number } | undefined)?.code ?? 1000})`
    : behavior.preset;

const selectableBehaviorOptions = () => behaviorOptions;

const matcherLabel = (matcher: SerializableWebSocketMatcher) =>
  matcher.kind === "string" ? matcher.value : `/${matcher.source}/${matcher.flags}`;

const Toggle = ({ checked, label, onChange }: { checked: boolean; label: string; onChange: (checked: boolean) => void }) => (
  <label className="msw-dt-ws-toggle" onClick={(event) => event.stopPropagation()}>
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} aria-label={label} />
    <span aria-hidden="true" />
  </label>
);

const EndpointForm = ({ onClose }: { onClose: () => void }) => {
  const addEndpoint = useHandlerStore((state) => state.addTempWebSocketEndpoint);
  const [values, setValues] = useState<EndpointFormValues>({ matcherType: "string", value: "", flags: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const matcher = values.matcherType === "string"
      ? { kind: "string" as const, value: values.value }
      : { kind: "regexp" as const, source: values.value, flags: values.flags };
    if (!values.value.trim()) {
      setErrors({ value: "Matcher is required" });
      return;
    }
    try {
      if (matcher.kind === "regexp") new RegExp(matcher.source, matcher.flags);
      addEndpoint({ matcher, endpoint: matcherLabel(matcher) });
      onClose();
    } catch {
      setErrors({ value: "WebSocket regular-expression matcher must be valid" });
    }
  };
  return <form onSubmit={submit} className="msw-dt-ws-form">
    <label className="msw-dt-label" htmlFor="ws-matcher-type">Matcher type</label>
    <Select id="ws-matcher-type" label="Matcher type" value={values.matcherType} onValueChange={(value) => setValues({ ...values, matcherType: (value ?? "string") as EndpointFormValues["matcherType"] })} options={[{ label: "String", value: "string" }, { label: "RegExp", value: "regexp" }]} />
    <label className="msw-dt-label" htmlFor="ws-matcher">{values.matcherType === "regexp" ? "RegExp source" : "URL matcher"}</label>
    <Input id="ws-matcher" value={values.value} onChange={(event) => setValues({ ...values, value: event.target.value })} aria-invalid={Boolean(errors.value)} required />
    {errors.value && <p className="msw-dt-error-text">{errors.value}</p>}
    {values.matcherType === "regexp" && <><label className="msw-dt-label" htmlFor="ws-flags">RegExp flags</label><Input id="ws-flags" value={values.flags} onChange={(event) => setValues({ ...values, flags: event.target.value })} /></>}
    <Button type="submit"><Plus size={16} />Add endpoint</Button>
  </form>;
};

const ListenerForm = ({ endpoint, onClose }: { endpoint: WebSocketEndpointConfig; onClose: () => void }) => {
  const addListener = useHandlerStore((state) => state.addTempWebSocketListener);
  const [preset, setPreset] = useState("default");
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const behavior = selectableBehaviorOptions().find((option) => option.value === preset)?.behavior;
    if (!behavior) return;
    addListener({ endpointId: endpoint.endpointId, behavior });
    onClose();
  };
  return <form onSubmit={submit} className="msw-dt-ws-form">
    <label className="msw-dt-label" htmlFor={`ws-action-${endpoint.endpointId}`}>Response behavior</label>
    <Select id={`ws-action-${endpoint.endpointId}`} label="Response behavior" value={preset} onValueChange={(value) => setPreset(value ?? "default")} options={selectableBehaviorOptions().map(({ label, value }) => ({ label, value }))} />
    <Button type="submit">Add listener</Button>
  </form>;
};

const ListenerDialog = ({ endpoint }: { endpoint: WebSocketEndpointConfig }) => {
  const [open, setOpen] = useState(false);
  return <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Trigger render={<Button title="Add message listener"><Plus size={16} />Add listener</Button>} /><Dialog.Portal><Dialog.Backdrop className="msw-dt-dialog-backdrop" forceRender /><Dialog.Popup className="msw-dt-dialog-popup-viewport"><div className="msw-dt-dialog-inner-center"><div className="msw-dt-ws-dialog-header"><Dialog.Title className="msw-dt-dialog-title-sm">Add WebSocket listener</Dialog.Title><Dialog.Close render={<CloseButton />} /></div><ListenerForm endpoint={endpoint} onClose={() => setOpen(false)} /></div></Dialog.Popup></Dialog.Portal></Dialog.Root>;
};

const ListenerBehaviorSelect = ({ listener }: { listener: WebSocketListenerConfig }) => {
  const setEnabled = useHandlerStore((state) => state.setWebSocketListenerEnabled);
  const setBehavior = useHandlerStore((state) => state.setWebSocketListenerBehavior);
  const responseOptions = selectableBehaviorOptions().map(({ label, value }) => ({ label, value }));
  const currentValue = behaviorValue(listener.behavior);
  const options = [
    ...responseOptions.slice(0, 1),
    { label: "Disable mock", value: "disable" },
    ...responseOptions.slice(1),
    ...(responseOptions.some((option) => option.value === currentValue) ? [] : [{ label: behaviorLabel(listener.behavior), value: currentValue }]),
  ];

  return <Select
    label={`Behavior for ${listener.info.id}`}
    value={listener.enabled ? currentValue : "disable"}
    options={options}
    className="msw-dt-w-behavior-select"
    onValueChange={(value) => {
      if (!value) return;
      if (value === "disable") {
        setEnabled(listener.info.id, false);
        return;
      }
      const behavior = selectableBehaviorOptions().find((option) => option.value === value)?.behavior;
      if (!behavior) return;
      setBehavior(listener.info.id, behavior);
      setEnabled(listener.info.id, true);
    }}
  />;
};

type CustomResponseFormState = {
  type: "send" | "close";
  dataType: "string" | "Blob" | "ArrayBuffer";
  value: string;
  metadataType: string;
  code: string;
  reason: string;
};

const customResponseFormValues = (response?: WebSocketResponse): CustomResponseFormState => ({
  type: response?.type ?? "send",
  dataType: response?.type === "send" ? response.dataType : "string",
  value: response?.type === "send" ? response.value : "",
  metadataType: response?.type === "send" ? response.metadata?.type ?? "" : "",
  code: response?.type === "close" && response.code !== undefined ? String(response.code) : "",
  reason: response?.type === "close" ? response.reason ?? "" : "",
});

const ResponseDialog = ({ listener, field }: { listener: WebSocketListenerConfig; field: "response" | "customResponse" }) => {
  const setCustomResponse = useHandlerStore((state) => state.setWebSocketListenerCustomResponse);
  const setResponse = useHandlerStore((state) => state.setWebSocketListenerResponse);
  const currentResponse = field === "response" ? listener.response : listener.customResponse;
  const title = field === "response" ? "WebSocket Response" : "Custom WebSocket Response";
  const description = field === "response"
    ? "Saving updates the temporary listener response used by the default Behavior."
    : CUSTOM_RESPONSE_DESCRIPTION;
  const fieldId = `${field}-${listener.info.id}`;
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<CustomResponseFormState>(customResponseFormValues(currentResponse));
  const [error, setError] = useState<string>();

  const openDialog = () => {
    setValues(customResponseFormValues(currentResponse));
    setError(undefined);
    setOpen(true);
  };
  const update = <K extends keyof CustomResponseFormState>(key: K, value: CustomResponseFormState[K]) =>
    setValues((current) => ({ ...current, [key]: value }));
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const response: WebSocketResponse = values.type === "send"
      ? {
          type: "send",
          dataType: values.dataType,
          value: values.value,
          ...(values.metadataType.trim() ? { metadata: { type: values.metadataType.trim() } } : {}),
        }
      : {
          type: "close",
          ...(values.code.trim() ? { code: Number(values.code) } : {}),
          ...(values.reason ? { reason: values.reason } : {}),
        };
    const parsed = webSocketCustomResponseSchema.safeParse(response);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid custom response");
      return;
    }
    if (field === "response") setResponse(listener.info.id, parsed.data);
    else setCustomResponse(listener.info.id, parsed.data);
    setOpen(false);
  };

  return <>
    <Button variant="ghost" color="gray" title={`Configure ${field}`} aria-label={`Configure ${field}`} onClick={openDialog}><Pencil size={16} /></Button>
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Backdrop className="msw-dt-dialog-backdrop" forceRender />
        <Dialog.Popup className="msw-dt-dialog-popup-viewport">
          <div className="msw-dt-dialog-inner-center">
            <div className="msw-dt-ws-dialog-header"><Dialog.Title className="msw-dt-dialog-title-sm">{title}</Dialog.Title><Dialog.Close render={<CloseButton />} /></div>
            <Dialog.Description className="msw-dt-dialog-description">{description}</Dialog.Description>
            <form onSubmit={submit} className="msw-dt-ws-form">
              <fieldset>
                <legend className="msw-dt-label">Response type</legend>
                <label><input type="radio" name={`ws-response-type-${fieldId}`} checked={values.type === "send"} onChange={() => update("type", "send")} /> Send</label>
                <label><input type="radio" name={`ws-response-type-${fieldId}`} checked={values.type === "close"} onChange={() => update("type", "close")} /> Close</label>
              </fieldset>
              {values.type === "send" ? <>
                <fieldset>
                  <legend className="msw-dt-label">Data type</legend>
                  {(["string", "Blob", "ArrayBuffer"] as const).map((dataType) => <label key={dataType}><input type="radio" name={`ws-data-type-${fieldId}`} checked={values.dataType === dataType} onChange={() => update("dataType", dataType)} /> {dataType}</label>)}
                </fieldset>
                <label className="msw-dt-label" htmlFor={`ws-response-value-${fieldId}`}>Value *</label>
                <TextArea id={`ws-response-value-${fieldId}`} value={values.value} placeholder={values.dataType === "string" ? undefined : "Enter bytes as space-separated hexadecimal values."} onChange={(event) => update("value", event.target.value)} required />
                <label className="msw-dt-label" htmlFor={`ws-response-metadata-${fieldId}`}>Metadata type</label>
                <Input id={`ws-response-metadata-${fieldId}`} value={values.metadataType} onChange={(event) => update("metadataType", event.target.value)} />
              </> : <>
                <label className="msw-dt-label" htmlFor={`ws-close-code-${fieldId}`}>Close code</label>
                <Input id={`ws-close-code-${fieldId}`} inputMode="numeric" value={values.code} onChange={(event) => update("code", event.target.value)} />
                <label className="msw-dt-label" htmlFor={`ws-close-reason-${fieldId}`}>Reason</label>
                <Input id={`ws-close-reason-${fieldId}`} value={values.reason} onChange={(event) => update("reason", event.target.value)} />
              </>}
              {error && <p className="msw-dt-error-text">{error}</p>}
              <Button type="submit">Save {field === "response" ? "response" : "custom response"}</Button>
            </form>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  </>;
};

const ListenerSchedule = ({ listener }: { listener: WebSocketListenerConfig }) => {
  const setSchedule = useHandlerStore((state) => state.setWebSocketListenerSchedule);
  const [delay, setDelay] = useState(listener.delay ?? 0);
  const [repeat, setRepeat] = useState(Boolean(listener.repeat));
  const [interval, setInterval] = useState(listener.repeat?.interval ?? 1000);
  const [repetitions, setRepetitions] = useState(String(listener.repeat?.repetitions ?? 3));

  useEffect(() => {
    setDelay(listener.delay ?? 0);
    setRepeat(Boolean(listener.repeat));
    setInterval(listener.repeat?.interval ?? 1000);
    setRepetitions(String(listener.repeat?.repetitions ?? 3));
  }, [listener.delay, listener.repeat]);

  const saveRepeat = (nextInterval = interval, nextRepetitions = repetitions) => {
    const parsedRepetitions = nextRepetitions === "Infinity" ? "Infinity" : Number(nextRepetitions);
    if (!Number.isInteger(nextInterval) || nextInterval < 0 || (parsedRepetitions !== "Infinity" && (!Number.isInteger(parsedRepetitions) || parsedRepetitions < 1))) return;
    setSchedule(listener.info.id, { delay, repeat: { interval: nextInterval, repetitions: parsedRepetitions } });
  };

  return <div className="msw-dt-ws-schedule">
    <label className="msw-dt-label" htmlFor={`ws-delay-${listener.info.id}`}>Delay (ms)</label>
    <Input id={`ws-delay-${listener.info.id}`} inputMode="numeric" min={0} type="number" value={delay} onChange={(event) => { const value = Math.max(0, Number(event.target.value)); setDelay(value); setSchedule(listener.info.id, { delay: value }); }} />
    <label><input type="checkbox" checked={repeat} onChange={(event) => { const checked = event.target.checked; setRepeat(checked); if (checked) saveRepeat(); else setSchedule(listener.info.id, { repeat: undefined }); }} /> Repeat</label>
    {repeat && <>
      <label className="msw-dt-label" htmlFor={`ws-interval-${listener.info.id}`}>Interval (ms)</label>
      <Input id={`ws-interval-${listener.info.id}`} inputMode="numeric" min={0} type="number" value={interval} onChange={(event) => { const value = Math.max(0, Number(event.target.value)); setInterval(value); saveRepeat(value, repetitions); }} />
      <label className="msw-dt-label" htmlFor={`ws-repetitions-${listener.info.id}`}>Repetitions</label>
      <Input id={`ws-repetitions-${listener.info.id}`} inputMode="numeric" value={repetitions} onChange={(event) => { setRepetitions(event.target.value); saveRepeat(interval, event.target.value); }} placeholder="Infinity" />
    </>}
  </div>;
};

const EndpointRow = ({ endpoint }: { endpoint: WebSocketEndpointConfig }) => {
  const [expanded, setExpanded] = useState(false);
  const removeEndpoint = useHandlerStore((state) => state.removeWebSocketEndpoint);
  const removeListener = useHandlerStore((state) => state.removeWebSocketListener);
  const setEndpointEnabled = useHandlerStore((state) => state.setWebSocketEndpointEnabled);
  const isTemp = endpoint.info.source === "temp";
  return <>
    <tr className="msw-dt-ws-endpoint-row" onClick={() => setExpanded(!expanded)}>
      <td><Button variant="ghost" className="msw-dt-ws-endpoint-trigger" aria-expanded={expanded}>{matcherLabel(endpoint.matcher)}</Button></td>
      <td>{endpoint.listeners.length}</td>
      <td><Toggle checked={endpoint.enabled} label={`Enable mock for ${matcherLabel(endpoint.matcher)}`} onChange={(enabled) => setEndpointEnabled(endpoint.endpointId, enabled)} /></td>
      <td onClick={(event) => event.stopPropagation()}><Button variant="ghost" color="danger" disabled={!isTemp} title={isTemp ? "Delete endpoint" : "Endpoints generated from codebase cannot be deleted"} aria-label={isTemp ? `Delete endpoint ${matcherLabel(endpoint.matcher)}` : "Endpoints generated from codebase cannot be deleted"} className={isTemp ? "msw-dt-danger-text" : "msw-dt-disabled-text"} onClick={() => removeEndpoint(endpoint.endpointId)}><Trash2 size={16} /></Button></td>
    </tr>
    {expanded && <tr className="msw-dt-ws-detail-row"><td colSpan={6}><div className="msw-dt-ws-listeners">
      <div className="msw-dt-ws-listener-toolbar"><ListenerDialog endpoint={endpoint} /></div>
      <table className="msw-dt-table msw-dt-ws-listener-table"><thead><tr><th>Listener</th><th>Behavior</th><th>Response</th><th>Custom response</th><th>Schedule</th><th>Delete</th></tr></thead><tbody>
      {endpoint.listeners.map((listener) => { const listenerIsTemp = listener.info.source === "temp"; return <tr key={listener.info.id}><td>message</td><td><div className="msw-dt-ws-behavior-control"><ListenerBehaviorSelect listener={listener} />{listener.behavior.preset === "custom response" && !listener.customResponse && <p className="msw-dt-error-text">Please configure a custom response before using this behavior.</p>}</div></td><td><ResponseDialog listener={listener} field="response" /></td><td><ResponseDialog listener={listener} field="customResponse" /></td><td><ListenerSchedule listener={listener} /></td><td><Button variant="ghost" color="danger" disabled={!listenerIsTemp} title={listenerIsTemp ? "Delete listener" : "Listeners generated from codebase cannot be deleted"} aria-label={listenerIsTemp ? `Delete listener ${listener.info.id}` : "Listeners generated from codebase cannot be deleted"} className={listenerIsTemp ? "msw-dt-danger-text" : "msw-dt-disabled-text"} onClick={() => removeListener(listener.info.id)}><Trash2 size={16} /></Button></td></tr>; })}
      </tbody></table>
    </div></td></tr>}
  </>;
};

export const AddWebSocketEndpointDialog = () => {
  const [open, setOpen] = useState(false);
  return <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Trigger render={<Button><Plus size={16} />Add WebSocket Endpoint</Button>} /><Dialog.Portal><Dialog.Backdrop className="msw-dt-dialog-backdrop" forceRender /><Dialog.Popup className="msw-dt-dialog-popup-viewport"><div className="msw-dt-dialog-inner-center"><div className="msw-dt-ws-dialog-header"><Dialog.Title className="msw-dt-dialog-title-sm">Add WebSocket Endpoint</Dialog.Title><Dialog.Close render={<CloseButton />} /></div><EndpointForm onClose={() => setOpen(false)} /></div></Dialog.Popup></Dialog.Portal></Dialog.Root>;
};

export const WebSocketPanel = () => {
  const endpoints = useHandlerStore((state) => state.webSocket.endpoints);
  return <div className="msw-dt-ws-panel"><p className="msw-dt-ws-intro">Connect to an endpoint to discover its listeners, then click a row to control them.</p>{endpoints.length === 0 ? <p className="msw-dt-ws-empty">No WebSocket endpoints</p> : <table className="msw-dt-table msw-dt-ws-table"><thead><tr><th>API</th><th>Listeners</th><th>Mock Enable</th><th>Delete</th></tr></thead><tbody>{endpoints.map((endpoint) => <EndpointRow key={endpoint.endpointId} endpoint={endpoint} />)}</tbody></table>}</div>;
};
