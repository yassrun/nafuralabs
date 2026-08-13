import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import {
  collectTaskFiles,
  listRasterProjects,
  projectFromPath,
} from "../../../../raster/walk-tasks.mjs";
import {
  expectedAgentType,
  inferWorkType,
  parseListField,
  resolveAgentType,
} from "../../../../raster/agent-type.mjs";

export type TaskDto = {
  id: string;
  status: string;
  priority: string;
  context: string;
  assignee: string;
  gate: string;
  kind: string;
  type: string;
  agent_type: string;
  sprint: string;
  parent: string;
  feature: string;
  blocked_by: string[];
  tags: string[];
  title: string;
  project: string;
  file: string;
};

function repoRootFromConfig(root: string) {
  // web/ -> raster/ -> products/ -> monorepo
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

function parseBlockedBy(raw: string | undefined): string[] {
  return parseListField(raw);
}

function loadTasks(repoRoot: string): TaskDto[] {
  const files = collectTaskFiles(repoRoot);
  const tasks: TaskDto[] = [];
  for (const file of files) {
    const fm = parseFrontmatter(fs.readFileSync(file, "utf8"));
    if (!fm?.id || fm.status === "done" || fm.status === "done-me") continue;
    const rel = path.relative(repoRoot, file).replace(/\\/g, "/");
    const project = projectFromPath(repoRoot, file);
    const type = inferWorkType(fm);
    const agent_type = resolveAgentType(type, fm.agent_type);
    tasks.push({
      id: fm.id,
      status: fm.status || "todo",
      priority: fm.priority || "P3",
      context: fm.context || "nafura",
      assignee: fm.assignee || "",
      gate: fm.gate || "",
      kind: fm.kind || "task",
      type,
      agent_type,
      sprint: fm.sprint || "",
      parent: fm.parent || "",
      feature: fm.feature || "",
      blocked_by: parseBlockedBy(fm.blocked_by),
      tags: parseListField(fm.tags),
      title: fm._title,
      project,
      file: rel,
    });
  }
  return tasks;
}

function listProjects(repoRoot: string): string[] {
  return listRasterProjects(repoRoot);
}

function parseInboxLines(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "))
    .map((l) => l.slice(2).trim())
    .filter(Boolean);
}

/** Global orchestrator inbox — not tied to a product. */
function readGlobalInbox(repoRoot: string): string[] {
  const file = path.join(repoRoot, "raster", "inbox.md");
  if (!fs.existsSync(file)) return [];
  return parseInboxLines(fs.readFileSync(file, "utf8"));
}

function writeGlobalInbox(repoRoot: string, lines: string[]) {
  const dir = path.join(repoRoot, "raster");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "inbox.md");
  const body = [
    "# INBOX",
    "",
    "<!-- Capture globale Raster — une ligne, @tag optionnel, pas d'ID. -->",
    "<!-- Promote → <projet>/raster-src/lots/<lot>/<sous-lot?>/tasks/ -->",
    "",
    ...lines.map((l) => `- ${l}`),
    "",
  ].join("\n");
  fs.writeFileSync(file, body, "utf8");
}

const PROJECT_PREFIX: Record<string, string> = {
  "sektor-btp": "ERP",
  sektor: "SEKTOR",
  raster: "RAS",
  personal: "PER",
  ops: "OPS",
  "mbs-website": "MBS",
  "nafuralabs-migration": "MIG",
  "nafura-platform": "PLT",
};

function projectPrefix(project: string) {
  return PROJECT_PREFIX[project] || project.slice(0, 3).toUpperCase();
}

function slugify(title: string) {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "task";
}

function journalStamp() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Max numeric id for prefix across all task files (incl. done / archive). */
function nextIdForPrefix(repoRoot: string, prefix: string): string {
  const files = collectTaskFiles(repoRoot, { includeArchive: true });
  let max = 0;
  const re = new RegExp(`^${prefix}-(\\d+)$`);
  for (const file of files) {
    const base = path.basename(file);
    const m = base.match(new RegExp(`^(${prefix})-(\\d+)-`));
    if (m) max = Math.max(max, Number(m[2]));
    const fm = parseFrontmatter(fs.readFileSync(file, "utf8"));
    if (fm?.id) {
      const idm = fm.id.match(re);
      if (idm) max = Math.max(max, Number(idm[1]));
    }
  }
  return `${prefix}-${String(max + 1).padStart(2, "0")}`;
}

function parseInboxTags(line: string): { title: string; tags: string[] } {
  const tags: string[] = [];
  const title = line
    .replace(/(?:^|\s)@([a-zA-Z0-9_-]+)/g, (_, t: string) => {
      tags.push(t);
      return "";
    })
    .replace(/\s+/g, " ")
    .trim();
  return { title: title || line.trim(), tags };
}

