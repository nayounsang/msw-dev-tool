import { http } from "msw";

export const dummyUrl = "/msw-dev-tool-dummy";

export const dummyHandler = http.get(dummyUrl, () => {});
