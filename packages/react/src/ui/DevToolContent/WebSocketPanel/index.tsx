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
type ListenerFormValues = { preset: "send" | "close"; message: string; code: string; reason: string };
type FormErrors = Record<string, string | undefined>;

const matcherLabel = (matcher: SerializableWebSocketMatcher) =>
  matcher.kind === "string" ? matcher.value : `/${matcher.source}/${matcher.flags}`;

const Toggle = ({ checked, label, onChange }: { checked: boolean; label: string; onChange: (checked: boolean) => void }) => (
  <label className="msw-dt-ws-toggle">
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
  const [values, setValues] = useState<ListenerFormValues>({ preset: "send", message: "", code: "", reason: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const defaultAction: WebSocketBehaviorSelection = values.preset === "send"
      ? { preset: "send", options: { message: values.message } }
      : { preset: "close", options: { ...(values.code ? { code: Number(values.code) } : {}), ...(values.reason ? { reason: values.reason } : {}) } };
    if (defaultAction.preset === "send" && !(defaultAction.options as { message: string }).message.trim()) {
      setErrors({ form: "Message is required for send behavior" });
      return;
    }
    if (defaultAction.preset === "close") {
      const close = defaultAction.options as { code?: number; reason?: string };
      if (close.code !== undefined && (Number.isNaN(close.code) || !Number.isInteger(close.code) || (close.code !== 1000 && (close.code < 3000 || close.code > 4999)))) {
        setErrors({ form: "WebSocket close code must be 1000 or between 3000 and 4999" });
        return;
      }
      if (close.reason !== undefined && new TextEncoder().encode(close.reason).byteLength > 123) {
        setErrors({ form: "WebSocket close reason must not exceed 123 UTF-8 bytes" });
        return;
      }
    }
    addListener({ endpointId: endpoint.endpointId, behavior: defaultAction });
    onClose();
  };
  return <form onSubmit={submit} className="msw-dt-ws-form">
    <label className="msw-dt-label" htmlFor={`ws-action-${endpoint.endpointId}`}>Default action</label>
    <Select id={`ws-action-${endpoint.endpointId}`} label="Default action" value={values.preset} onValueChange={(value) => setValues({ ...values, preset: (value ?? "send") as ListenerFormValues["preset"] })} options={[{ label: "send(message)", value: "send" }, { label: "close(code/reason)", value: "close" }]} />
    {values.preset === "send" && <><label className="msw-dt-label" htmlFor="ws-message">Message</label><Input id="ws-message" value={values.message} onChange={(event) => setValues({ ...values, message: event.target.value })} /></>}
    {values.preset === "close" && <><label className="msw-dt-label" htmlFor="ws-close-code">Close code</label><Input id="ws-close-code" type="number" value={values.code} onChange={(event) => setValues({ ...values, code: event.target.value })} /><label className="msw-dt-label" htmlFor="ws-close-reason">Close reason</label><Input id="ws-close-reason" value={values.reason} onChange={(event) => setValues({ ...values, reason: event.target.value })} /></>}
    {errors.form && <p className="msw-dt-error-text">{errors.form}</p>}
    <Button type="submit">Add listener</Button>
  </form>;
};

const ListenerDialog = ({ endpoint }: { endpoint: WebSocketEndpointConfig }) => {
  const [open, setOpen] = useState(false);
  return <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Trigger render={<Button title="Add message listener"><Plus size={16} />Add listener</Button>} /><Dialog.Portal><Dialog.Backdrop className="msw-dt-dialog-backdrop" forceRender /><Dialog.Popup className="msw-dt-dialog-popup-viewport"><div className="msw-dt-dialog-inner-center"><div className="msw-dt-ws-dialog-header"><Dialog.Title className="msw-dt-dialog-title-sm">Add WebSocket listener</Dialog.Title><Dialog.Close render={<CloseButton />} /></div><ListenerForm endpoint={endpoint} onClose={() => setOpen(false)} /></div></Dialog.Popup></Dialog.Portal></Dialog.Root>;
};

const ListenerBehaviorSelect = ({ listener }: { listener: WebSocketListenerConfig }) => {
  const setEnabled = useHandlerStore((state) => state.setWebSocketListenerEnabled);

  return <Select
    label={`Behavior for ${listener.info.id}`}
    value={listener.enabled ? "default" : "disable"}
    options={[{ label: "Default", value: "default" }, { label: "Disable mock", value: "disable" }]}
    className="msw-dt-w-behavior-select"
    onValueChange={(value) => {
      if (!value) return;
      setEnabled(listener.info.id, value !== "disable");
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
    <tr className="msw-dt-ws-endpoint-row">
      <td><Button variant="ghost" className="msw-dt-ws-endpoint-trigger" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{matcherLabel(endpoint.matcher)}</Button></td>
      <td>{endpoint.listeners.length}</td>
      <td><Toggle checked={endpoint.enabled} label={`Enable mock for ${matcherLabel(endpoint.matcher)}`} onChange={(enabled) => setEndpointEnabled(endpoint.endpointId, enabled)} /></td>
      <td><Button variant="ghost" color="danger" disabled={!isTemp} title={isTemp ? "Delete endpoint" : "Endpoints generated from codebase cannot be deleted"} aria-label={isTemp ? `Delete endpoint ${matcherLabel(endpoint.matcher)}` : "Endpoints generated from codebase cannot be deleted"} className={isTemp ? "msw-dt-danger-text" : "msw-dt-disabled-text"} onClick={() => removeEndpoint(endpoint.endpointId)}><Trash2 size={16} /></Button></td>
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