function promoteInboxLine(
  repoRoot: string,
  line: string,
  project: string,
  parentId: string
): { id: string; file: string; lines: string[]; tasks: TaskDto[] } {
  const projects = listProjects(repoRoot);
  if (!projects.includes(project)) {
    throw new Error(`unknown project: ${project}`);
  }
  if (!parentId?.trim()) {
    throw new Error("pas de parent — laisser en inbox (non promu)");
  }
  const inbox = readGlobalInbox(repoRoot);
  const idx = inbox.indexOf(line);
  if (idx < 0) throw new Error("line not in inbox");

  const { title, tags } = parseInboxTags(line);
  const asBug =
    tags.some((t) => t.toLowerCase() === "bug") || /^bug\b/i.test(title);
  const asSpec =
    tags.some((t) => t.toLowerCase() === "spec") || /^spec\b/i.test(title);
  const asPhysical =
    tags.some((t) => t.toLowerCase() === "physical") ||
    /^physical\b/i.test(title);
  const asQa =
    tags.some((t) => t.toLowerCase() === "qa") || /^qa\b/i.test(title);
  const workType = asPhysical
    ? "physical"
    : asBug
      ? "bug"
      : asSpec
        ? "spec"
        : asQa
          ? "qa"
          : "feature";
  const agentType = expectedAgentType(workType);

  const all = loadTasks(repoRoot);
  const parent = all.find(
    (t) => t.id === parentId && t.project === project
  );
  if (!parent) throw new Error(`parent ${parentId} introuvable dans ${project}`);
  const parentIsSousLot =
    parent.kind === "sous-lot" || parent.kind === "feature";
  const parentIsLot = parent.kind === "lot";
  if (!parentIsSousLot && !parentIsLot) {
    throw new Error("promote → lot (sans sous-lots) ou sous-lot (sinon inbox)");
  }
  if (parentIsLot) {
    const hasSousLots = all.some(
      (t) =>
        t.parent === parent.id &&
        (t.kind === "sous-lot" || t.kind === "feature")
    );
    if (hasSousLots) {
      throw new Error(
        "ce lot a déjà des sous-lots — rattacher à un sous-lot, pas au lot"
      );
    }
  }

  const prefix = projectPrefix(project);
  const id = nextIdForPrefix(repoRoot, prefix);
  const slug = slugify(title);
  const dir = path.dirname(path.join(repoRoot, parent.file));
  fs.mkdirSync(dir, { recursive: true });
  const rel = path
    .relative(repoRoot, path.join(dir, `${id}-${slug}.md`))
    .replace(/\\/g, "/");
  const abs = path.join(repoRoot, rel);
  if (fs.existsSync(abs)) throw new Error(`file exists: ${rel}`);

  const nested = parent.file.match(/lots\/[^/]+\/([^/]+)\/tasks\//);
  const legacy = parent.file.match(/(?:epics|features)\/([^/]+)\/tasks\//);
  const fromPath = nested?.[1] || (legacy && legacy[1] !== "_backlog" ? legacy[1] : "") || "";
  const featureSlug = parent.feature || fromPath;
  const kind = "task";
  const featureLine = featureSlug ? `feature: ${featureSlug}\n` : "";
  const tagLine = tags.length > 0 ? `tags: [${tags.join(", ")}]\n` : "";
  const body = `---
id: ${id}
status: todo
context: nafura
kind: ${kind}
type: ${workType}
agent_type: ${agentType}
priority: P2
assignee: me
gate: none
parent: ${parent.id}
${featureLine}${tagLine}---

# ${title}

> Promu depuis inbox Raster.

## Critères d'acceptation
- [ ] …

## Journal
\`\`\`
${journalStamp()}  balayage · promu depuis inbox → ${parent.id}
\`\`\`
`;
  fs.writeFileSync(abs, body, "utf8");

  const remaining = inbox.filter((_, i) => i !== idx);
  writeGlobalInbox(repoRoot, remaining);

  return {
    id,
    file: rel,
    lines: remaining,
    tasks: loadTasks(repoRoot),
  };
}

function isoWeekId(d = new Date()) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${week}`;
}

function setFrontmatterField(raw: string, key: string, value: string | null) {
  if (!raw.startsWith("---")) return raw;
  const end = raw.indexOf("\n---", 4);
  if (end < 0) return raw;
  const block = raw.slice(4, end).replace(/\r/g, "");
  const rest = raw.slice(end + 4);
  const lines = block.split("\n");
  let found = false;
  const next = lines.map((line) => {
    const m = line.match(/^([a-z_]+):\s*(.*)$/);
    if (!m || m[1] !== key) return line;
    found = true;
    if (value === null) return null;
    return `${key}: ${value}`;
  }).filter((l): l is string => l !== null);
  if (!found && value !== null) next.push(`${key}: ${value}`);
  return `---\n${next.join("\n")}\n---${rest}`;
}

function findTaskFile(repoRoot: string, id: string): string | null {
  const tasks = loadTasks(repoRoot);
  const t = tasks.find((x) => x.id === id);
  return t ? path.join(repoRoot, t.file) : null;
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
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";
        if (!url.startsWith("/api/")) return next();

        try {
          if (req.method === "GET" && url === "/api/meta") {
            return send(res, 200, {
              sprint: isoWeekId(),
              projects: listProjects(root),
              repoRoot: root,
            });
          }

          if (req.method === "GET" && url === "/api/tasks") {
            return send(res, 200, { tasks: loadTasks(root) });
          }

          if (req.method === "GET" && url === "/api/inbox") {
            return send(res, 200, { lines: readGlobalInbox(root) });
          }

          if (req.method === "POST" && url === "/api/inbox") {
            const body = (await readJson(req)) as { line?: string };
            if (!body.line?.trim()) {
              return send(res, 400, { error: "line required" });
            }
            const lines = [body.line.trim(), ...readGlobalInbox(root)];
            writeGlobalInbox(root, lines);
            return send(res, 200, { lines: readGlobalInbox(root) });
          }

          if (req.method === "POST" && url === "/api/inbox/promote") {
            const body = (await readJson(req)) as {
              line?: string;
              project?: string;
              parent?: string;
            };
            if (!body.line?.trim() || !body.project?.trim()) {
              return send(res, 400, { error: "line + project required" });
            }
            if (!body.parent?.trim()) {
              return send(res, 400, {
                error: "sans sous-lot → rester inbox, non promu",
              });
            }
            const result = promoteInboxLine(
              root,
              body.line.trim(),
              body.project.trim(),
              body.parent.trim()
            );
            return send(res, 200, result);
          }

          const patch = url.match(/^\/api\/tasks\/([^/]+)$/);
          if (req.method === "PATCH" && patch) {
            const id = decodeURIComponent(patch[1]);
            const file = findTaskFile(root, id);
            if (!file) return send(res, 404, { error: "not found" });
            const body = (await readJson(req)) as {
              status?: string;
              sprint?: string | null;
            };
            let raw = fs.readFileSync(file, "utf8");
            if (body.status) raw = setFrontmatterField(raw, "status", body.status);
            if (body.sprint !== undefined) {
              raw = setFrontmatterField(
                raw,
                "sprint",
                body.sprint === null || body.sprint === "" ? null : body.sprint
              );
            }
            // append journal
            const note = `${String(new Date().getDate()).padStart(2, "0")}/${String(new Date().getMonth() + 1).padStart(2, "0")} ${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}  raster-web · ${body.status ? `status→${body.status}` : ""}${body.sprint ? ` sprint→${body.sprint}` : body.sprint === null ? " sprint cleared" : ""}`.trim();
            if (raw.includes("## Journal\n```")) {
              raw = raw.replace(
                /## Journal\n```\n/,
                `## Journal\n\`\`\`\n${note}\n`
              );
            }
            fs.writeFileSync(file, raw, "utf8");
            return send(res, 200, { ok: true, tasks: loadTasks(root) });
          }

          if (req.method === "DELETE" && patch) {
            const id = decodeURIComponent(patch[1]);
            const tasks = loadTasks(root);
            const target = tasks.find((t) => t.id === id);
            if (!target) return send(res, 404, { error: "not found" });
            const hat =
              target.kind === "lot" ||
              target.kind === "sous-lot" ||
              target.kind === "feature";
            const childIds = new Set(
              hat
                ? tasks.filter((t) => t.parent === id).map((t) => t.id)
                : []
            );
            const toDelete = tasks.filter(
              (t) =>
                t.id === id ||
                childIds.has(t.id) ||
                (target.kind === "lot" && childIds.has(t.parent))
            );
            for (const t of toDelete) {
              const f = path.join(root, t.file);
              if (fs.existsSync(f)) fs.unlinkSync(f);
            }
            return send(res, 200, { ok: true, tasks: loadTasks(root) });
          }

          const commit = url.match(/^\/api\/tasks\/([^/]+)\/commit-sprint$/);
          if (req.method === "POST" && commit) {
            const id = decodeURIComponent(commit[1]);
            const sprint = isoWeekId();
            const tasks = loadTasks(root);
            const target = tasks.find((t) => t.id === id);
            if (!target) return send(res, 404, { error: "not found" });
            if (
              target.kind === "lot" ||
              target.kind === "sous-lot" ||
              target.kind === "feature" ||
              target.kind === "spec" ||
              target.kind === "bug-umbrella"
            ) {
              return send(res, 400, {
                error: "seules les tasks sont sprintables (spec / feature / bug / physical / qa)",
              });
            }
            const ids = new Set<string>([id]);
            for (const tid of ids) {
              const file = findTaskFile(root, tid);
              if (!file) continue;
              let raw = fs.readFileSync(file, "utf8");
              raw = setFrontmatterField(raw, "sprint", sprint);
              const note = `${String(new Date().getDate()).padStart(2, "0")}/${String(new Date().getMonth() + 1).padStart(2, "0")} ${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}  raster-web · commit sprint ${sprint}`;
              if (raw.includes("## Journal\n```")) {
                raw = raw.replace(
                  /## Journal\n```\n/,
                  `## Journal\n\`\`\`\n${note}\n`
                );
              }
              fs.writeFileSync(file, raw, "utf8");
            }
            return send(res, 200, { ok: true, sprint, tasks: loadTasks(root) });
          }

          return send(res, 404, { error: "unknown api route" });
        } catch (e) {
          console.error(e);
          return send(res, 500, {
            error: e instanceof Error ? e.message : "server error",
          });
        }
      });
    },
  };
}
