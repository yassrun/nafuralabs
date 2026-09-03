export type Task = {
  id: string;
  status: string;
  priority: string;
  context: string;
  assignee: string;
  type: string;
  agent_type: string;
  /** Chapeaux derives du CHEMIN — lot et sous-lot sont des dossiers, pas des tickets. */
  lot: string;
  souslot: string;
  blocked_by: string[];
  tags: string[];
  title: string;
  project: string;
  file: string;
  rapport: string;
};

/** Verdict par sous-lot — calcule par `t.mjs ready`, jamais stocke. */
export type Ready = {
  key: string;
  project: string;
  lot: string;
  souslot: string;
  ouvert: boolean;
  lancable: boolean;
  raisons: string[];
  restant: number;
};

/** Un lot tenu par un orchestrateur. L'etat vit dans le serveur, jamais sur disque. */
export type Lance = {
  project: string;
  lot: string;
  souslot: string;
  mode: ExecutionMode;
  branch: string;
  cwd: string;
  pid: number;
  depuis: string;
  etat: string;
  code: number | null;
  sortie: string[];
};

export type ViewId =
  | "session"
  | "ready"
  | "captures";

export type WindowLot = {
  lot: string;
  existe: boolean;
  lancables: Ready[];
  bloques: Ready[];
};

export type ProjectWindow = {
  project: string;
  fichier: string | null;
  borne: boolean;
  fenetre: string[];
  fermes: string[];
  note: string;
  lots: WindowLot[];
};

const glyph: Record<string, string> = {
  todo: "·",
  doing: "▸",
  blocked: "✕",
  done: "✓",
};

export function statusGlyph(s: string) {
  return glyph[s] || "·";
}

export type ExecutionMode = "local" | "agents";

export function taskAgentType(t: {
  type?: string;
  agent_type?: string;
  status?: string;
}): "spec" | "exec" {
  const a = (t.agent_type || "").toLowerCase();
  if (a === "spec" || a === "exec") return a;
  const ty = (t.type || "").toLowerCase();
  if (ty === "spec") return "spec";
  return "exec";
}

/** Les agents reels vivent dans `.claude/agents/`. Plus de `nafura-*` fantomes. */
export function agentFile(agent: string) {
  return `.claude/agents/${agent}.md`;
}

export function launchBrief(t: Task) {
  const agent = taskAgentType(t);
  const blocked = (t.blocked_by || []).join(", ") || "—";
  return [
    `# Raster — lancer un agent ${agent}`,
    `agent: @${agent}   (${agentFile(agent)})`,
    `id: ${t.id}`,
    `type: ${t.type || "—"}`,
    `file: ${t.file}`,
    `blocked_by: ${blocked}`,
    `status: ${t.status}`,
    "",
    "PÉRIMÈTRE = ce que tes étapes nomment. Autre chose → une ligne d'inbox, pas un détour.",
    "Statuts par commande : node raster/t.mjs status <id> <statut>.",
  ].join("\n");
}

export function orchLaunchBrief(
  group: { project: string; lot: string; souslot: string },
  kids: Task[],
  mode: ExecutionMode = "local"
) {
  const lines =
    kids.length > 0
      ? kids.map((k) => `- ${k.id}  type:${k.type || "—"}  ${k.status}  ${k.title}`)
      : ["- (aucune task)"];
  const where = [group.lot, group.souslot].filter(Boolean).join("/");
  return [
    `# Raster — orchestrer un sous-lot`,
    `skill: /orchestration   (.claude/skills/orchestration/SKILL.md)`,
    `projet: ${group.project}`,
    `sous-lot: ${where}`,
    `mode: ${mode}`,
    `plan: ${group.project}/raster-src/lots/${group.lot}/${group.souslot}/00-PLAN.md`,
    "",
    "Tasks du sous-lot :",
    ...lines,
    "",
    "Pipeline: Spec → Code → Done. Aucune QA dédiée, aucune gate humaine.",
    mode === "agents"
      ? "Les Tasks Code indépendantes peuvent être parallélisées par le harness."
      : "Mode local: une seule Task Code à la fois dans le worktree.",
  ].join("\n");
}

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || res.statusText);
  }
  return res.json() as Promise<T>;
}

/** Toute mutation renvoie l'etat complet — le serveur regen avant de repondre. */
type Mutation = { tasks: Task[]; ready: Ready[]; lines: string[] };

export const api = {
  meta: () => json<{ projects: string[] }>("/api/meta"),
  tasks: () => json<{ tasks: Task[] }>("/api/tasks"),
  ready: () => json<{ ready: Ready[] }>("/api/ready"),
  windows: (project = "") =>
    json<{ windows: ProjectWindow[] }>(
      `/api/window${project ? `?projet=${encodeURIComponent(project)}` : ""}`
    ),
  inbox: () => json<{ lines: string[] }>("/api/inbox"),
  capture: (line: string, project = "") =>
    json<{ lines: string[] }>("/api/inbox", {
      method: "POST",
      body: JSON.stringify({ line, project }),
    }),
  updateInbox: (oldLine: string, newLine: string) =>
    json<{ lines: string[] }>('/api/inbox/update', {
      method: 'POST',
      body: JSON.stringify({ oldLine, newLine }),
    }),
  deleteInbox: (line: string) =>
    json<{ lines: string[] }>('/api/inbox/delete', {
      method: 'POST',
      body: JSON.stringify({ line }),
    }),
  /** target = "<lot>" ou "<lot>/<sous-lot>" — un dossier. */
  promote: (line: string, project: string, target: string) =>
    json<Mutation & { id: string; file: string }>("/api/inbox/promote", {
      method: "POST",
      body: JSON.stringify({ line, project, target }),
    }),
  patchTask: (id: string, body: { status?: string }) =>
    json<Mutation>(`/api/tasks/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteTask: (id: string) =>
    json<Mutation>(`/api/tasks/${encodeURIComponent(id)}`, { method: "DELETE" }),
  running: () =>
    json<{ running: Lance[]; recent: Lance[]; modes: Record<ExecutionMode, boolean> }>("/api/running"),
  run: (project: string, lot: string, souslot = "", mode: ExecutionMode = "local") =>
    json<{ lance: Lance; running: Lance[] }>("/api/run", {
      method: "POST",
      body: JSON.stringify({ project, lot, souslot, mode }),
    }),
  stopRun: (project: string, lot: string, souslot = "") =>
    json<{ running: Lance[] }>("/api/stop", {
      method: "POST",
      body: JSON.stringify({ project, lot, souslot }),
    }),
};
