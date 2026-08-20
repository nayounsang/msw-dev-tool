import React, { useState } from "react";
import { Dialog } from "@base-ui-components/react/dialog";
import { Plus, Trash2 } from "lucide-react";
import {
  SerializableWebSocketMatcher,
  WebSocketBehaviorSelection,
  WebSocketEndpointConfig,
  WebSocketListenerConfig,
  useHandlerStore,
} from "@msw-dev-tool/core/browser";
import { Button } from "../../Components/Button";
import { CloseButton } from "../../Components/CloseButton";
import { Input } from "../../Components/Input";
import { Select } from "../../Components/Select";

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

const selectableBehaviorOptions = (source: WebSocketListenerConfig["info"]["source"]) =>
  behaviorOptions.filter((option) => source === "code" || option.value !== "default");

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
  const [preset, setPreset] = useState("send");
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const behavior = selectableBehaviorOptions("temp").find((option) => option.value === preset)?.behavior;
    if (!behavior) return;
    addListener({ endpointId: endpoint.endpointId, behavior });
    onClose();
  };
  return <form onSubmit={submit} className="msw-dt-ws-form">
    <label className="msw-dt-label" htmlFor={`ws-action-${endpoint.endpointId}`}>Response behavior</label>
    <Select id={`ws-action-${endpoint.endpointId}`} label="Response behavior" value={preset} onValueChange={(value) => setPreset(value ?? "send")} options={selectableBehaviorOptions("temp").map(({ label, value }) => ({ label, value }))} />
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
  const responseOptions = selectableBehaviorOptions(listener.info.source).map(({ label, value }) => ({ label, value }));
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
      const behavior = selectableBehaviorOptions(listener.info.source).find((option) => option.value === value)?.behavior;
      if (!behavior) return;
      setBehavior(listener.info.id, behavior);
      setEnabled(listener.info.id, true);
    }}
  />;
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
    {expanded && <tr className="msw-dt-ws-detail-row"><td colSpan={4}><div className="msw-dt-ws-listeners">
      <div className="msw-dt-ws-listener-toolbar"><ListenerDialog endpoint={endpoint} /></div>
      <table className="msw-dt-table msw-dt-ws-listener-table"><thead><tr><th>Listener</th><th>Behavior</th><th>Delete</th></tr></thead><tbody>
      {endpoint.listeners.map((listener) => { const listenerIsTemp = listener.info.source === "temp"; return <tr key={listener.info.id}><td>message</td><td><div className="msw-dt-ws-behavior-control"><ListenerBehaviorSelect listener={listener} /></div></td><td><Button variant="ghost" color="danger" disabled={!listenerIsTemp} title={listenerIsTemp ? "Delete listener" : "Listeners generated from codebase cannot be deleted"} aria-label={listenerIsTemp ? `Delete listener ${listener.info.id}` : "Listeners generated from codebase cannot be deleted"} className={listenerIsTemp ? "msw-dt-danger-text" : "msw-dt-disabled-text"} onClick={() => removeListener(listener.info.id)}><Trash2 size={16} /></Button></td></tr>; })}
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
