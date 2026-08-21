import { MetaRecord } from "nextra";
import { Separator } from "./_components/Separator";

const meta: MetaRecord = {
  introduction: {
    title: <Separator>INTRODUCTION</Separator>,
    type: "separator",
  },
  "get-started": {
    title: "Getting Started",
  },
  "how-to-use": {
    title: "How to Use",
  },
  roadmap: {
    title: "Roadmap",
  },
  features: {
    title: <Separator>FEATURES</Separator>,
    type: "separator",
  },
  http: {
    title: "HTTP",
  },
  websocket: {
    title: "WebSocket",
  },
  "handler-table": {
    display: "hidden",
  },
  debugger: {
    display: "hidden",
  },
  tools: {
    display: "hidden",
  },
  "node-cli": {
    title: "Node CLI",
  },
  "browser-cli": {
    title: "Browser CLI",
  },
  ui: {
    title: <Separator>UI</Separator>,
    type: "separator",
  },
  "custom-ui": {
    title: "Custom UI",
  },
  examples: {
    title: <Separator>EXAMPLES</Separator>,
    type: "separator",
  },
  playground: {
    title: "Playground",
  },
  "temp-handler": {
    title: "Temp Handler",
  },
};

export default meta;
