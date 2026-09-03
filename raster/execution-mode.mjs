/**
 * Modes d'exécution du harness Cursor.
 *
 * Les commandes et clés restent hors dépôt. Raster choisit seulement le mode
 * et lance l'adaptateur configuré dans l'environnement local.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

export const EXECUTION_MODES = ["local", "agents"];
const RASTER_ROOT = path.dirname(fileURLToPath(import.meta.url));
const SDK_RUNNER = path.join(
  RASTER_ROOT,
  "sources",
  "web",
  "server",
  "cursor-runner.mjs"
);

export function normalizeMode(mode = "local") {
  const value = String(mode || "local").trim().toLowerCase();
  if (!EXECUTION_MODES.includes(value)) {
    throw new Error(
      `mode "${value}" inconnu — attendu : ${EXECUTION_MODES.join(" | ")}`
    );
  }
  return value;
}

function splitCommand(raw) {
  const parts = String(raw || "").trim().match(/"[^"]+"|\S+/g) || [];
  if (!parts.length) return null;
  return {
    cmd: parts[0].replace(/^"|"$/g, ""),
    args: parts.slice(1).map((arg) => arg.replace(/^"|"$/g, "")),
  };
}

export function executionCommand(mode = "local", env = process.env) {
  const selected = normalizeMode(mode);
  const raw =
    selected === "agents"
      ? env.RASTER_AGENTS_CMD
      : env.RASTER_LOCAL_CMD || env.RASTER_AGENT_CMD;
  const override = splitCommand(raw);
  if (override) return override;
  if (!env.CURSOR_API_KEY) return null;
  if (selected === "agents" && !env.RASTER_CLOUD_REPO) return null;
  return { cmd: process.execPath, args: [SDK_RUNNER, selected] };
}

export function availableModes(env = process.env) {
  return {
    local: executionCommand("local", env) !== null,
    agents: executionCommand("agents", env) !== null,
  };
}
