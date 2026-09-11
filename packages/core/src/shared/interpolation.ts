export type TemplateContext = Record<string, unknown>;

const tokenPattern = /\$\{\{([^{}]*)\}\}/g;
const pathPattern = /^(request|requestId|params|cookies|event)(?:\.[A-Za-z0-9_-]+)*$/;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getPathValue = (context: TemplateContext, path: string): unknown => {
  if (!pathPattern.test(path)) return undefined;
  const segments = path.split(".");
  let current: unknown = context;
  for (const segment of segments) {
    if (!isObject(current) || !Object.prototype.hasOwnProperty.call(current, segment)) {
      return undefined;
    }
    current = current[segment];
  }
  return current;
};

const formatValue = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean" || value === null) {
    return String(value);
  }
  const serialized = JSON.stringify(value);
  return serialized === undefined ? String(value) : serialized;
};

const resolveToken = (token: string, context: TemplateContext): string => {
  const value = getPathValue(context, token);
  return value === undefined ? `\${{${token}}}` : formatValue(value);
};

export const interpolateText = (input: string, context: TemplateContext): string =>
  input.replace(tokenPattern, (_match, token: string) => resolveToken(token, context));

const createMarkerPrefix = (input: string): string => {
  let prefix = "__MSW_DEV_TOOL_TEMPLATE_";
  while (input.includes(prefix)) prefix += "_";
  return prefix;
};

type TemplateMarker = {
  token: string;
  inString: boolean;
};

const replaceJsonTokens = (input: string) => {
  const markers = new Map<string, TemplateMarker>();
  const markerPrefix = createMarkerPrefix(input);
  let output = "";
  let inString = false;
  let escaped = false;
  let cursor = 0;
  let markerIndex = 0;

  while (cursor < input.length) {
    const character = input[cursor]!;
    if (character === '"' && !escaped) inString = !inString;
    if (character === "\\" && inString && !escaped) escaped = true;
    else escaped = false;

    if (character === "$" && input[cursor + 1] === "{" && input[cursor + 2] === "{") {
      const end = input.indexOf("}}", cursor + 3);
      if (end !== -1) {
        const token = input.slice(cursor + 3, end);
        const marker = `${markerPrefix}${markerIndex++}__`;
        markers.set(marker, { token, inString });
        output += inString ? marker : JSON.stringify(marker);
        cursor = end + 2;
        continue;
      }
    }

    output += character;
    cursor += 1;
  }

  return { output, markers };
};

const escapeRegExp = (input: string): string => input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const replaceStringMarkers = (
  value: string,
  markers: Map<string, TemplateMarker>,
  context: TemplateContext,
): string => {
  if (markers.size === 0) return value;
  const markerPattern = new RegExp([...markers.keys()].map(escapeRegExp).join("|"), "g");
  return value.replace(markerPattern, (marker) =>
    resolveToken(markers.get(marker)!.token, context),
  );
};

const replaceMarkers = (
  value: unknown,
  markers: Map<string, TemplateMarker>,
  context: TemplateContext,
): unknown => {
  if (Array.isArray(value)) return value.map((entry) => replaceMarkers(entry, markers, context));
  if (isObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        replaceStringMarkers(key, markers, context),
        replaceMarkers(entry, markers, context),
      ]),
    );
  }
  if (typeof value !== "string") return value;

  for (const [marker, { token, inString }] of markers) {
    if (value === marker && !inString) {
      const resolved = getPathValue(context, token);
      return resolved === undefined ? `\${{${token}}}` : resolved;
    }
  }

  return replaceStringMarkers(value, markers, context);
};

export const isValidJsonTemplate = (input: string): boolean => {
  try {
    const { output } = replaceJsonTokens(input);
    JSON.parse(output);
    return true;
  } catch {
    return false;
  }
};

export const interpolateJson = (input: string, context: TemplateContext): string => {
  const { output, markers } = replaceJsonTokens(input);
  const parsed: unknown = JSON.parse(output);
  return JSON.stringify(replaceMarkers(parsed, markers, context));
};
