import { z } from "zod";
import { STORAGE_KEY } from "../shared/const";
import {
  HttpHandlerBehavior,
  HttpMethod,
  PersistedStorageData,
  StorageData,
} from "../shared/types";
import { customResponseSchema, tempHandlerSchema } from "../shared/schema";
import { mergeStorageData as mergeStorageDataPure } from "../shared/utils/storage";
import type { JsonValue } from "../shared/types";
import { webSocketEndpointsSchema } from "../shared/schema/websocket";

export type BrowserStorageSnapshot = { revision: number; state: PersistedStorageData };

const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() => z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(jsonValueSchema), z.record(jsonValueSchema)]));

const persistedFlattenHandlerSchema = z.object({
  id: z.string(),
  path: z.string(),
  method: z.nativeEnum(HttpMethod),
  behavior: z.nativeEnum(HttpHandlerBehavior),
  type: z.enum(["temp", "default"]),
  tempInput: tempHandlerSchema.optional(),
  customResponse: customResponseSchema.optional(),
});

const browserStoragePayloadSchema = z.object({
  revision: z.number().optional(),
  state: z.object({
    flattenHandlers: z.array(persistedFlattenHandlerSchema),
    webSocket: webSocketEndpointsSchema.optional(),
  }),
});

export const getBrowserStorageSnapshot = (): BrowserStorageSnapshot => {
  if (typeof sessionStorage === "undefined") return { revision: 0, state: { flattenHandlers: [] } };
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return { revision: 0, state: { flattenHandlers: [] } };
  let rawPayload: unknown;
  try {
    rawPayload = JSON.parse(raw);
  } catch {
    throw new Error(`Invalid msw-dev-tool sessionStorage payload for key "${STORAGE_KEY}": invalid JSON`);
  }

  const parsed = browserStoragePayloadSchema.safeParse(rawPayload);
  if (!parsed.success) {
    throw new Error(
      `Invalid msw-dev-tool sessionStorage payload for key "${STORAGE_KEY}": ${parsed.error.issues[0]?.message ?? "invalid payload"}`
    );
  }
  return { revision: parsed.data.revision ?? 0, state: parsed.data.state };
};

export const getStorageData = (): PersistedStorageData => {
  // Guard against SSR ReferenceError: sessionStorage is not defined.
  if (typeof sessionStorage === "undefined") {
    return { flattenHandlers: [] };
  }

  return getBrowserStorageSnapshot().state;
};

export const mergeStorageData = ({
  flattenHandlers: newFlattenHandlers,
}: StorageData) => {
  return mergeStorageDataPure(
    { flattenHandlers: newFlattenHandlers },
    getStorageData()
  );
};
