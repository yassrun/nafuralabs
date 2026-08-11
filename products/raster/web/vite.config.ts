import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { rasterApiPlugin } from "./server/raster-api";

const root = path.dirname(fileURLToPath(import.meta.url));
const monorepo = path.resolve(root, "../../..");

export default defineConfig({
  plugins: [react(), rasterApiPlugin(monorepo)],
  server: {
    port: 4210,
    host: "127.0.0.1",
  },
});
