import { useCallback, useEffect, useMemo, useState } from "react";
import { api, statusGlyph, type Task, type ViewId } from "./api";

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
          placeholder="Task draft — description, @bug @physical optionnel…"
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
                  ? tasks.filter((t) => isSprintRow(t, sprint)).length
                  : view === "done-agent"
                    ? tasks.filter(isDoneAgentRow).length
                    : tasks.filter((t) => isWorkTask(t) && t.status !== "done-agent").length
              }
              counts={Object.fromEntries(
                projects.map((p) => [
                  p,
                  view === "sprint"
                    ? tasks.filter(
                        (t) => t.project === p && isSprintRow(t, sprint)
                      ).length
                    : view === "done-agent"
                      ? tasks.filter(
                          (t) => t.project === p && isDoneAgentRow(t)
                        ).length
                      : tasks.filter(
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
              tasks={tasks.filter((t) =>
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
              tasks={tasks.filter(
                (t) =>
                  isSprintRow(t, sprint) &&
                  (filterProject === ALL || t.project === filterProject)
              )}
              selectedId={selectedId}
              onSelect={select}
            />
          ) : null}
          {view === "done-agent" ? (
            <Sprint
              heading="Done agent"
              empty="Aucune task done-agent — l’agent passe le status ici après la vérif."
              project={filterProject === ALL ? "All" : filterProject}
              showProject={filterProject === ALL}
              tasks={tasks.filter(
                (t) =>
                  isDoneAgentRow(t) &&
                  (filterProject === ALL || t.project === filterProject)
              )}
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
              onSelect={select}
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

function draftTypeFromLine(line: string): "bug" | "feature" | "physical" | "spec" {
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

  const parentsFor = (line: string) => {
    const proj = projectFor(line);
    const inProj = tasks.filter((t) => t.project === proj);
    const sousLots = inProj.filter(
      (t) => t.kind === "sous-lot" || t.kind === "feature"
    );
    const lots = inProj.filter((t) => t.kind === "lot");
    const lotsWithSous = new Set(
      sousLots.map((s) => s.parent).filter(Boolean)
    );
    const flatLots = lots.filter((l) => !lotsWithSous.has(l.id));
    return [...sousLots, ...flatLots].sort((a, b) =>
      a.id.localeCompare(b.id)
    );
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
        <code>raster-src/lots/…/tasks/</code> (parent lot plat ou sous-lot).
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
                  {parents.map((f) => (
                    <option key={f.id} value={f.id}>
                      {isLot(f.kind) ? "lot" : "sous-lot"} · {f.id}
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

type ItemType = "lot" | "sous-lot" | "spec" | "feature" | "bug" | "physical";

function isBug(t: Task) {
  if ((t.type || "").toLowerCase() === "bug") return true;
  if (t.kind === "bug") return true;
  const tags = t.tags || [];
  if (tags.some((x) => x.toLowerCase() === "bug")) return true;
  if (/-bug-/i.test(t.file || "")) return true;
  if (/^bug\b/i.test(t.title.trim())) return true;
  return false;
}

function isLot(kind: string) {
  return kind === "lot";
}

function isSousLot(kind: string) {
  return kind === "sous-lot" || kind === "feature";
}

function isHat(kind: string) {
  return isLot(kind) || isSousLot(kind);
}

function isWorkTask(t: Task) {
  if (isHat(t.kind)) return false;
  if (t.kind === "spec" || t.kind === "bug-umbrella") return false;
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

function workType(t: Task): "bug" | "feature" | "physical" | "spec" {
  const ty = (t.type || "").toLowerCase();
  if (ty === "bug" || ty === "feature" || ty === "physical" || ty === "spec")
    return ty;
  if (isBug(t)) return "bug";
  const tags = t.tags || [];
  if (tags.some((x) => x.toLowerCase() === "physical")) return "physical";
  if (tags.some((x) => x.toLowerCase() === "spec")) return "spec";
  return "feature";
}

function hatHasWork(hat: Task, all: Task[]): boolean {
  const kids = all.filter((t) => t.parent === hat.id);
  if (kids.some(isWorkTask)) return true;
  if (isLot(hat.kind)) {
    return kids
      .filter((k) => isSousLot(k.kind))
      .some((sl) => hatHasWork(sl, all));
  }
  return false;
}

function itemType(t: Task): ItemType {
  if (isLot(t.kind)) return "lot";
  if (isSousLot(t.kind)) return "sous-lot";
  if (t.kind === "spec") return "spec";
  return workType(t);
}

function TypeBadge({ type }: { type: ItemType }) {
  return <span className={`type type-${type}`}>{type}</span>;
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
  const lots = tasks
    .filter((t) => isLot(t.kind) && hatHasWork(t, tasks))
    .sort((a, b) => a.id.localeCompare(b.id));
  const lotIds = new Set(
    tasks.filter((t) => isLot(t.kind)).map((l) => l.id)
  );
  const sousLots = tasks
    .filter((t) => isSousLot(t.kind) && hatHasWork(t, tasks))
    .sort((a, b) => a.id.localeCompare(b.id));
  const sousLotIds = new Set(
    tasks.filter((t) => isSousLot(t.kind)).map((s) => s.id)
  );
  const underSousLot = new Set(
    tasks
      .filter((t) => t.parent && sousLotIds.has(t.parent) && isWorkTask(t))
      .map((t) => t.id)
  );
  const underLot = new Set(
    tasks
      .filter((t) => t.parent && lotIds.has(t.parent) && isWorkTask(t))
      .map((t) => t.id)
  );
  const orphanSousLots = sousLots.filter(
    (s) => !s.parent || !lotIds.has(s.parent)
  );
  const triage = tasks
    .filter(
      (t) =>
        isWorkTask(t) && !underSousLot.has(t.id) && !underLot.has(t.id)
    )
    .sort((a, b) => a.id.localeCompare(b.id));

  const renderSousLot = (sl: Task, depth: number) => {
    const kids = tasks
      .filter((t) => t.parent === sl.id && isWorkTask(t))
      .sort((a, b) => a.id.localeCompare(b.id));
    if (kids.length === 0) return null;
    return (
      <div key={sl.id} className={depth === 0 ? "tree-block" : undefined}>
        <div
          className={`row feature ${selectedId === sl.id ? "selected" : ""}`}
          style={depth ? { paddingLeft: 8 + depth * 16 } : undefined}
        >
          <span className="tree-mark">▾</span>
          <TypeBadge type="sous-lot" />
          <span>{statusGlyph(sl.status)}</span>
          <button
            type="button"
            className={`id ${selectedId === sl.id ? "active" : ""}`}
            onClick={() => onSelect(sl.id)}
          >
            {sl.id}
          </button>
          <strong className="row-title">
            {sl.title.replace(/^(Feature|Sous-lot|Lot)\s*[—–-]\s*/i, "")}
          </strong>
          <span className="pill">{kids.length} task(s)</span>
        </div>
        {kids.map((k) => (
          <BacklogRow
            key={k.id}
            task={k}
            depth={depth + 1}
            selectedId={selectedId}
            onSelect={onSelect}
            onCommit={onCommit}
            busy={busy}
            showCommit={!k.sprint}
          />
        ))}
      </div>
    );
  };

  const liveTasks = tasks.filter(isWorkTask);

  return (
    <section>
      <h2>Backlog</h2>
      <p className="muted">
        {project} · arbre via <code>parent:</code> · tasks seulement (
        spec / feature / bug / physical) · Commit = <code>sprint:</code> sur la task →{" "}
        {sprint || "sprint"}
      </p>
      <div className="list-panel backlog-tree">
        {liveTasks.length === 0 ? (
          <div className="empty">Aucune task — lots vides = inbox / draft</div>
        ) : null}

        {lots.map((lot) => {
          const sls = sousLots.filter((s) => s.parent === lot.id);
          const direct = tasks
            .filter((t) => t.parent === lot.id && isWorkTask(t))
            .sort((a, b) => a.id.localeCompare(b.id));
          if (sls.length === 0 && direct.length === 0) return null;
          return (
            <div key={lot.id} className="tree-block">
              <div
                className={`row feature umbrella ${selectedId === lot.id ? "selected" : ""}`}
              >
                <span className="tree-mark">▾</span>
                <TypeBadge type="lot" />
                <span>{statusGlyph(lot.status)}</span>
                <button
                  type="button"
                  className={`id ${selectedId === lot.id ? "active" : ""}`}
                  onClick={() => onSelect(lot.id)}
                >
                  {lot.id}
                </button>
                <strong className="row-title">
                  {lot.title.replace(/^Lot\s*[—–-]\s*/i, "")}
                </strong>
                {sls.length > 0 ? (
                  <span className="pill">{sls.length} sous-lot(s)</span>
                ) : (
                  <span className="pill">{direct.length} task(s)</span>
                )}
              </div>
              {sls.map((sl) => renderSousLot(sl, 1))}
              {direct.map((k) => (
                <BacklogRow
                  key={k.id}
                  task={k}
                  depth={1}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  onCommit={onCommit}
                  busy={busy}
                  showCommit={!k.sprint}
                />
              ))}
            </div>
          );
        })}

        {orphanSousLots.length > 0
          ? orphanSousLots.map((sl) => renderSousLot(sl, 0))
          : null}

        {triage.length > 0 ? (
          <div className="tree-block">
            <div className="row feature umbrella">
              <span className="tree-mark">▾</span>
              <strong className="row-title">Hors CBS</strong>
              <span className="pill">inbox à rattacher</span>
              <span className="row-actions">
                <span className="pill">{triage.length}</span>
              </span>
            </div>
            {triage.map((o) => (
              <BacklogRow
                key={o.id}
                task={o}
                depth={1}
                selectedId={selectedId}
                onSelect={onSelect}
                onCommit={onCommit}
                busy={busy}
                showCommit
              />
            ))}
          </div>
        ) : null}
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

function Sprint({
  heading,
  empty,
  project,
  tasks,
  selectedId,
  onSelect,
  showProject = false,
}: {
  heading: string;
  empty: string;
  project: string;
  tasks: Task[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  showProject?: boolean;
}) {
  const doing = tasks.filter((t) => t.status === "doing").length;
  return (
    <section>
      <h2>{heading}</h2>
      <p className="muted">{project}</p>
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
        <div className="list-panel">
          <table className="table">
            <thead>
              <tr>
                <th></th>
                <th>Type</th>
                <th>ID</th>
                {showProject ? <th>Projet</th> : null}
                <th>Titre</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id}>
                  <td>{statusGlyph(t.status)}</td>
                  <td>
                    <TypeBadge type={itemType(t)} />
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
  onSelect,
  onCommit,
  onStatus,
  onDelete,
}: {
  task: Task | null;
  allTasks: Task[];
  busy: boolean;
  confirmDelete: boolean;
  setConfirmDelete: (v: boolean) => void;
  onSelect: (id: string) => void;
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
  if (isHat(task.kind)) {
    return (
      <UmbrellaDetail
        task={task}
        childrenTasks={allTasks
          .filter((t) => t.parent === task.id)
          .sort((a, b) => a.id.localeCompare(b.id))}
        allTasks={allTasks}
        busy={busy}
        confirmDelete={confirmDelete}
        setConfirmDelete={setConfirmDelete}
        onSelect={onSelect}
        onDelete={onDelete}
      />
    );
  }
  return (
    <WorkItemDetail
      task={task}
      parent={allTasks.find((t) => t.id === task.parent) || null}
      busy={busy}
      confirmDelete={confirmDelete}
      setConfirmDelete={setConfirmDelete}
      onSelect={onSelect}
      onCommit={onCommit}
      onStatus={onStatus}
      onDelete={onDelete}
    />
  );
}

function UmbrellaDetail({
  task,
  childrenTasks,
  allTasks,
  busy,
  confirmDelete,
  setConfirmDelete,
  onSelect,
  onDelete,
}: {
  task: Task;
  childrenTasks: Task[];
  allTasks: Task[];
  busy: boolean;
  confirmDelete: boolean;
  setConfirmDelete: (v: boolean) => void;
  onSelect: (id: string) => void;
  onDelete: () => void;
}) {
  const type = itemType(task);
  const asLot = isLot(task.kind);
  const sousKids = childrenTasks.filter((t) => isSousLot(t.kind));
  const taskKids = childrenTasks.filter(isWorkTask);
  const mixedLot = asLot && sousKids.length > 0;
  const childLabel = mixedLot ? "Sous-lots" : "Tasks";
  const doing = taskKids.filter((t) => t.status === "doing").length;
  const blocked = taskKids.filter((t) => t.status === "blocked").length;
  const listedCount = mixedLot ? sousKids.length : taskKids.length;
  const isDraft = !hatHasWork(task, allTasks);
  const inSprint = taskKids.filter((t) => Boolean(t.sprint)).length;
  return (
    <div className="stack detail-feature">
      <div className="detail-kicker">
        <TypeBadge type={type} />
        <span className="faint">
          {isDraft
            ? "chapeau vide · hors inbox · hors backlog"
            : "chapeau · pas sprintable · sprint = champ sur les tasks"}
        </span>
      </div>
      <h2>{task.id}</h2>
      <div className="title">
        {task.title.replace(/^(Feature|Sous-lot|Lot|Bugs?)\s*[—–-]\s*/i, "")}
      </div>
      <div className="row">
        <span className="pill">{task.priority}</span>
        {isDraft ? (
          <span className="pill warn">draft</span>
        ) : (
          <span className="pill">structure</span>
        )}
      </div>
      <div className="faint">{task.file}</div>

      <div className="stats compact">
        <div className="stat">
          <strong>{listedCount}</strong>
          <span>{childLabel.toLowerCase()}</span>
        </div>
        <div className="stat">
          <strong>{doing}</strong>
          <span>doing</span>
        </div>
        <div className="stat">
          <strong>{blocked}</strong>
          <span>blocked</span>
        </div>
        <div className="stat">
          <strong>{inSprint}</strong>
          <span>en sprint</span>
        </div>
      </div>

      <h3>{childLabel}</h3>
      {isDraft ? (
        <div className="callout">
          Pas de task — hors inbox (inbox = raster/inbox.md seulement) et hors
          backlog.
          seulement (feature / bug / physical).
        </div>
      ) : (
        <ul className="child-list">
          {childrenTasks.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="child-hit"
                onClick={() => onSelect(c.id)}
              >
                <span>{statusGlyph(c.status)}</span>
                <span className="id">{c.id}</span>
                <span className="child-title">{c.title}</span>
                <span className="pill">{c.status}</span>
                {c.sprint ? (
                  <span className="pill info">{c.sprint}</span>
                ) : isWorkTask(c) ? (
                  <span className="pill">backlog</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}

      <DeleteBlock
        id={task.id}
        extra=" + enfants"
        busy={busy}
        confirmDelete={confirmDelete}
        setConfirmDelete={setConfirmDelete}
        onDelete={onDelete}
      />
    </div>
  );
}

function WorkItemDetail({
  task,
  parent,
  busy,
  confirmDelete,
  setConfirmDelete,
  onSelect,
  onCommit,
  onStatus,
  onDelete,
}: {
  task: Task;
  parent: Task | null;
  busy: boolean;
  confirmDelete: boolean;
  setConfirmDelete: (v: boolean) => void;
  onSelect: (id: string) => void;
  onCommit: (id: string) => void;
  onStatus: (status: string) => void;
  onDelete: () => void;
}) {
  const type = itemType(task);
  return (
    <div className="stack detail-task">
      <div className="detail-kicker">
        <TypeBadge type={type} />
        <span className="faint">
          task · type:{type} · status:{task.status}
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
      {parent ? (
        <button
          type="button"
          className="btn ghost parent-link"
          onClick={() => onSelect(parent.id)}
        >
          parent · {parent.id} · {itemType(parent)}
        </button>
      ) : (
        <div className="faint">task directe · hors CBS (OK jusqu’au rattachement)</div>
      )}
      {task.feature ? (
        <div className="faint">feature: {task.feature}</div>
      ) : null}
      <div className="faint">{task.file}</div>

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
              ["review", "review · QA"],
              ["done-agent", "done-agent"],
              ["done-me", "done-me · archive"],
            ] as const
          ).map(([s, label]) => (
            <option key={s} value={s}>
              {label}
            </option>
          ))}
        </select>
        <div className="faint">
          Agent → done-agent (vue Done agent). Toi → done-me (archive).
        </div>
      </div>

      {!task.sprint ? (
        <button
          type="button"
          className="btn primary"
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
