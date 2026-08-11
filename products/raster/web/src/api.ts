export type Task = {
  id: string;
  status: string;
  priority: string;
  context: string;
  assignee: string;
  gate: string;
  kind: string;
  sprint: string;
  parent: string;
  feature: string;
  blocked_by: string[];
  tags: string[];
  title: string;
  project: string;
  file: string;
};

export type ViewId = "inbox" | "backlog" | "sprint";

const glyph: Record<string, string> = {
  todo: "·",
  doing: "▸",
  blocked: "✕",
  review: "◐",
  done: "✓",
};

export function statusGlyph(s: string) {
  return glyph[s] || "·";
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
  promote: (line: string, project: string) =>
    json<{ id: string; file: string; lines: string[]; tasks: Task[] }>(
      "/api/inbox/promote",
      {
        method: "POST",
        body: JSON.stringify({ line, project }),
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
