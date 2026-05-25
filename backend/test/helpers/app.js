import { createApp } from "../../src/app.js";

let app;

export function getTestApp() {
  if (!app) app = createApp();
  return app;
}
