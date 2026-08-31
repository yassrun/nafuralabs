export type Task = {
  id: string;
  status: string;
  priority: string;
  context: string;
  assignee: string;
  gate: string;
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
  /** Sections du corps du .md — l'app les jetait. */
  question: string;
  rapport: string;
  /** Derive : cette task te rend la main. */
  attend: boolean;
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
  gates: string[];
};

/** Un lot tenu par un orchestrateur. L'etat vit dans le serveur, jamais sur disque. */
export type Lance = {
  project: string;
  lot: string;
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
  | "plan"
  | "sublot"
  | "captures"
  | "deliveries";

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
  review: "◐",
  "done-agent": "✓",
  "done-me": "✓",
  done: "✓",
};

export function statusGlyph(s: string) {
  return glyph[s] || "·";
}

export type AgentFilter = "all" | "spec" | "exec" | "qa";

export function taskAgentType(t: {
  type?: string;
  agent_type?: string;
  status?: string;
}): "spec" | "exec" | "qa" {
  // `agent_type` décrit l'auteur attendu de la tâche, mais après livraison
  // d'une feature/bug le prochain acteur est toujours QA.
  if (t.status === "review") return "qa";
  const a = (t.agent_type || "").toLowerCase();
  if (a === "spec" || a === "exec" || a === "qa") return a;
  const ty = (t.type || "").toLowerCase();
  if (ty === "spec") return "spec";
  if (ty === "qa") return "qa";
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
  kids: Task[]
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
    `plan: ${group.project}/raster-src/lots/${group.lot}/${group.souslot}/00-PLAN.md`,
    "",
    "Tasks du sous-lot :",
    ...lines,
    "",
    "Un seul sous-lot. Tasks en série. Ne pas coder, ne pas poser done-me.",
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
  capture: (line: string) =>
    json<{ lines: string[] }>("/api/inbox", {
      method: "POST",
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
    json<{ running: Lance[]; recent: Lance[]; spawnPret: boolean }>("/api/running"),
  /** Lance un orchestrateur sur un lot. Refuse sans RASTER_AGENT_CMD. */
  run: (project: string, lot: string, souslot = "") =>
    json<{ lance: Lance; running: Lance[] }>("/api/run", {
      method: "POST",
      body: JSON.stringify({ project, lot, souslot }),
    }),
  stopRun: (project: string, lot: string) =>
    json<{ running: Lance[] }>("/api/stop", {
      method: "POST",
      body: JSON.stringify({ project, lot }),
    }),
  /** Le seul chemin vers `done-me` — jamais un select. */
  approve: (id: string) =>
    json<Mutation>(`/api/tasks/${encodeURIComponent(id)}/approve`, {
      method: "POST",
      body: "{}",
    }),
};

/** Ce qu'on te demande, en une ligne, pour la file d'attente. */
export function demande(t: Task): string {
  if (t.status === "blocked") return "Bloqué dehors — débloquer";
  if (t.status === "done-agent" && t.gate === "me") return "Approuver";
  if (t.question) return "Trancher";
  return "Regarder";
}
