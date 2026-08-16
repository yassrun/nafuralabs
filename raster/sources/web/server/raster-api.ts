/**
 * API locale de Raster — lecture des fichiers, écriture DÉLÉGUÉE au CLI.
 *
 * Le serveur n'écrit plus aucune task lui-même (`AGENTS.md` §0.1-9). Il appelait
 * `fs.writeFileSync` en trois endroits et réimplémentait l'allocation d'id : deux
 * chemins d'écriture pour une règle qui en veut un. Tout passe désormais par
 * `raster/write.mjs`, le même que la ligne de commande.
 *
 * Seule exception : la capture d'inbox, qui n'est pas une task.
 */
import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import {
  collectTaskFiles,
  listRasterProjects,
  treeFromPath,
} from "../../../walk-tasks.mjs";
import {
  inferWorkType,
  parseListField,
  resolveAgentType,
} from "../../../agent-type.mjs";
import {
  createTask,
  promoteLine,
  setStatus,
  setSprint,
  approve,
  RefusError,
} from "../../../write.mjs";
import { readiness } from "../../../ready.mjs";
import { window_ } from "../../../roadmap.mjs";
import {
  agentCommand,
  list as runningLots,
  recent as recentLots,
  start as startLot,
  stop as stopLot,
  SpawnError,
} from "../../../spawn.mjs";
import { WorktreeError } from "../../../worktree.mjs";
import { regen, isoWeekInfo } from "../../../regen.mjs";

export type TaskDto = {
  id: string;
  status: string;
  priority: string;
  context: string;
  assignee: string;
  gate: string;
  type: string;
  agent_type: string;
  sprint: string;
  lot: string;
  souslot: string;
  blocked_by: string[];
  tags: string[];
  title: string;
  project: string;
  file: string;
  /** Sections du corps — l'app les jetait, alors qu'elles portent l'essentiel. */
  question: string;
  rapport: string;
  /** Dérivé : cette task attend une décision de l'humain. */
  attend: boolean;
};

export type ReadyDto = {
  key: string;
  project: string;
  lot: string;
  souslot: string;
  ouvert: boolean;
  lancable: boolean;
  raisons: string[];
  restant: number;
  gates: string[];
};

function repoRootFromConfig(root: string) {
  // sources/web/ -> raster/ -> monorepo
  return path.resolve(root, "../../..");
}

