import { useCallback, useEffect, useMemo, useState } from "react";
import {
  api,
  orchLaunchBrief,
  taskAgentType,
  type Lance,
  type ExecutionMode,
  type Ready,
  type Task,
  type ViewId,
} from "./api";

type Group = { key: string; project: string; lot: string; souslot: string; tasks: Task[] };

const NAV: Array<{ id: ViewId; label: string; icon: string }> = [
  { id: "captures", label: "Captures", icon: "▣" },
  { id: "session", label: "Session", icon: "⌁" },
  { id: "ready", label: "Ready", icon: "▸" },
];

const STATUS_LABEL: Record<string, string> = {
  todo: "À faire", doing: "En cours", blocked: "Bloqué dehors",
  done: "Terminé",
};

export default function App() {
  const [view, setView] = useState<ViewId>("session");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ready, setReady] = useState<Ready[]>([]);
  const [windows, setWindows] = useState<Awaited<ReturnType<typeof api.windows>>["windows"]>([]);
  const [projects, setProjects] = useState<string[]>([]);
  const [running, setRunning] = useState<Lance[]>([]);
  const [modes, setModes] = useState<Record<ExecutionMode, boolean>>({ local: false, agents: false });
  const [executionMode, setExecutionMode] = useState<ExecutionMode>("local");
  const [sessionKeys, setSessionKeys] = useState<string[]>([]);
  const [inboxLines, setInboxLines] = useState<string[]>([]);
  const [project, setProject] = useState("");
  const [captureProject, setCaptureProject] = useState("");
  const [selectedKey, setSelectedKey] = useState("");
  const [captureOpen, setCaptureOpen] = useState(false);
  const [captureFilter, setCaptureFilter] = useState<string>("all");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const [meta, taskData, readyData, windowData, runData, inboxData, sessionData] = await Promise.all([
      api.meta(), api.tasks(), api.ready(), api.windows(), api.running(), api.inbox(), api.session(),
    ]);
    setProjects(meta.projects);
    setTasks(taskData.tasks);
    setReady(readyData.ready);
    setWindows(windowData.windows);
    setRunning(runData.running);
    setModes(runData.modes);
    setInboxLines(inboxData.lines);
    setSessionKeys(sessionData.keys);
    setProject((current) => {
      if (current && meta.projects.includes(current)) return current;
      return projetPorteur(meta.projects, taskData.tasks);
    });
  }, []);

  useEffect(() => {
    refresh().catch((e) => setError(e instanceof Error ? e.message : String(e))).finally(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    if (!running.length) return;
    const timer = window.setInterval(() => {
      api.running().then((r) => { setRunning(r.running); }).catch(() => undefined);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [running.length]);

  const groups = useMemo(() => groupTasks(tasks), [tasks]);
  const projectGroups = useMemo(() => groups.filter((group) => group.project === project), [groups, project]);
  const captureEntries = useMemo(
    () =>
      inboxLines.map((line) => ({
        line: line.trim(),
        project: resolveCaptureProject(line, project || projects[0] || "global", projects),
      })),
    [inboxLines, project, projects]
  );
  const visibleCaptureEntries = useMemo(
    () => (captureFilter === "all" ? captureEntries : captureEntries.filter((entry) => entry.project === captureFilter)),
    [captureEntries, captureFilter]
  );
  const projectWindow = windows.find((row) => row.project === project);
  const authorizedKeys = useMemo(
    () => new Set(projectWindow?.lots.flatMap((lot) => lot.lancables.map((row) => row.key)) || []),
    [projectWindow]
  );
  const runningKeys = useMemo(
    () => new Set(running.map((run) => `${run.project}//${run.lot}//${run.souslot}`)),
    [running]
  );
  const engagedKeys = useMemo(() => {
    const keys = new Set(sessionKeys);
    for (const key of runningKeys) keys.add(key);
    return keys;
  }, [sessionKeys, runningKeys]);
  const sessionGroups = projectGroups.filter((group) => engagedKeys.has(group.key));
  const projectReady = ready.filter((row) => row.project === project && row.ouvert);
  const readyNow = projectReady.filter(
    (row) => row.lancable && authorizedKeys.has(row.key) && !engagedKeys.has(row.key)
  );
  const selectedGroup = projectGroups.find((group) => group.key === selectedKey) || sessionGroups[0] || projectGroups[0] || null;
  useEffect(() => {
    if (selectedGroup && selectedGroup.key !== selectedKey) setSelectedKey(selectedGroup.key);
  }, [selectedGroup, selectedKey]);

  useEffect(() => {
    if (captureFilter !== "all" && !projects.includes(captureFilter)) {
      setCaptureFilter("all");
    }
  }, [captureFilter, projects]);

  useEffect(() => {
    if (!projects.length) return;
    if (captureProject && projects.includes(captureProject)) return;
    setCaptureProject(projects.includes(project) ? project : projects[0]);
  }, [captureProject, project, projects]);

  const mutate = async (action: () => Promise<unknown>) => {
    setBusy(true); setError("");
    try { await action(); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  const capture = () => {
    const line = draft.trim();
    if (!line) return;
    const targetProject = captureProject || project || projects[0] || "";
    void mutate(async () => { await api.capture(line, targetProject); setDraft(""); setCaptureOpen(false); });
  };

  const updateCapture = (oldLine: string, newLine: string) => {
    const cleaned = newLine.trim();
    if (!cleaned) return;
    void mutate(async () => { await api.updateInbox(oldLine, cleaned); });
  };

  const deleteCapture = (line: string) => {
    void mutate(async () => { await api.deleteInbox(line); });
  };

  if (loading) return <div className="rf-loading">Chargement de Raster…</div>;

  return <div className="rf-app">
    <header className="rf-topbar">
      <div className="rf-brand"><span>R</span><strong>Raster</strong></div>
      <div className="rf-context">
        <span>Projet</span>
        <div className="rf-chip-group" aria-label="Filtre projet">
          {projects.map((p) => (
            <button
              key={p}
              className={p === project ? "rf-chip rf-chip-active" : "rf-chip"}
              onClick={() => {
                setProject(p);
                setCaptureProject(p);
                setSelectedKey("");
              }}
            >
              {p}
            </button>
          ))}
        </div>
        {selectedGroup ? <><i>/</i><strong>{selectedGroup.lot}</strong></> : null}
      </div>
      <div className="rf-top-actions"><button className="rf-icon-button" title="Synchroniser" disabled={busy} onClick={() => void mutate(refresh)}>↻</button><button className="rf-capture-button" onClick={() => setCaptureOpen((open) => !open)}>＋ Capturer</button><span className="rf-avatar">Y</span></div>
    </header>

    {captureOpen ? <div className="rf-capture"><select value={captureProject} onChange={(e) => setCaptureProject(e.target.value)}>{projects.map((p) => <option key={p} value={p}>{p}</option>)}</select><input autoFocus value={draft} placeholder="Décrire une demande à placer dans l’inbox…" onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") capture(); }} /><button className="rf-primary" disabled={!draft.trim() || busy} onClick={capture}>Capturer</button><span>{inboxLines.length} élément(s) dans l’inbox globale</span></div> : null}
    {error ? <div className="rf-error">{error}<button onClick={() => setError("")}>×</button></div> : null}

    <div className="rf-shell">
      <aside className="rf-sidebar">
        <nav className="rf-nav" aria-label="Navigation Raster">{NAV.map((item) => {
          const count = item.id === "session"
            ? sessionGroups.length
            : item.id === "ready"
              ? readyNow.length
              : item.id === "captures"
                ? captureEntries.length
                : 0;
          return <button key={item.id} aria-selected={view === item.id} onClick={() => setView(item.id)}><span className="rf-nav-icon">{item.icon}</span><span>{item.label}</span>{count ? <span className="rf-nav-count">{count}</span> : null}</button>;
        })}</nav>
        <p className="rf-sidebar-note">Ready = lançable, pas encore engagé. Session = sous-lots passés à l’exécution.</p>
      </aside>

      <main className="rf-main">
        {view === "session" ? <SessionView groups={sessionGroups} selected={selectedGroup} running={running} modes={modes} mode={executionMode} busy={busy} onMode={setExecutionMode} onSelect={setSelectedKey} onRun={(group, mode) => void mutate(() => api.run(group.project, group.lot, group.souslot, mode))} onRelease={(key) => void mutate(() => api.releaseSession(key))} /> : null}
        {view === "ready" ? <ReadyView rows={readyNow} groups={projectGroups} onCommit={(key) => void mutate(async () => { await api.commitSession(key); setSelectedKey(key); setView("session"); })} /> : null}
        {view === "captures" ? <CaptureView entries={visibleCaptureEntries} projects={projects} filter={captureFilter} onFilter={setCaptureFilter} onDelete={deleteCapture} onUpdate={updateCapture} /> : null}
      </main>
    </div>
  </div>;
}

function SessionView({ groups, selected, running, modes, mode, busy, onMode, onSelect, onRun, onRelease }: { groups: Group[]; selected: Group | null; running: Lance[]; modes: Record<ExecutionMode, boolean>; mode: ExecutionMode; busy: boolean; onMode: (mode: ExecutionMode) => void; onSelect: (key: string) => void; onRun: (group: Group, mode: ExecutionMode) => void; onRelease: (key: string) => void }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!selected) return;
    setExpanded((current) => ({ ...current, [selected.key]: true }));
  }, [selected]);

  const selectedRunning = selected ? running.some((run) => run.project === selected.project && run.lot === selected.lot && run.souslot === selected.souslot) : false;
  return <><PageHead kicker="Front prêt · maintenant" title="Session d’exécution" subtitle={`${groups.length} sous-session(s) engagée(s).`}>{selected ? <div className="rf-launch-controls"><select aria-label="Mode d’exécution" value={mode} onChange={(event) => onMode(event.target.value as ExecutionMode)}><option value="local">Local</option><option value="agents">Agents cloud</option></select><button className="rf-primary" disabled={busy || selectedRunning} onClick={() => modes[mode] ? onRun(selected, mode) : void copyCursorBrief(selected, mode)}>{selectedRunning ? "● En cours" : modes[mode] ? `▶ Lancer · ${mode}` : "Copier le brief Cursor"}</button>{!selectedRunning ? <button className="rf-secondary" disabled={busy} onClick={() => onRelease(selected.key)}>Retirer</button> : null}</div> : null}</PageHead>
    {!modes[mode] ? <div className="rf-notice">Mode {mode} non configuré. {mode === "local" ? "RASTER_LOCAL_CMD" : "RASTER_AGENTS_CMD"} doit pointer vers le runner Cursor ; le brief reste copiable.</div> : null}
    <div className="rf-session-grid"><section><div className="rf-section-row"><h2>Agents et handoffs</h2>{groups.length > 1 ? <GroupPicker groups={groups} selected={selected} onSelect={onSelect} /> : null}</div>{groups.length ? <div className="rf-session-hierarchy">{groups.map((group) => {
      const isExpanded = expanded[group.key] ?? group.key === selected?.key;
      const activeRun = running.find((run) => run.project === group.project && run.lot === group.lot && run.souslot === group.souslot);
      const isRunning = Boolean(activeRun);
      return <div key={group.key} className={group.key === selected?.key ? "rf-session-card rf-session-card-selected" : "rf-session-card"}>
        <button className="rf-session-card-header" aria-expanded={isExpanded} onClick={() => { onSelect(group.key); setExpanded((current) => ({ ...current, [group.key]: !isExpanded })); }}>
          <span className="rf-session-card-bullet">{isRunning ? "●" : "○"}</span>
          <div>
            <small className="rf-session-card-lot">{group.lot}</small>
            <strong>{group.souslot || group.lot}</strong>
          </div>
          <div className="rf-session-card-meta-wrap">
            <span className="rf-session-card-meta">{activeRun ? activeRun.mode : `${group.tasks.length} task${group.tasks.length > 1 ? "s" : ""}`}</span>
            <span className="rf-session-card-expand">{isExpanded ? "▾" : "▸"}</span>
          </div>
        </button>
        {isExpanded ? <div className="rf-session-children">{group.tasks.map((task) => <div key={task.id} className="rf-session-task"><div className="rf-session-task-line" /> <div className="rf-session-task-body"><span className={`rf-agent rf-${taskAgentType(task)}`}>{taskAgentType(task) === "exec" ? "CO" : taskAgentType(task).slice(0, 2).toUpperCase()}</span><div className="rf-session-task-main"><div className="rf-session-task-row"><strong>{task.id} · {task.title}</strong><span className={`rf-status rf-status-${task.status}`}>{STATUS_LABEL[task.status] || task.status}</span></div><small>{agentName(task)}</small></div></div></div>)}</div> : null}
      </div>;
    })}</div> : <Empty text="Aucun sous-lot engagé. Passez-en un depuis Ready." />}</section></div>
  </>;
}

function ReadyView({ rows, groups, onCommit }: { rows: Ready[]; groups: Group[]; onCommit: (key: string) => void }) {
  return <><PageHead kicker="Prêts à lancer" title="Ready" subtitle="Ouverts, sans blocage, dans la fenêtre roadmap — pas encore en session." />
    {rows.length ? <div className="rf-flow">{rows.map((row) => {
      const key = `${row.project}//${row.lot}//${row.souslot}`;
      const group = groups.find((g) => g.key === key);
      return <button key={row.key} className="rf-ready-row" onClick={() => onCommit(row.key)}>
        <span className="rf-ready-mark">▸</span>
        <div>
          <strong>{row.souslot || row.lot}</strong>
          <small>{row.lot} · {row.restant} task(s) ouverte(s)</small>
        </div>
        <em>{group ? `${group.tasks.filter((task) => task.type === "spec" && task.status !== "done").length} spec à qualifier` : "engager"}</em>
      </button>;
    })}</div> : <Empty text="Rien de ready dans ce projet." />}
  </>;
}

function CaptureView({ entries, projects, filter, onFilter, onDelete, onUpdate }: { entries: Array<{ project: string; line: string }>; projects: string[]; filter: string; onFilter: (value: string) => void; onDelete: (line: string) => void; onUpdate: (oldLine: string, newLine: string) => void }) {
  const chips = ["all", ...projects];
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const startEdit = (line: string) => {
    setDraft(line);
    setEditingKey(line);
  };

  const saveEdit = (line: string) => {
    const next = draft.trim();
    if (!next) return;
    onUpdate(line, next);
    setEditingKey(null);
    setDraft("");
  };

  return <><PageHead kicker="Inbox" title="Captures" subtitle="Demande, idée, blocage ou tâche à réinjecter dans le bon projet." /><div className="rf-capture-panel"><div className="rf-capture-toolbar"><label>Projet</label><div className="rf-chip-group">{chips.map((project) => <button key={project} className={filter === project ? "rf-chip rf-chip-active" : "rf-chip"} onClick={() => onFilter(project)}>{project === "all" ? "All" : project}</button>)}</div></div>{entries.length ? <div className="rf-capture-list">{entries.map((entry, index) => <article key={`${entry.project}-${index}`}><span className="rf-capture-tag">{entry.project}</span>{editingKey === entry.line ? <div className="rf-capture-editor"><input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveEdit(entry.line); if (e.key === "Escape") { setEditingKey(null); setDraft(""); } }} /><div className="rf-capture-actions"><button className="rf-primary" onClick={() => saveEdit(entry.line)}>Enregistrer</button><button className="rf-secondary" onClick={() => { setEditingKey(null); setDraft(""); }}>Annuler</button></div></div> : <div className="rf-capture-content"><p>{entry.line}</p><div className="rf-capture-actions"><button className="rf-secondary" onClick={() => startEdit(entry.line)}>Modifier</button><button className="rf-secondary rf-capture-delete" onClick={() => onDelete(entry.line)}>Supprimer</button></div></div>}</article>)}</div> : <Empty text="Aucune capture pour ce filtre." />}</div></>;
}

function PageHead({ kicker, title, subtitle, children }: { kicker: string; title: string; subtitle: string; children?: React.ReactNode }) { return <header className="rf-page-head"><div><p>{kicker}</p><h1>{title}</h1><span>{subtitle}</span></div>{children ? <div className="rf-page-actions">{children}</div> : null}</header>; }
function GroupPicker({ groups, selected, onSelect }: { groups: Group[]; selected: Group | null; onSelect: (key: string) => void }) { return <select className="rf-picker" value={selected?.key || ""} onChange={(e) => onSelect(e.target.value)}>{groups.map((group) => <option key={group.key} value={group.key}>{group.lot} / {group.souslot || "général"}</option>)}</select>; }
function Empty({ text }: { text: string }) { return <div className="rf-empty">{text}</div>; }
function agentName(task: Task) { return taskAgentType(task) === "exec" ? "Code" : "Spec"; }
async function copyCursorBrief(group: Group, mode: ExecutionMode) {
  const brief = orchLaunchBrief(group, group.tasks, mode);
  try {
    await navigator.clipboard.writeText(brief);
  } catch {
    window.prompt("Copiez ce brief et collez-le dans Cursor :", brief);
  }
}
export function projetPorteur(projects: string[], tasks: Task[]): string {
  const counts = new Map<string, number>();
  for (const task of tasks) {
    if (projects.includes(task.project)) {
      counts.set(task.project, (counts.get(task.project) || 0) + 1);
    }
  }
  return [...projects].sort(
    (a, b) => (counts.get(b) || 0) - (counts.get(a) || 0)
  )[0] || "";
}

function resolveCaptureProject(line: string, fallback: string, projects: string[]) {
  const tags = [...line.matchAll(/(?:^|\s)@([a-zA-Z0-9_-]+)/g)].map((match) => match[1].toLowerCase());
  const match = tags.find((tag) => projects.some((project) => project.toLowerCase() === tag));
  if (match) return projects.find((project) => project.toLowerCase() === match) || match;
  return fallback || "global";
}

function groupTasks(tasks: Task[]): Group[] { const map = new Map<string, Group>(); for (const task of tasks) { const key = `${task.project}//${task.lot}//${task.souslot}`; if (!map.has(key)) map.set(key, { key, project: task.project, lot: task.lot, souslot: task.souslot, tasks: [] }); map.get(key)!.tasks.push(task); } for (const group of map.values()) group.tasks.sort((a, b) => Number(a.id.split("-").pop()) - Number(b.id.split("-").pop())); return [...map.values()].sort((a, b) => a.key.localeCompare(b.key)); }
