import { useCallback, useEffect, useMemo, useState } from "react";
import {
  api,
  orchLaunchBrief,
  taskAgentType,
  type Lance,
  type ProjectWindow,
  type Ready,
  type Task,
  type ViewId,
} from "./api";

type Group = { key: string; project: string; lot: string; souslot: string; tasks: Task[] };

const NAV: Array<{ id: ViewId; label: string; icon: string }> = [
  { id: "captures", label: "Captures", icon: "▣" },
  { id: "session", label: "Session", icon: "⌁" },
  { id: "ready", label: "Ready", icon: "▸" },
  { id: "plan", label: "Plan", icon: "◇" },
  { id: "sublot", label: "Sous-lots", icon: "▱" },
  { id: "deliveries", label: "Livraisons", icon: "✓" },
];

const STATUS_LABEL: Record<string, string> = {
  todo: "À faire", doing: "En cours", blocked: "Bloqué dehors",
  review: "À vérifier", "done-agent": "À approuver",
};

export default function App() {
  const [view, setView] = useState<ViewId>("session");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ready, setReady] = useState<Ready[]>([]);
  const [windows, setWindows] = useState<ProjectWindow[]>([]);
  const [projects, setProjects] = useState<string[]>([]);
  const [running, setRunning] = useState<Lance[]>([]);
  const [recent, setRecent] = useState<Lance[]>([]);
  const [spawnPret, setSpawnPret] = useState(false);
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
    const [meta, taskData, readyData, windowData, runData, inboxData] = await Promise.all([
      api.meta(), api.tasks(), api.ready(), api.windows(), api.running(), api.inbox(),
    ]);
    setProjects(meta.projects);
    setTasks(taskData.tasks);
    setReady(readyData.ready);
    setWindows(windowData.windows);
    setRunning(runData.running);
    setRecent(runData.recent);
    setSpawnPret(runData.spawnPret);
    setInboxLines(inboxData.lines);
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
      api.running().then((r) => { setRunning(r.running); setRecent(r.recent); }).catch(() => undefined);
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
  const readyByKey = useMemo(() => new Map(ready.map((row) => [row.key, row])), [ready]);
  const projectWindow = windows.find((row) => row.project === project);
  const authorizedKeys = useMemo(
    () => new Set(projectWindow?.lots.flatMap((lot) => lot.lancables.map((row) => row.key)) || []),
    [projectWindow]
  );
  const sessionGroups = projectGroups.filter((group) => authorizedKeys.has(group.key));
  const projectReady = ready.filter((row) => row.project === project && row.ouvert);
  const readyNow = projectReady.filter((row) => row.lancable);
  const selectedGroup = projectGroups.find((group) => group.key === selectedKey) || sessionGroups[0] || projectGroups[0] || null;
  const decisions = tasks.filter((task) => task.attend);
  const reports = tasks.filter((task) => task.rapport.trim());

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
      <div className="rf-context"><span>Projet</span><select value={project} onChange={(e) => { setProject(e.target.value); setCaptureProject(e.target.value); setSelectedKey(""); }}>{projects.map((p) => <option key={p}>{p}</option>)}</select>{selectedGroup ? <><i>/</i><strong>{selectedGroup.lot}</strong></> : null}</div>
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
            : item.id === "sublot"
              ? projectGroups.length
              : item.id === "captures"
                ? captureEntries.length
                : item.id === "deliveries"
                  ? reports.length
                  : 0;
          return <button key={item.id} aria-selected={view === item.id} onClick={() => setView(item.id)}><span className="rf-nav-icon">{item.icon}</span><span>{item.label}</span>{count ? <span className="rf-nav-count">{count}</span> : null}</button>;
        })}</nav>
        <p className="rf-sidebar-label">Projets actifs</p>
        {projects.map((p, index) => <button className="rf-project" key={p} aria-current={p === project} onClick={() => { setProject(p); setCaptureProject(p); setSelectedKey(""); }}><span style={{ background: ["#167a54", "#d98057", "#8874c8"][index % 3] }} />{p}</button>)}
        <p className="rf-sidebar-note">La session est calculée depuis la fenêtre autorisée et la readiness.</p>
      </aside>

      <main className="rf-main">
        {view === "session" ? <SessionView groups={sessionGroups} selected={selectedGroup} running={running} decisions={decisions} spawnPret={spawnPret} busy={busy} onSelect={setSelectedKey} onOpenPlan={() => setView("plan")} onApprove={(id) => void mutate(() => api.approve(id))} onRun={(group) => void mutate(() => api.run(group.project, group.lot, group.souslot))} /> : null}
        {view === "ready" ? <ReadyView rows={readyNow} groups={projectGroups} running={running} onOpen={(key) => { setSelectedKey(key); setView("sublot"); }} /> : null}
        {view === "plan" ? <PlanView project={project} windowData={projectWindow} groups={projectGroups} onOpen={(key) => { setSelectedKey(key); setView("sublot"); }} /> : null}
        {view === "sublot" ? <SubLotView groups={projectGroups} selected={selectedGroup} readyByKey={readyByKey} running={running} busy={busy} spawnPret={spawnPret} onSelect={setSelectedKey} onApprove={(id) => void mutate(() => api.approve(id))} onRun={(group) => void mutate(() => api.run(group.project, group.lot, group.souslot))} /> : null}
        {view === "captures" ? <CaptureView entries={visibleCaptureEntries} projects={projects} filter={captureFilter} onFilter={setCaptureFilter} onDelete={deleteCapture} onUpdate={updateCapture} /> : null}
        {view === "deliveries" ? <DeliveriesView tasks={reports} recent={recent} /> : null}
      </main>
    </div>
  </div>;
}

