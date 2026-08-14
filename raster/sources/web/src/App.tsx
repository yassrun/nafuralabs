import { useCallback, useEffect, useMemo, useState } from "react";
import {
  api,
  launchBrief,
  orchLaunchBrief,
  statusGlyph,
  taskAgentType,
  type AgentFilter,
  type Task,
  type ViewId,
} from "./api";

const ALL = "all";

export default function App() {
  const [view, setView] = useState<ViewId>("backlog");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [inboxLines, setInboxLines] = useState<string[]>([]);
  const [projects, setProjects] = useState<string[]>([]);
  const [sprint, setSprint] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [filterProject, setFilterProject] = useState("raster");
  const [agentFilter, setAgentFilter] = useState<AgentFilter>("all");
  const [draft, setDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const [meta, t, i] = await Promise.all([
      api.meta(),
      api.tasks(),
      api.inbox(),
    ]);
    setSprint(meta.sprint);
    setProjects(meta.projects);
    setTasks(t.tasks);
    setInboxLines(i.lines);
    setFilterProject((prev) => {
      if (prev === ALL) return ALL;
      return meta.projects.includes(prev) ? prev : meta.projects[0] || prev;
    });
  }, []);

  useEffect(() => {
    refresh()
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [refresh]);

  const selected = useMemo(() => {
    const t = tasks.find((x) => x.id === selectedId) || null;
    if (!t) return null;
    if (view === "inbox") return null;
    if (filterProject !== ALL && t.project !== filterProject) return null;
    return t;
  }, [tasks, selectedId, filterProject, view]);

  const scopedTasks = useMemo(
    () =>
      agentFilter === "all"
        ? tasks
        : tasks.filter(
            (t) => !isWorkTask(t) || taskAgentType(t) === agentFilter
          ),
    [tasks, agentFilter]
  );

  const select = (id: string) => {
    setSelectedId(id);
    setConfirmDelete(false);
  };

  const setViewSafe = (v: ViewId) => {
    setView(v);
    setConfirmDelete(false);
    if (v === "inbox") {
      setSelectedId(null);
      setSelectedLine(null);
    }
    if (v === "sprint" || v === "done-agent") {
      setFilterProject(ALL);
      setSelectedId(null);
    }
    if (v === "backlog" && filterProject === ALL) {
      setFilterProject((prev) =>
        prev === ALL
          ? projects.includes("raster")
            ? "raster"
            : projects[0] || "raster"
          : prev
      );
    }
  };

  const onCapture = async () => {
    const line = draft.trim();
    if (!line) return;
    setBusy(true);
    try {
      const i = await api.capture(line);
      setDraft("");
      setInboxLines(i.lines);
      setSelectedLine(line);
      setViewSafe("inbox");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onStatus = async (id: string, status: string) => {
    setBusy(true);
    try {
      const r = await api.patchTask(id, { status });
      setTasks(r.tasks);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onCommit = async (id: string) => {
    setBusy(true);
    try {
      const r = await api.commitSprint(id);
      setTasks(r.tasks);
      setSprint(r.sprint);
      setFilterProject(ALL);
      setView("sprint");
      setSelectedId(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (id: string) => {
    setBusy(true);
    try {
      const r = await api.deleteTask(id);
      setTasks(r.tasks);
      setSelectedId(null);
      setConfirmDelete(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="loading">Chargement Raster…</div>;
  if (error && tasks.length === 0) {
    return (
      <div className="error">
        Erreur API : {error}
        <br />
        <button className="btn" onClick={() => window.location.reload()}>
          Recharger
        </button>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <h1>Raster</h1>
          <span className="tag">local</span>
          <span className="hint">orchestrateur · {sprint}</span>
        </div>
        <nav className="nav">
          {(
            [
              ["inbox", "Inbox"],
              ["backlog", "Backlog"],
              ["sprint", "Sprint"],
              ["done-agent", "Done agent"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={view === id ? "active" : ""}
              onClick={() => setViewSafe(id)}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            className="btn"
            style={{ marginLeft: "auto" }}
            disabled={busy}
            title="Recharger depuis les fichiers (agents / CLI)"
            onClick={() => {
              setBusy(true);
              setError(null);
              refresh()
                .catch((e) =>
                  setError(e instanceof Error ? e.message : String(e))
                )
                .finally(() => setBusy(false));
            }}
          >
            {busy ? "Sync…" : "Synchro"}
          </button>
        </nav>
      </header>

      <div className="capture">
        {view !== "inbox" ? (
          <select
            value={
              (view === "sprint" || view === "done-agent") &&
              filterProject === ALL
                ? ALL
                : filterProject === ALL
                  ? projects[0] || ""
                  : filterProject
            }
            onChange={(e) => {
              setFilterProject(e.target.value);
              setSelectedId(null);
              setConfirmDelete(false);
            }}
          >
            {view === "sprint" || view === "done-agent" ? (
              <option value={ALL}>All</option>
            ) : null}
            {projects.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        ) : null}
        <input
          value={draft}
          placeholder="Task draft — description, @bug @tech @physical optionnel…"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void onCapture();
          }}
        />
        <button
          type="button"
          className="btn primary"
          disabled={busy || !draft.trim()}
          onClick={() => void onCapture()}
        >
          Capturer
        </button>
        {view !== "inbox" ? (
          <AgentFilterBar
            value={agentFilter}
            onChange={(v) => {
              setAgentFilter(v);
              setSelectedId(null);
            }}
          />
        ) : null}
        <div className="path">
          {view === "inbox"
            ? "raster/inbox.md (global)"
            : view === "sprint" && filterProject === ALL
              ? "filtre · All"
              : `filtre · ${filterProject}`}
        </div>
      </div>

      {error ? (
        <div className="callout danger" style={{ margin: "8px 20px 0" }}>
          {error}{" "}
          <button type="button" className="btn ghost" onClick={() => setError(null)}>
            ok
          </button>
        </div>
      ) : null}

      <div className="layout">
        <main className="main">
          {view !== "inbox" ? (
            <ProjectTabs
              projects={projects}
              active={
                view === "sprint" || view === "done-agent"
                  ? filterProject
                  : filterProject === ALL
                    ? projects[0] || ""
                    : filterProject
              }
              showAll={view === "sprint" || view === "done-agent"}
              allCount={
                view === "sprint"
                  ? scopedTasks.filter((t) => isSprintRow(t, sprint)).length
                  : view === "done-agent"
                    ? scopedTasks.filter(isDoneAgentRow).length
                    : scopedTasks.filter((t) => isWorkTask(t) && t.status !== "done-agent").length
              }
              counts={Object.fromEntries(
                projects.map((p) => [
                  p,
                  view === "sprint"
                    ? scopedTasks.filter(
                        (t) => t.project === p && isSprintRow(t, sprint)
                      ).length
                    : view === "done-agent"
                      ? scopedTasks.filter(
                          (t) => t.project === p && isDoneAgentRow(t)
                        ).length
                      : scopedTasks.filter(
                          (t) =>
                            t.project === p &&
                            isWorkTask(t) &&
                            t.status !== "done-agent"
                        ).length,
                ])
              )}
              onSelect={(p) => {
                setFilterProject(p);
                setSelectedId(null);
                setConfirmDelete(false);
              }}
            />
          ) : null}
          {view === "inbox" ? (
            <Inbox
              lines={inboxLines}
              selectedLine={selectedLine}
              projects={projects}
              tasks={tasks}
              busy={busy}
              defaultProject={filterProject === ALL ? "raster" : filterProject}
              onSelectLine={setSelectedLine}
              onPromote={async (line, project, parent) => {
                setBusy(true);
                try {
                  const r = await api.promote(line, project, parent);
                  setInboxLines(r.lines);
                  setTasks(r.tasks);
                  setSelectedLine(null);
                  setFilterProject(project);
                  setSelectedId(r.id);
                  setViewSafe("backlog");
                } catch (e) {
                  setError(e instanceof Error ? e.message : String(e));
                } finally {
                  setBusy(false);
                }
              }}
            />
          ) : null}
          {view === "backlog" ? (
            <Backlog
              project={
                filterProject === ALL
                  ? projects[0] || "raster"
                  : filterProject
              }
              tasks={scopedTasks.filter((t) =>
                filterProject === ALL
                  ? true
                  : t.project === filterProject
              )}
              sprint={sprint}
              selectedId={selectedId}
              onSelect={select}
              onCommit={(id) => void onCommit(id)}
              busy={busy}
            />
          ) : null}
          {view === "sprint" ? (
            <Sprint
              heading={`Sprint ${sprint}`}
              empty={`Rien dans ${sprint} — commit depuis Backlog.`}
              project={filterProject === ALL ? "All" : filterProject}
              showProject={filterProject === ALL}
              tasks={scopedTasks.filter(
                (t) =>
                  isSprintRow(t, sprint) &&
                  (filterProject === ALL || t.project === filterProject)
              )}
              allTasks={tasks}
              selectedId={selectedId}
              onSelect={select}
              showOrch
              busy={busy}
            />
          ) : null}
          {view === "done-agent" ? (
            <Sprint
              heading="Done agent"
              empty="Aucune task done-agent — l’agent passe le status ici après la vérif."
              project={filterProject === ALL ? "All" : filterProject}
              showProject={filterProject === ALL}
              tasks={scopedTasks.filter(
                (t) =>
                  isDoneAgentRow(t) &&
                  (filterProject === ALL || t.project === filterProject)
              )}
              allTasks={tasks}
              selectedId={selectedId}
              onSelect={select}
            />
          ) : null}
        </main>
        <aside className="side">
          {view === "inbox" ? (
            <InboxDetail
              count={inboxLines.length}
              line={selectedLine}
            />
          ) : (
            <Detail
              task={selected}
              allTasks={tasks}
              busy={busy}
              confirmDelete={confirmDelete}
              setConfirmDelete={setConfirmDelete}
              onCommit={(id) => void onCommit(id)}
              onStatus={(s) => selected && void onStatus(selected.id, s)}
              onDelete={() => selected && void onDelete(selected.id)}
            />
          )}
        </aside>
      </div>
    </div>
  );
}

function ProjectTabs({
  projects,
  active,
  counts,
  onSelect,
  showAll = false,
  allCount = 0,
}: {
  projects: string[];
  active: string;
  counts: Record<string, number>;
  onSelect: (p: string) => void;
  showAll?: boolean;
  allCount?: number;
}) {
  return (
    <div className="project-tabs" role="tablist" aria-label="Projet">
      {showAll ? (
        <button
          type="button"
          role="tab"
          aria-selected={active === "all"}
          className={active === "all" ? "active" : ""}
          onClick={() => onSelect("all")}
        >
          All
          <span className="n">{allCount}</span>
        </button>
      ) : null}
      {projects.map((p) => (
        <button
          key={p}
          type="button"
          role="tab"
          aria-selected={active === p}
          className={active === p ? "active" : ""}
          onClick={() => onSelect(p)}
        >
          {p}
          <span className="n">{counts[p] ?? 0}</span>
        </button>
      ))}
    </div>
  );
}

function AgentFilterBar({
  value,
  onChange,
}: {
  value: AgentFilter;
  onChange: (v: AgentFilter) => void;
}) {
  return (
    <div className="agent-tabs" role="tablist" aria-label="Type d'agent">
      {(
        [
          ["all", "All"],
          ["spec", "Spec"],
          ["exec", "Exec"],
          ["qa", "QA"],
        ] as const
      ).map(([id, label]) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={value === id}
          className={value === id ? "active" : ""}
          onClick={() => onChange(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function draftTypeFromLine(
  line: string
): "bug" | "feature" | "tech" | "physical" | "spec" {
  if (/(?:^|\s)@tech\b/i.test(line) || /^tech\b/i.test(line)) {
    return "tech";
  }
  if (/(?:^|\s)@physical\b/i.test(line) || /^physical\b/i.test(line)) {
    return "physical";
  }
  if (/(?:^|\s)@spec\b/i.test(line) || /^spec\b/i.test(line)) return "spec";
  if (/(?:^|\s)@bug\b/i.test(line) || /^bug\b/i.test(line)) return "bug";
  return "feature";
}

function draftDescription(line: string): string {
  return line
    .replace(/(?:^|\s)@([a-zA-Z0-9_-]+)/g, "")
    .replace(/\s+/g, " ")
    .trim() || line.trim();
}

function Inbox({
  lines,
  selectedLine,
  projects,
  tasks,
  busy,
  defaultProject,
  onSelectLine,
  onPromote,
}: {
  lines: string[];
  selectedLine: string | null;
  projects: string[];
  tasks: Task[];
  busy: boolean;
  defaultProject: string;
  onSelectLine: (line: string) => void;
  onPromote: (line: string, project: string, parent: string) => void | Promise<void>;
}) {
  const [projectByLine, setProjectByLine] = useState<Record<string, string>>(
    {}
  );
  const [parentByLine, setParentByLine] = useState<Record<string, string>>(
    {}
  );

  const projectFor = (line: string) =>
    projectByLine[line] ||
    (projects.includes(defaultProject) ? defaultProject : projects[0] || "");

  /** Cibles de promote = des DOSSIERS existants : "<lot>" ou "<lot>/<sous-lot>". */
  const parentsFor = (line: string) => {
    const proj = projectFor(line);
    const paths = new Set<string>();
    for (const t of tasks) {
      if (t.project !== proj || !t.lot) continue;
      paths.add(t.souslot ? `${t.lot}/${t.souslot}` : t.lot);
    }
    return [...paths].sort();
  };

  const parentFor = (line: string) => parentByLine[line] || "";

  return (
    <section>
      <h2>Inbox</h2>
      <p className="muted">
        Uniquement <code>raster/inbox.md</code> · {lines.length} task
        draft(s) · pas de lot / sous-lot ici
      </p>
      <div className="faint" style={{ marginBottom: 10 }}>
        Description = la ligne. Promote → fichier sous{" "}
        <code>raster-src/lots/&lt;lot&gt;/[&lt;sous-lot&gt;/]tasks/</code> — un dossier, pas un ticket.
      </div>
      <div className="list-panel">
        {lines.length === 0 ? (
          <div className="empty">Vide — capturer une task draft en haut</div>
        ) : (
          lines.map((line) => {
            const parents = parentsFor(line);
            const parent = parentFor(line);
            const ty = draftTypeFromLine(line);
            return (
              <div
                key={line}
                className={`row ${selectedLine === line ? "selected" : ""}`}
                onClick={() => onSelectLine(line)}
              >
                <TypeBadge type={ty} />
                <span className="pill warn">draft</span>
                <span className="row-title">{draftDescription(line)}</span>
                <select
                  value={projectFor(line)}
                  disabled={busy}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    setProjectByLine((prev) => ({
                      ...prev,
                      [line]: e.target.value,
                    }));
                    setParentByLine((prev) => ({ ...prev, [line]: "" }));
                  }}
                >
                  {projects.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <select
                  value={parent}
                  disabled={busy || parents.length === 0}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) =>
                    setParentByLine((prev) => ({
                      ...prev,
                      [line]: e.target.value,
                    }))
                  }
                >
                  <option value="">
                    {parents.length === 0
                      ? "— aucun · rester inbox —"
                      : "— rester inbox —"}
                  </option>
                  {parents.map((p) => (
                    <option key={p} value={p}>
                      {p.includes("/") ? "sous-lot" : "lot"} · {p}
                    </option>
                  ))}
                </select>
                <span className="row-actions">
                  <button
                    type="button"
                    className="btn primary"
                    disabled={busy || !parent}
                    onClick={(e) => {
                      e.stopPropagation();
                      void onPromote(line, projectFor(line), parent);
                    }}
                  >
                    Promouvoir
                  </button>
                </span>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function InboxDetail({
  count,
  line,
}: {
  count: number;
  line: string | null;
}) {
  if (!line) {
    return (
      <div className="stack">
        <h2>Task draft</h2>
        <p className="muted">
          Source unique : <strong>raster/inbox.md</strong>. Pas d’ID tant que
          non promu.
        </p>
        <div className="pill info" style={{ alignSelf: "flex-start" }}>
          {count} draft(s)
        </div>
      </div>
    );
  }
  const ty = draftTypeFromLine(line);
  return (
    <div className="stack">
      <div className="detail-kicker">
        <TypeBadge type={ty} />
        <span className="faint">task draft · pas d’ID</span>
      </div>
      <h2>Inbox</h2>
      <div className="title">{draftDescription(line)}</div>
      <p className="muted">Description (ligne brute)</p>
      <div className="faint">{line}</div>
      <div className="pill warn" style={{ alignSelf: "flex-start" }}>
        reste dans raster/inbox.md jusqu’au promote
      </div>
    </div>
  );
}

type ItemType = "lot" | "sous-lot" | "spec" | "feature" | "bug" | "tech" | "physical" | "qa";

function isBug(t: Task) {
  if ((t.type || "").toLowerCase() === "bug") return true;
  const tags = t.tags || [];
  if (tags.some((x) => x.toLowerCase() === "bug")) return true;
  return false;
}

/** Tout fichier sous `tasks/` EST une task. Les chapeaux sont des dossiers. */
function isWorkTask(_t: Task) {
  return true;
}

function isArchivedStatus(s: string) {
  return s === "done-me" || s === "done";
}

function isSprintRow(t: Task, week: string) {
  return (
    isWorkTask(t) &&
    t.sprint === week &&
    t.status !== "done-agent" &&
    !isArchivedStatus(t.status)
  );
}

function isDoneAgentRow(t: Task) {
  return isWorkTask(t) && t.status === "done-agent";
}

function workType(
  t: Task
): "bug" | "feature" | "tech" | "physical" | "spec" | "qa" {
  const ty = (t.type || "").toLowerCase();
  if (
    ty === "bug" ||
    ty === "feature" ||
    ty === "tech" ||
    ty === "physical" ||
    ty === "spec" ||
    ty === "qa"
  )
    return ty;
  if (isBug(t)) return "bug";
  const tags = (t.tags || []).map((x) => x.toLowerCase());
  for (const cand of ["tech", "physical", "spec", "qa"] as const) {
    if (tags.includes(cand)) return cand;
  }
  return "feature";
}

function itemType(t: Task): ItemType {
  return workType(t);
}

/** Groupe derive du CHEMIN : projet -> lot -> sous-lot. */
type Group = { key: string; project: string; lot: string; souslot: string; tasks: Task[] };

function groupTree(tasks: Task[]): Group[] {
  const map = new Map<string, Group>();
  for (const t of tasks) {
    const key = `${t.project}//${t.lot}//${t.souslot}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        project: t.project,
        lot: t.lot,
        souslot: t.souslot,
        tasks: [],
      });
    }
    map.get(key)!.tasks.push(t);
  }
  for (const g of map.values()) {
    g.tasks.sort((a, b) => a.id.localeCompare(b.id));
  }
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
}

/** Un sous-lot est `done` ssi toutes ses tasks le sont — derive, jamais stocke. */
function groupDone(g: Group) {
  return g.tasks.length > 0 && g.tasks.every((t) => t.status === "done-agent");
}

function TypeBadge({ type }: { type: ItemType }) {
  return <span className={`type type-${type}`}>{type}</span>;
}

function OrchLaunchButton({
  group,
  kids,
  busy = false,
  showBrief = false,
  compact = false,
}: {
  group: { project: string; lot: string; souslot: string };
  kids: Task[];
  busy?: boolean;
  showBrief?: boolean;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [shown, setShown] = useState<string | null>(null);
  const onLaunch = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const brief = orchLaunchBrief(group, kids);
    setShown(brief);
    try {
      await navigator.clipboard.writeText(brief);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  const btn = (
    <button
      type="button"
      className={compact ? "btn compact" : "btn primary"}
      disabled={busy}
      onClick={(e) => void onLaunch(e)}
    >
      {copied ? "Brief copié" : "Lancer orchestrateur"}
    </button>
  );
  if (compact) return btn;
  return (
    <div className="stack" style={{ gap: 8 }}>
      {btn}
      {showBrief ? (
        <p className="muted">
          Ce sous-lot (CH Pact) · spec → exec → spec (MAJ) → qa (MAJ ou créer)
          → done-agent.
        </p>
      ) : null}
      {showBrief && shown ? (
        <pre className="launch-brief">{shown}</pre>
      ) : null}
    </div>
  );
}

function Backlog({
  project,
  tasks,
  sprint,
  selectedId,
  onSelect,
  onCommit,
  busy,
}: {
  project: string;
  tasks: Task[];
  sprint: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCommit: (id: string) => void;
  busy: boolean;
}) {
  const groups = groupTree(tasks);
  const byLot = new Map<string, Group[]>();
  for (const g of groups) {
    if (!byLot.has(g.lot)) byLot.set(g.lot, []);
    byLot.get(g.lot)!.push(g);
  }

  const renderGroup = (g: Group, depth: number) => (
    <div key={g.key} className={depth === 0 ? "tree-block" : undefined}>
      {g.souslot ? (
        <div className="row feature" style={{ paddingLeft: 8 + depth * 16 }}>
          <span className="tree-mark">▾</span>
          <TypeBadge type="sous-lot" />
          <span>{groupDone(g) ? "✓" : "·"}</span>
          <strong className="row-title">{g.souslot}</strong>
          <span className="pill">{g.tasks.length} task(s)</span>
          <span className="row-actions">
            <OrchLaunchButton group={g} kids={g.tasks} busy={busy} compact />
          </span>
        </div>
      ) : null}
      {g.tasks.map((k) => (
        <BacklogRow
          key={k.id}
          task={k}
          depth={g.souslot ? depth + 1 : depth}
          selectedId={selectedId}
          onSelect={onSelect}
          onCommit={onCommit}
          busy={busy}
          showCommit={!k.sprint}
        />
      ))}
    </div>
  );

  const liveTasks = tasks.filter(isWorkTask);

  return (
    <section>
      <h2>Backlog</h2>
      <p className="muted">
        {project} · l'arbre est le <code>chemin</code> · lot et sous-lot sont des
        dossiers · Commit = <code>sprint:</code> sur la task →{" "}
        {sprint || "sprint"}
      </p>
      <div className="list-panel backlog-tree">
        {liveTasks.length === 0 ? (
          <div className="empty">Aucune task — lots vides = inbox / draft</div>
        ) : null}

        {[...byLot.entries()].map(([lot, gs]) => {
          const count = gs.reduce((n, g) => n + g.tasks.length, 0);
          return (
            <div key={lot || "(hors lot)"} className="tree-block">
              <div className="row feature umbrella">
                <span className="tree-mark">▾</span>
                <TypeBadge type="lot" />
                <strong className="row-title">{lot || "(hors lot)"}</strong>
                <span className="pill">{count} task(s)</span>
              </div>
              {gs.map((g) => renderGroup(g, 1))}
            </div>
          );
        })}
      </div>
    </section>
  );
}


function BacklogRow({
  task,
  depth,
  selectedId,
  onSelect,
  onCommit,
  busy,
  showCommit,
  meta,
}: {
  task: Task;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCommit: (id: string) => void;
  busy: boolean;
  showCommit: boolean;
  meta?: string;
}) {
  const type = itemType(task);
  return (
    <div
      className={`row child type-row-${type} ${selectedId === task.id ? "selected" : ""}`}
      style={{ paddingLeft: 8 + depth * 16 }}
    >
      <span className="tree-mark faint">├</span>
      <TypeBadge type={type} />
      <span className="pill agent">{taskAgentType(task)}</span>
      <span>{statusGlyph(task.status)}</span>
      <button
        type="button"
        className={`id ${selectedId === task.id ? "active" : ""}`}
        onClick={() => onSelect(task.id)}
      >
        {task.id}
      </button>
      <span className="row-title">{task.title}</span>
      {meta ? <span className="faint">{meta}</span> : null}
      <span className="row-actions">
        {task.sprint && task.status !== "done-agent" ? (
          <span className="pill info">{task.sprint}</span>
        ) : task.status === "done-agent" ? (
          <span className="pill info">done-agent</span>
        ) : showCommit ? (
          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={() => onCommit(task.id)}
          >
            → Sprint
          </button>
        ) : (
          <span className="pill">backlog</span>
        )}
      </span>
    </div>
  );
}

function groupSprintBySousLot(rows: Task[], allTasks: Task[]) {
  const order: string[] = [];
  const buckets = new Map<string, Task[]>();
  for (const t of rows) {
    const key = t.souslot ? `${t.project}//${t.lot}//${t.souslot}` : "_none";
    if (!buckets.has(key)) {
      buckets.set(key, []);
      order.push(key);
    }
    buckets.get(key)!.push(t);
  }
  return order.map((key) => {
    const first = buckets.get(key)![0];
    const group =
      key === "_none"
        ? null
        : {
            key,
            project: first.project,
            lot: first.lot,
            souslot: first.souslot,
            tasks: [] as Task[],
          };
    // Toutes les tasks du meme sous-lot, sprintees ou non.
    const kids = group
      ? allTasks.filter(
          (t) =>
            t.project === group.project &&
            t.lot === group.lot &&
            t.souslot === group.souslot
        )
      : [];
    if (group) group.tasks = kids;
    return { key, group, kids, rows: buckets.get(key)! };
  });
}

function Sprint({
  heading,
  empty,
  project,
  tasks,
  allTasks,
  selectedId,
  onSelect,
  showProject = false,
  showOrch = false,
  busy = false,
}: {
  heading: string;
  empty: string;
  project: string;
  tasks: Task[];
  allTasks: Task[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  showProject?: boolean;
  showOrch?: boolean;
  busy?: boolean;
}) {
  const doing = tasks.filter((t) => t.status === "doing").length;
  const groups = groupSprintBySousLot(tasks, allTasks);
  return (
    <section>
      <h2>{heading}</h2>
      <p className="muted">
        {project}
        {showOrch ? " · orchestrateur = un sous-lot Pact (CH)" : ""}
      </p>
      <div className="stats">
        <div className="stat">
          <strong>{tasks.length}</strong>
          <span>items</span>
        </div>
        <div className="stat">
          <strong>{doing}</strong>
          <span>doing</span>
        </div>
      </div>
      {tasks.length === 0 ? (
        <div className="callout">{empty}</div>
      ) : (
        <div className="stack" style={{ gap: 16 }}>
          {groups.map((g) => (
            <div key={g.key} className="list-panel">
              {g.group ? (
                <div className="row feature" style={{ marginBottom: 8 }}>
                  <TypeBadge type="sous-lot" />
                  <strong className="row-title">
                    {g.group.lot} / {g.group.souslot}
                  </strong>
                  {showOrch ? (
                    <span className="row-actions">
                      <OrchLaunchButton
                        group={g.group}
                        kids={g.kids}
                        busy={busy}
                        compact
                      />
                    </span>
                  ) : null}
                </div>
              ) : (
                <p className="muted">Hors sous-lot Pact</p>
              )}
              <table className="table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Type</th>
                    <th>Agent</th>
                    <th>Qui</th>
                    <th>ID</th>
                    {showProject ? <th>Projet</th> : null}
                    <th>Titre</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {g.rows.map((t) => (
                    <tr key={t.id}>
                      <td>{statusGlyph(t.status)}</td>
                      <td>
                        <TypeBadge type={itemType(t)} />
                      </td>
                      <td>
                        <span className="pill agent">{taskAgentType(t)}</span>
                      </td>
                      <td>
                        <span
                          className={`pill ${t.gate === "me" || t.assignee === "me" ? "mine" : "faint"}`}
                          title={
                            t.gate === "me"
                              ? "gate: me — tu dois valider"
                              : t.assignee === "me"
                                ? "assignee: me — à toi de faire"
                                : "agent"
                          }
                        >
                          {t.gate === "me" ? "gate me" : t.assignee || "agent"}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`id ${selectedId === t.id ? "active" : ""}`}
                          onClick={() => onSelect(t.id)}
                        >
                          {t.id}
                        </button>
                      </td>
                      {showProject ? (
                        <td>
                          <span className="faint">{t.project}</span>
                        </td>
                      ) : null}
                      <td>{t.title}</td>
                      <td>
                        <span className="pill">{t.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Detail({
  task,
  allTasks,
  busy,
  confirmDelete,
  setConfirmDelete,
  onCommit,
  onStatus,
  onDelete,
}: {
  task: Task | null;
  allTasks: Task[];
  busy: boolean;
  confirmDelete: boolean;
  setConfirmDelete: (v: boolean) => void;
  onCommit: (id: string) => void;
  onStatus: (status: string) => void;
  onDelete: () => void;
}) {
  if (!task) {
    return (
      <>
        <h2>Détail</h2>
        <p className="muted">Sélectionne une ligne dans le tree.</p>
      </>
    );
  }
  return (
    <WorkItemDetail
      task={task}
      siblings={allTasks.filter(
        (t) =>
          t.id !== task.id &&
          t.project === task.project &&
          t.lot === task.lot &&
          t.souslot === task.souslot
      )}
      busy={busy}
      confirmDelete={confirmDelete}
      setConfirmDelete={setConfirmDelete}
      onCommit={onCommit}
      onStatus={onStatus}
      onDelete={onDelete}
    />
  );
}

function WorkItemDetail({
  task,
  siblings,
  busy,
  confirmDelete,
  setConfirmDelete,
  onCommit,
  onStatus,
  onDelete,
}: {
  task: Task;
  siblings: Task[];
  busy: boolean;
  confirmDelete: boolean;
  setConfirmDelete: (v: boolean) => void;
  onCommit: (id: string) => void;
  onStatus: (status: string) => void;
  onDelete: () => void;
}) {
  const type = itemType(task);
  const agent = taskAgentType(task);
  const [copied, setCopied] = useState(false);
  const [briefShown, setBriefShown] = useState<string | null>(null);
  const onLaunch = async () => {
    const brief = launchBrief(task);
    setBriefShown(brief);
    try {
      await navigator.clipboard.writeText(brief);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="stack detail-task">
      <div className="detail-kicker">
        <TypeBadge type={type} />
        <span className="pill agent">{agent}</span>
        <span className="faint">
          task · type:{type} · agent:{agent} · status:{task.status}
        </span>
      </div>
      <h2>{task.id}</h2>
      <div className="title">{task.title}</div>
      <div className="row">
        <span className="pill">{task.priority}</span>
        <span className="pill">[{task.assignee}]</span>
        <span className="pill">gate:{task.gate}</span>
        {task.sprint ? (
          <span className="pill info">{task.sprint}</span>
        ) : (
          <span className="pill">backlog</span>
        )}
      </div>
      {task.lot ? (
        <div className="faint">
          {task.lot}
          {task.souslot ? ` / ${task.souslot}` : ""}
          {siblings.length > 0 ? ` · ${siblings.length} voisine(s)` : ""}
        </div>
      ) : (
        <div className="faint">hors lot — à rattacher</div>
      )}
      <div className="faint">{task.file}</div>
      {task.blocked_by?.length ? (
        <div className="faint">blocked_by: {task.blocked_by.join(", ")}</div>
      ) : null}

      <button
        type="button"
        className="btn primary"
        disabled={busy}
        onClick={() => void onLaunch()}
      >
        {copied ? "Brief copié" : `Lancer agent ${agent}`}
      </button>
      <div className="faint">
        Copie un brief (@nafura-{agent === "exec" ? "exec" : agent}) — coller
        dans Cursor. Pas de spawn SDK.
      </div>
      {briefShown ? (
        <pre className="launch-brief">{briefShown}</pre>
      ) : null}

      <div className="field">
        <label htmlFor="status">Status</label>
        <select
          id="status"
          value={task.status}
          disabled={busy}
          onChange={(e) => onStatus(e.target.value)}
        >
          {(
            [
              ["todo", "todo"],
              ["doing", "doing"],
              ["blocked", "blocked"],
              ["review", "review · exec fini → spec → QA"],
              ["done-agent", "done-agent (QA sur feature/bug)"],
              ["done-me", "done-me · archive"],
            ] as const
          ).map(([s, label]) => (
            <option key={s} value={s}>
              {label}
            </option>
          ))}
        </select>
        <div className="faint">
          Feature/bug : exec pose review. QA seul pose done-agent. Toi →
          done-me (archive).
        </div>
      </div>

      {!task.sprint ? (
        <button
          type="button"
          className="btn"
          disabled={busy}
          onClick={() => onCommit(task.id)}
        >
          → Sprint
        </button>
      ) : null}

      <DeleteBlock
        id={task.id}
        extra=""
        busy={busy}
        confirmDelete={confirmDelete}
        setConfirmDelete={setConfirmDelete}
        onDelete={onDelete}
      />
    </div>
  );
}

function DeleteBlock({
  id,
  extra,
  busy,
  confirmDelete,
  setConfirmDelete,
  onDelete,
}: {
  id: string;
  extra: string;
  busy: boolean;
  confirmDelete: boolean;
  setConfirmDelete: (v: boolean) => void;
  onDelete: () => void;
}) {
  return (
    <>
      <h3>Abandon</h3>
      <p className="muted">Delete fichier{extra}. Pas de dropped.</p>
      {!confirmDelete ? (
        <button
          type="button"
          className="btn ghost"
          onClick={() => setConfirmDelete(true)}
        >
          Supprimer…
        </button>
      ) : (
        <div className="callout danger stack">
          Confirmer delete {id} ?
          <div className="row">
            <button
              type="button"
              className="btn danger"
              disabled={busy}
              onClick={onDelete}
            >
              Confirmer
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setConfirmDelete(false)}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </>
  );
}
