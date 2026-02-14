import { defineConfig } from "tsdown";

const isDev = process.env.NODE_ENV !== "production";

export default defineConfig({
  entry: "src/**/*.ts",
  dts: { sourcemap: isDev },
  minify: true,
  logLevel: "warn",
  alias: { "@": "./src" },
});