function SessionView({ groups, selected, running, decisions, spawnPret, busy, onSelect, onOpenPlan, onApprove, onRun }: { groups: Group[]; selected: Group | null; running: Lance[]; decisions: Task[]; spawnPret: boolean; busy: boolean; onSelect: (key: string) => void; onOpenPlan: () => void; onApprove: (id: string) => void; onRun: (group: Group) => void }) {
  const decision = decisions.find((task) => task.project === selected?.project);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!selected) return;
    setExpanded((current) => ({ ...current, [selected.key]: true }));
  }, [selected]);

  return <><PageHead kicker="Front prêt · maintenant" title="Session d’exécution" subtitle={`${groups.length} sous-lot(s) autorisé(s) par la roadmap.`}>{selected ? <button className="rf-primary" disabled={busy || running.some((run) => run.project === selected.project && run.lot === selected.lot)} onClick={() => spawnPret ? onRun(selected) : void copyCursorBrief(selected)}>{running.some((run) => run.project === selected.project && run.lot === selected.lot) ? "● En cours" : spawnPret ? "▶ Lancer ce sous-lot" : "Copier le brief Cursor"}</button> : null}</PageHead>
    {!spawnPret ? <div className="rf-notice">Le lancement automatique n’est pas configuré. Raster peut toutefois copier un brief complet à coller dans Cursor.</div> : null}
    <div className="rf-session-grid"><section><div className="rf-section-row"><h2>Agents et handoffs</h2><GroupPicker groups={groups} selected={selected} onSelect={onSelect} /></div>{groups.length ? <div className="rf-session-hierarchy">{groups.map((group) => {
      const isExpanded = expanded[group.key] ?? group.key === selected?.key;
      const isRunning = running.some((run) => run.project === group.project && run.lot === group.lot);
      return <div key={group.key} className={group.key === selected?.key ? "rf-session-card rf-session-card-selected" : "rf-session-card"}>
        <button className="rf-session-card-header" aria-expanded={isExpanded} onClick={() => { onSelect(group.key); setExpanded((current) => ({ ...current, [group.key]: !isExpanded })); }}>
          <span className="rf-session-card-bullet">{isRunning ? "●" : "○"}</span>
          <div>
            <small className="rf-session-card-lot">{group.lot}</small>
            <strong>{group.souslot || group.lot}</strong>
          </div>
          <div className="rf-session-card-meta-wrap">
            <span className="rf-session-card-meta">{group.tasks.length} task{group.tasks.length > 1 ? "s" : ""}</span>
            <span className="rf-session-card-expand">{isExpanded ? "▾" : "▸"}</span>
          </div>
        </button>
        {isExpanded ? <div className="rf-session-children">{group.tasks.map((task) => <div key={task.id} className="rf-session-task"><div className="rf-session-task-line" /> <div className="rf-session-task-body"><span className={`rf-agent rf-${taskAgentType(task)}`}>{taskAgentType(task) === "exec" ? "CO" : taskAgentType(task).slice(0, 2).toUpperCase()}</span><div className="rf-session-task-main"><div className="rf-session-task-row"><strong>{task.id} · {task.title}</strong><span className={`rf-status rf-status-${task.status}`}>{STATUS_LABEL[task.status] || task.status}</span></div><small>{agentName(task)}</small></div></div></div>)}</div> : null}
      </div>;
    })}</div> : <Empty text="Aucun sous-lot dans la fenêtre autorisée." />}</section>
      <aside><h2>À toi</h2>{decision ? <div className="rf-decision"><span>◆ Gate · {decision.gate}</span><h3>{decision.title}</h3><p>{decision.question || "Le travail de l’agent est prêt pour ta décision."}</p><div><button className="rf-primary" disabled={busy || decision.status !== "done-agent"} onClick={() => onApprove(decision.id)}>Approuver</button><button className="rf-secondary" onClick={onOpenPlan}>Voir le plan</button></div></div> : <Empty text="Aucune décision ne t’attend." />}</aside></div>
  </>;
}