function parseFrontmatter(raw: string) {
  if (!raw.startsWith("---\n") && !raw.startsWith("---\r\n")) return null;
  const end = raw.indexOf("\n---", 4);
  if (end < 0) return null;
  const block = raw.slice(4, end).replace(/\r/g, "");
  const body = raw.slice(end + 4).replace(/^\r?\n/, "");
  const fm: Record<string, string> = {};
  for (const line of block.split("\n")) {
    const m = line.match(/^([a-z_]+):\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    fm[m[1]] = v;
  }
  const h1 = body.match(/^#\s+(.+)$/m);
  fm._title = h1 ? h1[1].trim() : fm.id || "untitled";
  fm._body = body;
  return fm;
}

/** Découpe le corps sur les `## `. Une section absente rend "". */
function section(body: string, name: string): string {
  const lines = (body || "").split(/\r?\n/);
  const out: string[] = [];
  let inside = false;
  for (const l of lines) {
    const h = l.match(/^##\s+(.+?)\s*$/);
    if (h) {
      inside = h[1].toLowerCase().startsWith(name.toLowerCase());
      continue;
    }
    if (inside) out.push(l);
  }
  return out.join("\n").trim();
}

function loadTasks(repoRoot: string): TaskDto[] {
  const tasks: TaskDto[] = [];
  for (const file of collectTaskFiles(repoRoot)) {
    const fm = parseFrontmatter(fs.readFileSync(file, "utf8"));
    if (!fm?.id || fm.status === "done" || fm.status === "done-me") continue;
    const rel = path.relative(repoRoot, file).replace(/\\/g, "/");
    const { project, lot, souslot } = treeFromPath(repoRoot, file);
    const type = inferWorkType(fm);
    const agent_type = resolveAgentType(type, fm.agent_type);
    const status = fm.status || "todo";
    const gate = fm.gate || "none";
    tasks.push({
      id: fm.id,
      status,
      priority: fm.priority || "P3",
      context: fm.context || "nafura",
      assignee: fm.assignee || "",
      gate,
      type,
      agent_type,
      sprint: fm.sprint || "",
      lot,
      souslot,
      blocked_by: parseListField(fm.blocked_by),
      tags: parseListField(fm.tags),
      title: fm._title,
      project,
      file: rel,
      question: section(fm._body, "Question"),
      rapport: section(fm._body, "Rapport"),
      // Trois façons de te rendre la main (`AGENTS.md` §0.1-2).
      attend:
        (status === "done-agent" && gate === "me") ||
        status === "blocked" ||
        (gate === "me" && section(fm._body, "Question") !== ""),
    });
  }
  return tasks;
}

function parseInboxLines(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "))
    .map((l) => l.slice(2).trim())
    .filter(Boolean);
}

function readGlobalInbox(repoRoot: string): string[] {
  const file = path.join(repoRoot, "raster", "inbox.md");
  if (!fs.existsSync(file)) return [];
  return parseInboxLines(fs.readFileSync(file, "utf8"));
}

/** La capture n'est pas une task : c'est la seule écriture qui reste ici. */
function writeGlobalInbox(repoRoot: string, lines: string[]) {
  const dir = path.join(repoRoot, "raster");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, "inbox.md"),
    [
      "# INBOX",
      "",
      "<!-- Capture globale Raster — une ligne, @tag optionnel, pas d'ID. -->",
      "<!-- Promote → <projet>/raster-src/lots/<lot>/<sous-lot?>/tasks/ -->",
      "",
      ...lines.map((l) => `- ${l}`),
      "",
    ].join("\n"),
    "utf8"
  );
}

function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function send(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

export function rasterApiPlugin(repoRoot?: string): Plugin {
  return {
    name: "raster-local-api",
    configureServer(server) {
      const root = repoRoot || repoRootFromConfig(server.config.root);

      /** Après toute mutation : regen, puis on rend l'état complet. */
      const after = (res: ServerResponse, extra: Record<string, unknown> = {}) => {
        regen();
        return send(res, 200, {
          ok: true,
          tasks: loadTasks(root),
          ready: readiness(),
          lines: readGlobalInbox(root),
          ...extra,
        });
      };

      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";
        if (!url.startsWith("/api/")) return next();

        try {
          if (req.method === "GET" && url === "/api/meta") {
            return send(res, 200, {
              sprint: isoWeekInfo().id,
              projects: listRasterProjects(root),
              repoRoot: root,
            });
          }

          if (req.method === "GET" && url === "/api/tasks") {
            return send(res, 200, { tasks: loadTasks(root) });
          }

          if (req.method === "GET" && url === "/api/ready") {
            return send(res, 200, { ready: readiness() });
          }

          if (req.method === "GET" && url.startsWith("/api/window")) {
            const p = new URL(url, "http://x").searchParams.get("projet") || "";
            const projets = p ? [p] : listRasterProjects(root);
            return send(res, 200, { windows: projets.map((x) => window_(x)) });
          }

          /**
           * L'état d'exécution vit dans CE processus (AC-4). Le serveur est le
           * seul à vivre assez longtemps pour le tenir — d'où `spawnPret`, qui
           * dit à l'UI si le bouton « Lancer » a une chance de marcher.
           */
          if (req.method === "GET" && url === "/api/running") {
            return send(res, 200, {
              running: runningLots(),
              recent: recentLots(),
              spawnPret: agentCommand() !== null,
            });
          }

          if (req.method === "POST" && url === "/api/run") {
            const b = (await readJson(req)) as {
              project?: string;
              lot?: string;
              souslot?: string;
            };
            const r = startLot({
              project: b.project || "",
              lot: b.lot || "",
              souslot: b.souslot || "",
            });
            return send(res, 200, { ok: true, lance: r, running: runningLots() });
          }

          if (req.method === "POST" && url === "/api/stop") {
            const b = (await readJson(req)) as { project?: string; lot?: string };
            stopLot(b.project || "", b.lot || "");
            return send(res, 200, { ok: true, running: runningLots() });
          }

          if (req.method === "GET" && url === "/api/inbox") {
            return send(res, 200, { lines: readGlobalInbox(root) });
          }

          if (req.method === "POST" && url === "/api/inbox") {
            const body = (await readJson(req)) as { line?: string };
            if (!body.line?.trim()) return send(res, 400, { error: "line required" });
            writeGlobalInbox(root, [body.line.trim(), ...readGlobalInbox(root)]);
            return send(res, 200, { lines: readGlobalInbox(root) });
          }

          if (req.method === "POST" && url === "/api/inbox/promote") {
            const b = (await readJson(req)) as {
              line?: string;
              project?: string;
              target?: string;
            };
            if (!b.line?.trim() || !b.project?.trim()) {
              return send(res, 400, { error: "line + project required" });
            }
            if (!b.target?.trim()) {
              return send(res, 400, { error: "sans lot cible → rester inbox, non promu" });
            }
            const r = promoteLine(b.line.trim(), b.project.trim(), b.target.trim());
            return after(res, { id: r.id, file: r.file });
          }

          if (req.method === "POST" && url === "/api/tasks") {
            const b = (await readJson(req)) as Record<string, unknown>;
            const r = createTask(b as never);
            return after(res, { id: r.id, file: r.file });
          }

          const one = url.match(/^\/api\/tasks\/([^/?]+)$/);
          if (req.method === "PATCH" && one) {
            const id = decodeURIComponent(one[1]);
            const b = (await readJson(req)) as { status?: string; sprint?: string };
            const out: Record<string, unknown> = {};
            if (b.status) out.status = setStatus(id, b.status).status;
            if (b.sprint !== undefined) out.sprint = setSprint(id, b.sprint).sprint;
            return after(res, out);
          }

          if (req.method === "DELETE" && one) {
            const id = decodeURIComponent(one[1]);
            const t = loadTasks(root).find((x) => x.id === id);
            if (!t) return send(res, 404, { error: "not found" });
            // Abandon = delete. Les chapeaux sont des dossiers : jamais d'enfants.
            fs.unlinkSync(path.join(root, t.file));
            return after(res);
          }

          const sub = url.match(/^\/api\/tasks\/([^/?]+)\/(commit-sprint|approve)$/);
          if (req.method === "POST" && sub) {
            const id = decodeURIComponent(sub[1]);
            if (sub[2] === "approve") {
              const r = approve(id);
              return after(res, { status: r.status });
            }
            const r = setSprint(id);
            return after(res, { sprint: r.sprint });
          }

          return send(res, 404, { error: "unknown api route" });
        } catch (e) {
          // Un refus est une erreur de l'appelant, pas une panne serveur.
          if (
            e instanceof RefusError ||
            e instanceof SpawnError ||
            e instanceof WorktreeError
          ) {
            return send(res, 400, { error: e.message });
          }
          console.error(e);
          return send(res, 500, {
            error: e instanceof Error ? e.message : "server error",
          });
        }
      });
    },
  };
}
