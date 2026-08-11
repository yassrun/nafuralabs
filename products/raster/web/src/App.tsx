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
  const [filterProject, setFilterProject] = useState("sektor-btp");
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
    if (view === "inbox") return null;
    const t = tasks.find((x) => x.id === selectedId) || null;
    if (!t) return null;
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
    }
    if (v === "sprint") {
      setFilterProject(ALL);
      setSelectedId(null);
    }
    if (v === "backlog" && filterProject === ALL) {
      setFilterProject((prev) =>
        prev === ALL
          ? projects.includes("sektor-btp")
            ? "sektor-btp"
            : projects[0] || "sektor-btp"
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
              view === "sprint" && filterProject === ALL
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
            {view === "sprint" ? (
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
          placeholder="Capture — une ligne, @tag optionnel…"
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
                view === "sprint"
                  ? filterProject
                  : filterProject === ALL
                    ? projects[0] || ""
                    : filterProject
              }
              showAll={view === "sprint"}
              allCount={
                view === "sprint"
                  ? tasks.filter((t) => t.sprint === sprint).length
                  : tasks.length
              }
              counts={Object.fromEntries(
                projects.map((p) => [
                  p,
                  view === "sprint"
                    ? tasks.filter((t) => t.project === p && t.sprint === sprint)
                        .length
                    : tasks.filter((t) => t.project === p).length,
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
              projects={projects}
              busy={busy}
              defaultProject={filterProject}
              onPromote={async (line, project) => {
                setBusy(true);
                try {
                  const r = await api.promote(line, project);
                  setInboxLines(r.lines);
                  setTasks(r.tasks);
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
                  ? projects[0] || "sektor-btp"
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
              project={filterProject === ALL ? "All" : filterProject}
              showProject={filterProject === ALL}
              tasks={tasks.filter(
                (t) =>
                  t.sprint === sprint &&
                  (filterProject === ALL || t.project === filterProject)
              )}
              sprint={sprint}
              selectedId={selectedId}
              onSelect={select}
            />
          ) : null}
        </main>
        <aside className="side">
          {view === "inbox" ? (
            <InboxDetail count={inboxLines.length} />
          ) : (
            <Detail
              task={selected}
              busy={busy}
              confirmDelete={confirmDelete}
              setConfirmDelete={setConfirmDelete}
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

function Inbox({
  lines,
  projects,
  busy,
  defaultProject,
  onPromote,
}: {
  lines: string[];
  projects: string[];
  busy: boolean;
  defaultProject: string;
  onPromote: (line: string, project: string) => void | Promise<void>;
}) {
  const [projectByLine, setProjectByLine] = useState<Record<string, string>>(
    {}
  );

  const projectFor = (line: string) =>
    projectByLine[line] ||
    (projects.includes(defaultProject) ? defaultProject : projects[0] || "");

  return (
    <section>
      <h2>Inbox</h2>
      <p className="muted">
        Globale · {lines.length} ligne(s) · Balayage = promote → task `_backlog`
      </p>
      <div className="faint" style={{ marginBottom: 10 }}>
        raster/inbox.md → products/&lt;projet&gt;/…/epics/_backlog/tasks/
      </div>
      <div className="list-panel">
        {lines.length === 0 ? (
          <div className="empty">Vide — capture en haut</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Ligne</th>
                <th style={{ width: 160 }}>Projet</th>
                <th style={{ width: 120 }} />
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line}>
                  <td>{line}</td>
                  <td>
                    <select
                      value={projectFor(line)}
                      disabled={busy}
                      onChange={(e) =>
                        setProjectByLine((prev) => ({
                          ...prev,
                          [line]: e.target.value,
                        }))
                      }
                    >
                      {projects.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn primary"
                      disabled={busy || !projectFor(line)}
                      title="Créer une task dans le _backlog du projet"
                      onClick={() => void onPromote(line, projectFor(line))}
                    >
                      Promouvoir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

function InboxDetail({ count }: { count: number }) {
  return (
    <div className="stack">
      <h2>Balayage</h2>
      <p className="muted">
        Choisis un projet sur chaque ligne → <strong>Promouvoir</strong>. Ça crée
        une task dans `_backlog/tasks/` (ID auto) et retire la ligne de l’inbox.
      </p>
      <div className="pill info" style={{ alignSelf: "flex-start" }}>
        {count} ligne(s)
      </div>
      <div className="faint">Ensuite : Backlog → Commit sprint</div>
    </div>
  );
}

type ItemType = "feature" | "spec" | "task" | "bug" | "umbrella";

function isBug(t: Task) {
  const tags = t.tags || [];
  if (tags.some((x) => x.toLowerCase() === "bug")) return true;
  if (/-bug-/i.test(t.file || "")) return true;
  if (/^bug\b/i.test(t.title.trim())) return true;
  return false;
}

function itemType(t: Task): Exclude<ItemType, "umbrella"> {
  if (isBug(t)) return "bug";
  if (t.kind === "feature") return "feature";
  if (t.kind === "spec") return "spec";
  return "task";
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
  const features = tasks
    .filter((t) => t.kind === "feature" && !t.parent)
    .sort((a, b) => a.id.localeCompare(b.id));
  const featureIds = new Set(features.map((f) => f.id));
  const bugs = tasks
    .filter((t) => t.kind !== "feature" && isBug(t))
    .sort((a, b) => a.id.localeCompare(b.id));
  const bugIds = new Set(bugs.map((b) => b.id));
  const underFeature = new Set(
    tasks
      .filter(
        (t) =>
          t.parent &&
          featureIds.has(t.parent) &&
          t.kind !== "feature" &&
          !bugIds.has(t.id)
      )
      .map((t) => t.id)
  );
  const triage = tasks
    .filter(
      (t) =>
        t.kind !== "feature" &&
        !bugIds.has(t.id) &&
        !underFeature.has(t.id) &&
        (!t.parent || !featureIds.has(t.parent))
    )
    .sort((a, b) => a.id.localeCompare(b.id));

  return (
    <section>
      <h2>Backlog</h2>
      <p className="muted">
        {project} · features → tasks · parapluie Bugs · Commit →{" "}
        {sprint || "sprint"}
      </p>
      <div className="list-panel backlog-tree">
        {tasks.length === 0 ? (
          <div className="empty">Aucune task pour ce projet</div>
        ) : null}

        {features.map((feat) => {
          const kids = tasks
            .filter(
              (t) =>
                t.parent === feat.id &&
                t.kind !== "feature" &&
                !bugIds.has(t.id)
            )
            .sort((a, b) => a.id.localeCompare(b.id));
          return (
            <div key={feat.id} className="tree-block">
              <div
                className={`row feature ${selectedId === feat.id ? "selected" : ""}`}
              >
                <span className="tree-mark">▾</span>
                <TypeBadge type="feature" />
                <span>{statusGlyph(feat.status)}</span>
                <button
                  type="button"
                  className={`id ${selectedId === feat.id ? "active" : ""}`}
                  onClick={() => onSelect(feat.id)}
                >
                  {feat.id}
                </button>
                <strong className="row-title">
                  {feat.title.replace(/^Feature\s*[—–-]\s*/i, "")}
                </strong>
                <span className="pill">{feat.priority}</span>
                <span className="row-actions">
                  {feat.sprint ? (
                    <span className="pill ok">{feat.sprint}</span>
                  ) : (
                    <button
                      type="button"
                      className="btn primary"
                      disabled={busy}
                      onClick={() => onCommit(feat.id)}
                    >
                      → Sprint
                    </button>
                  )}
                </span>
              </div>
              {kids.length === 0 ? (
                <div className="empty tree-child">
                  Pas d’enfants — découper avant exécution
                </div>
              ) : (
                kids.map((k) => (
                  <BacklogRow
                    key={k.id}
                    task={k}
                    depth={1}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    onCommit={onCommit}
                    busy={busy}
                    showCommit={false}
                  />
                ))
              )}
            </div>
          );
        })}

        <div className="tree-block">
          <div className="row feature umbrella">
            <span className="tree-mark">▾</span>
            <TypeBadge type="umbrella" />
            <strong className="row-title">Bugs</strong>
            <span className="row-actions">
              <span className="pill">{bugs.length}</span>
            </span>
          </div>
          {bugs.length === 0 ? (
            <div className="empty tree-child">Aucun bug tagué</div>
          ) : (
            bugs.map((b) => (
              <BacklogRow
                key={b.id}
                task={b}
                depth={1}
                selectedId={selectedId}
                onSelect={onSelect}
                onCommit={onCommit}
                busy={busy}
                showCommit
                meta={b.parent ? `← ${b.parent}` : undefined}
              />
            ))
          )}
        </div>

        {triage.length > 0 ? (
          <div className="tree-block">
            <div className="row feature umbrella">
              <span className="tree-mark">▾</span>
              <TypeBadge type="umbrella" />
              <strong className="row-title">_backlog</strong>
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
        {task.sprint ? (
          <span className="pill info">{task.sprint}</span>
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
  project,
  tasks,
  sprint,
  selectedId,
  onSelect,
  showProject = false,
}: {
  project: string;
  tasks: Task[];
  sprint: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  showProject?: boolean;
}) {
  const doing = tasks.filter((t) => t.status === "doing").length;
  return (
    <section>
      <h2>
        Sprint {sprint}
      </h2>
      <p className="muted">{project}</p>
      <div className="stats">
        <div className="stat">
          <strong>{tasks.length}</strong>
          <span>committed</span>
        </div>
        <div className="stat">
          <strong>{doing}</strong>
          <span>doing</span>
        </div>
      </div>
      {tasks.length === 0 ? (
        <div className="callout">
          Rien dans {sprint}
          {project === "All" ? "" : ` pour ${project}`} — commit depuis Backlog.
        </div>
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
  busy,
  confirmDelete,
  setConfirmDelete,
  onStatus,
  onDelete,
}: {
  task: Task | null;
  busy: boolean;
  confirmDelete: boolean;
  setConfirmDelete: (v: boolean) => void;
  onStatus: (status: string) => void;
  onDelete: () => void;
}) {
  if (!task) {
    return (
      <>
        <h2>Détail</h2>
        <p className="muted">Sélectionne une task dans le tree.</p>
      </>
    );
  }
  const type = itemType(task);
  return (
    <div className="stack">
      <h2>{task.id}</h2>
      <div className="title">{task.title}</div>
      <div className="row">
        <TypeBadge type={type} />
        <span className="pill">{task.priority}</span>
        <span className="pill">[{task.assignee}]</span>
        <span className="pill">gate:{task.gate}</span>
        {task.sprint ? (
          <span className="pill info">{task.sprint}</span>
        ) : (
          <span className="pill">backlog</span>
        )}
      </div>
      <div className="faint">{task.file}</div>

      <div className="field">
        <label htmlFor="status">Status</label>
        <select
          id="status"
          value={task.status}
          disabled={busy}
          onChange={(e) => onStatus(e.target.value)}
        >
          {["todo", "doing", "blocked", "review", "done"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <h3>Abandon</h3>
      <p className="muted">
        Delete fichier{task.kind === "feature" ? " + enfants" : ""}. Pas de
        dropped.
      </p>
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
          Confirmer delete {task.id} ?
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
    </div>
  );
}