function ReadyView({ rows, groups, running, onOpen }: { rows: Ready[]; groups: Group[]; running: Lance[]; onOpen: (key: string) => void }) {
  return <><PageHead kicker="Sous-lots lançables" title="Ready" subtitle="Sous-lots ouverts, sans blocage, prêts pour qualification puis exécution." />
    {rows.length ? <div className="rf-flow">{rows.map((row) => {
      const key = `${row.project}//${row.lot}//${row.souslot}`;
      const group = groups.find((g) => g.key === key);
      const isRunning = running.some((run) => run.project === row.project && run.lot === row.lot);
      return <button key={row.key} className="rf-ready-row" onClick={() => onOpen(row.key)}>
        <span className="rf-ready-mark">{isRunning ? "●" : "▸"}</span>
        <div>
          <strong>{row.souslot || row.lot}</strong>
          <small>{row.lot} · {row.restant} task(s) ouverte(s)</small>
        </div>
        <em>{group ? `${group.tasks.filter((task) => task.type === "spec" && task.status !== "done" && task.status !== "done-agent" && task.status !== "done-me").length} spec à qualifier` : "ouvrir"}</em>
      </button>;
    })}</div> : <Empty text="Aucun sous-lot ready dans ce projet." />}
  </>;
}

function PlanView({ project, windowData, groups, onOpen }: { project: string; windowData?: ProjectWindow; groups: Group[]; onOpen: (key: string) => void }) {
  const ordered = [...(windowData?.fenetre || []), ...(windowData?.fermes || [])];
  return <><PageHead kicker="Permission humaine" title="Plan du projet" subtitle="La roadmap exprime ton intention. La borne contrôle l’autonomie." /><div className="rf-plan-grid"><section className="rf-roadmap"><header><strong>ROADMAP · {project}</strong><span>{windowData?.fichier || "aucune roadmap"}</span></header>{ordered.map((lot, index) => {
    const rows = groups.filter((group) => group.lot === lot); const open = rows.filter((group) => group.tasks.some((task) => !task.status.startsWith("done"))).length; const allowed = windowData?.fenetre.includes(lot);
    return <div key={lot}>{!allowed && index === (windowData?.fenetre.length || 0) ? <div className="rf-boundary">BORNE D’AUTONOMIE</div> : null}<button className="rf-lot" onClick={() => rows[0] && onOpen(rows[0].key)}><span>{String(index + 1).padStart(2, "0")}</span><span><strong>{lot}</strong><small>{rows.length ? `${rows.length} sous-lot(s) · ${open} ouvert(s)` : "pas encore découpé"}</small></span><em className={allowed ? "allowed" : "waiting"}>{allowed ? "permis" : "plus tard"}</em></button></div>;
  })}{!ordered.length ? <Empty text={windowData?.note || "La roadmap ne contient aucun lot."} /> : null}</section><aside className="rf-aside"><div className="rf-note"><span>Fenêtre ouverte</span><strong>{windowData?.fenetre.length || 0} lots</strong><p>{windowData?.lots.reduce((sum, lot) => sum + lot.lancables.length, 0) || 0} sous-lot(s) lançable(s).</p></div><div className="rf-permission"><p><b>⌁ Le graphe dit « possible »</b><span>Dépendances closes et aucun blocage externe.</span></p><p><b>✓ La borne dit « permis »</b><span>Seuls les lots placés au-dessus peuvent démarrer.</span></p></div></aside></div></>;
}

