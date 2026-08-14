export type Task = {
  id: string;
  status: string;
  priority: string;
  context: string;
  assignee: string;
  gate: string;
  type: string;
  agent_type: string;
  sprint: string;
  /** Chapeaux derives du CHEMIN — lot et sous-lot sont des dossiers, pas des tickets. */
  lot: string;
  souslot: string;
  blocked_by: string[];
  tags: string[];
  title: string;
  project: string;
  file: string;
};

export type ViewId = "inbox" | "backlog" | "sprint" | "done-agent";

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
}): "spec" | "exec" | "qa" {
  const a = (t.agent_type || "").toLowerCase();
  if (a === "spec" || a === "exec" || a === "qa") return a;
  const ty = (t.type || "").toLowerCase();
  if (ty === "spec") return "spec";
  if (ty === "qa") return "qa";
  return "exec";
}

export function skillForAgentType(agent: string) {
  if (agent === "spec") return "nafura-spec";
  if (agent === "qa") return "nafura-qa";
  if (agent === "orch") return "nafura-orch";
  return "nafura-exec";
}

export function launchBrief(t: Task) {
  const agent = taskAgentType(t);
  const skill = skillForAgentType(agent);
  const blocked = (t.blocked_by || []).join(", ") || "—";
  return [
    `# Raster — lancer agent ${agent}`,
    `skill: @${skill}`,
    `id: ${t.id}`,
    `type: ${t.type || "—"}`,
    `agent_type: ${agent}`,
    `file: ${t.file}`,
    `blocked_by: ${blocked}`,
    `status: ${t.status}`,
    "",
    "PÉRIMÈTRE = ce que tes étapes nomment. Autre chose → une ligne d'inbox, pas un détour.",
    "",
    "Coller ce brief dans Cursor et suivre le skill. Pas de spawn SDK.",
  ].join("\n");
}

export function orchLaunchBrief(
  group: { project: string; lot: string; souslot: string },
  kids: Task[]
) {
  const lines =
    kids.length > 0
      ? kids.map(
          (k) => `- ${k.id}  type:${k.type || "—"}  ${k.status}  ${k.title}`
        )
      : ["- (aucune task)"];
  const where = [group.lot, group.souslot].filter(Boolean).join("/");
  return [
    `# Raster — orchestrer le sous-lot`,
    `skill: @nafura-orch`,
    `agent_type: orch`,
    `projet: ${group.project}`,
    `sous-lot: ${where}`,
    `pact: ${group.project}/pact/${group.lot}/${group.souslot}/CH.md`,
    "",
    "Tasks du Change :",
    ...lines,
    "",
    "Cycle : spec → exec → spec (constat d'écart) → qa → done-agent.",
    "Uniquement ce sous-lot. Ne pas coder. Ne pas poser done-agent sur feature/bug.",
    "Coller ce brief dans Cursor. Pas de spawn SDK.",
  ].join("\n");
}

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || res.statusText);
  }
  return res.json() as Promise<T>;
}

export const api = {
  meta: () =>
    json<{ sprint: string; projects: string[] }>("/api/meta"),
  tasks: () => json<{ tasks: Task[] }>("/api/tasks"),
  inbox: () => json<{ lines: string[] }>("/api/inbox"),
  capture: (line: string) =>
    json<{ lines: string[] }>("/api/inbox", {
      method: "POST",
      body: JSON.stringify({ line }),
    }),
  /** target = "<lot>" ou "<lot>/<sous-lot>" — un dossier. */
  promote: (line: string, project: string, target: string) =>
    json<{ id: string; file: string; lines: string[]; tasks: Task[] }>(
      "/api/inbox/promote",
      {
        method: "POST",
        body: JSON.stringify({ line, project, target }),
      }
    ),
  patchTask: (id: string, body: { status?: string; sprint?: string | null }) =>
    json<{ tasks: Task[] }>(`/api/tasks/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteTask: (id: string) =>
    json<{ tasks: Task[] }>(`/api/tasks/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  commitSprint: (id: string) =>
    json<{ tasks: Task[]; sprint: string }>(
      `/api/tasks/${encodeURIComponent(id)}/commit-sprint`,
      { method: "POST", body: "{}" }
    ),
};