function SubLotView({ groups, selected, readyByKey, running, busy, spawnPret, onSelect, onApprove, onRun }: { groups: Group[]; selected: Group | null; readyByKey: Map<string, Ready>; running: Lance[]; busy: boolean; spawnPret: boolean; onSelect: (key: string) => void; onApprove: (id: string) => void; onRun: (group: Group) => void }) {
  if (!selected) return <><PageHead kicker="Sous-lot" title="Aucun travail actif" subtitle="Ce projet ne contient aucune Task active." /><Empty text="Les livraisons closes vivent dans Git." /></>;
  const readiness = readyByKey.get(selected.key); const isRunning = running.some((run) => run.project === selected.project && run.lot === selected.lot);
  return <><PageHead kicker={`${selected.lot} / sous-lot`} title={humanize(selected.souslot || selected.lot)} subtitle="Une tranche livrable, un plan, plusieurs compétences exécutantes."><GroupPicker groups={groups} selected={selected} onSelect={onSelect} /></PageHead><div className="rf-sub-grid"><aside className="rf-plan-card"><h3>Intention du plan</h3><p>{selected.tasks[0]?.title || "Plan du sous-lot"}</p><dl><div><dt>Orchestrator</dt><dd>{isRunning ? "Run active" : "Disponible"}</dd></div><div><dt>Readiness</dt><dd className={readiness?.lancable ? "good" : "warn"}>{readiness?.lancable ? "Prêt" : readiness?.raisons[0] || "Clos"}</dd></div><div><dt>Dépend de</dt><dd>{[...new Set(selected.tasks.flatMap((task) => task.blocked_by))].length || "aucun"}</dd></div><div><dt>Gate</dt><dd>{selected.tasks.some((task) => task.gate === "me") ? "me" : "aucune"}</dd></div></dl><button className="rf-primary wide" disabled={busy || !readiness?.lancable || isRunning} onClick={() => spawnPret ? onRun(selected) : void copyCursorBrief(selected)}>{isRunning ? "● Run active" : spawnPret ? "▶ Lancer le sous-lot" : "Copier le brief Cursor"}</button></aside><section className="rf-task-list"><header><strong>Tasks du plan</strong><span>{selected.tasks.length}</span></header>{selected.tasks.map((task, index) => <article key={task.id}><span className="rf-step">{index + 1}</span><code>{task.id}</code><div><strong>{task.title}</strong><small>{STATUS_LABEL[task.status] || task.status}{task.blocked_by.length ? ` · après ${task.blocked_by.join(", ")}` : ""}</small></div><span className={`rf-agent rf-${taskAgentType(task)}`}>{agentName(task)}</span>{task.status === "done-agent" && task.gate === "me" ? <button className="rf-approve" disabled={busy} onClick={() => onApprove(task.id)}>Approuver</button> : null}</article>)}</section></div></>;
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

function DeliveriesView({ tasks, recent }: { tasks: Task[]; recent: Lance[] }) {
  return <><PageHead kicker="Mémoire durable" title="Livraisons" subtitle="Les résultats connus restent lisibles avant leur sortie du backlog." /><div className="rf-delivery-list">{tasks.map((task) => <article key={task.id}><span className="rf-delivery-mark">✓</span><div><strong>{task.id} · {task.title}</strong><small>{agentName(task)} · {STATUS_LABEL[task.status] || task.status}</small><p>{firstLine(task.rapport)}</p></div><time>{task.status === "review" ? "validation requise" : task.status}</time></article>)}{recent.map((run) => <article key={`${run.project}-${run.lot}-${run.depuis}`}><span className="rf-delivery-mark">⌁</span><div><strong>{run.project} · {run.lot}</strong><small>Run orchestrateur · code {run.code ?? "—"}</small></div><time>{run.etat}</time></article>)}{!tasks.length && !recent.length ? <Empty text="Aucun rapport actif. Les anciennes livraisons sont consultables dans Git." /> : null}</div></>;
}

function PageHead({ kicker, title, subtitle, children }: { kicker: string; title: string; subtitle: string; children?: React.ReactNode }) { return <header className="rf-page-head"><div><p>{kicker}</p><h1>{title}</h1><span>{subtitle}</span></div>{children ? <div className="rf-page-actions">{children}</div> : null}</header>; }
function GroupPicker({ groups, selected, onSelect }: { groups: Group[]; selected: Group | null; onSelect: (key: string) => void }) { return <select className="rf-picker" value={selected?.key || ""} onChange={(e) => onSelect(e.target.value)}>{groups.map((group) => <option key={group.key} value={group.key}>{group.lot} / {group.souslot || "général"}</option>)}</select>; }
function Empty({ text }: { text: string }) { return <div className="rf-empty">{text}</div>; }
function agentName(task: Task) { const type = taskAgentType(task); return type === "exec" ? "Code" : type === "spec" ? "Spec" : "QA"; }
function humanize(value: string) { return value.replace(/-/g, " ").replace(/^./, (letter) => letter.toUpperCase()); }
function firstLine(value: string) { return value.replace(/[#*`]/g, "").split(/\r?\n/).map((line) => line.trim()).find(Boolean) || "Rapport disponible"; }
async function copyCursorBrief(group: Group) {
  const brief = orchLaunchBrief(group, group.tasks);
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
