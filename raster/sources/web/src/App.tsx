import { useCallback, useEffect, useMemo, useState } from "react";
import {
  api,
  demande,
  launchBrief,
  orchLaunchBrief,
  statusGlyph,
  taskAgentType,
  type AgentFilter,
  type Lance,
  type Ready,
  type Task,
  type ViewId,
} from "./api";

const ALL = "all";

/** `done-me` n'est PAS ici : il ne se pose pas, il s'approuve (AGENTS.md §0.1-8). */
const STATUS_CHOICES: Array<[string, string]> = [
  ["todo", "todo"],
  ["doing", "doing"],
  ["blocked", "blocked · attend l'extérieur"],
  ["review", "review · exec fini → spec → QA"],
  ["done-agent", "done-agent (QA sur feature/bug)"],
];

export default function App() {
  const [view, setView] = useState<ViewId>("toi");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ready, setReady] = useState<Ready[]>([]);
  const [inboxLines, setInboxLines] = useState<string[]>([]);
  const [running, setRunning] = useState<Lance[]>([]);
  const [recent, setRecent] = useState<Lance[]>([]);
  const [spawnPret, setSpawnPret] = useState(false);
  const [projects, setProjects] = useState<string[]>([]);
  const [sprint, setSprint] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [filterProject, setFilterProject] = useState("");
  const [agentFilter, setAgentFilter] = useState<AgentFilter>("all");
  const [draft, setDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const [meta, t, r, i, run] = await Promise.all([
      api.meta(),
      api.tasks(),
      api.ready(),
      api.inbox(),
      api.running(),
    ]);
    setSprint(meta.sprint);
    setProjects(meta.projects);
    setTasks(t.tasks);
    setReady(r.ready);
    setInboxLines(i.lines);
    setRunning(run.running);
    setRecent(run.recent);
    setSpawnPret(run.spawnPret);
    setFilterProject((prev) =>
      prev === ALL || meta.projects.includes(prev)
        ? prev
        : projetPorteur(meta.projects, t.tasks)
    );
  }, []);

  useEffect(() => {
    refresh()
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [refresh]);

  /**
   * Un agent qui tourne produit de la sortie en continu ; rien ne nous la pousse.
   * On sonde uniquement tant qu'un lot est tenu — sinon l'app resterait bruyante
   * pour rien.
   */
  useEffect(() => {
    if (running.length === 0) return;
    const h = window.setInterval(() => {
      api
        .running()
        .then((r) => {
          setRunning(r.running);
          setRecent(r.recent);
        })
        .catch(() => {});
    }, 2000);
    return () => window.clearInterval(h);
  }, [running.length]);

  /** Toute mutation renvoie l'état complet — pas de re-fetch en cascade. */
  const applyMutation = (m: { tasks: Task[]; ready: Ready[]; lines: string[] }) => {
    setTasks(m.tasks);
    setReady(m.ready);
    setInboxLines(m.lines);
  };

  const mutate = async <T extends { tasks: Task[]; ready: Ready[]; lines: string[] }>(
    run: () => Promise<T>,
    then?: (r: T) => void
  ) => {
    setBusy(true);
    setError(null);
    try {
      const r = await run();
      applyMutation(r);
      then?.(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  /** La file d'attente : trié par ancienneté n'a pas de sens sans horodatage —
   *  à défaut, par id croissant, qui est l'ordre de création. */
  const enAttente = useMemo(
    () => tasks.filter((t) => t.attend).sort((a, b) => idNum(a.id) - idNum(b.id)),
    [tasks]
  );

  const scopedTasks = useMemo(
    () =>
      agentFilter === "all"
        ? tasks
        : tasks.filter((t) => taskAgentType(t) === agentFilter),
    [tasks, agentFilter]
  );

  const selected = useMemo(() => {
    const t = tasks.find((x) => x.id === selectedId) || null;
    if (!t || view === "inbox") return null;
    if (view !== "toi" && filterProject !== ALL && t.project !== filterProject) {
      return null;
    }
    return t;
  }, [tasks, selectedId, filterProject, view]);

  const readyByKey = useMemo(() => {
    const m = new Map<string, Ready>();
    for (const r of ready) m.set(r.key, r);
    return m;
  }, [ready]);

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
      setFilterProject(projetPorteur(projects, tasks));
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

  const projectOf = (t: Task) => t.project;
  const visible = (t: Task) =>
    filterProject === ALL || projectOf(t) === filterProject;

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
              ["toi", "Toi", enAttente.length],
              ["encours", "En cours", running.length],
              ["inbox", "Inbox", inboxLines.length],
              ["backlog", "Backlog", 0],
              ["sprint", "Sprint", 0],
              ["done-agent", "Done agent", 0],
            ] as const
          ).map(([id, label, n]) => (
            <button
              key={id}
              type="button"
              className={view === id ? "active" : ""}
              onClick={() => setViewSafe(id as ViewId)}
            >
              {label}
              {n > 0 ? <span className="nav-n">{n}</span> : null}
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
                .catch((e) => setError(e instanceof Error ? e.message : String(e)))
                .finally(() => setBusy(false));
            }}
          >
            {busy ? "Sync…" : "Synchro"}
          </button>
        </nav>
      </header>

      <div className="capture">
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
        {view !== "inbox" && view !== "toi" && view !== "encours" ? (
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
            : view === "toi"
              ? "ce qui attend une décision"
              : view === "encours"
                ? spawnPret
                  ? "RASTER_AGENT_CMD posée — le lancement est réel"
                  : "RASTER_AGENT_CMD absente — le lancement refusera"
              : `filtre · ${filterProject === ALL ? "All" : filterProject}`}
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
          {view !== "inbox" && view !== "toi" && view !== "encours" ? (
            <ProjectTabs
              projects={projects}
              active={filterProject}
              showAll={view === "sprint" || view === "done-agent"}
              counts={Object.fromEntries(
                projects.map((p) => [p, scopedTasks.filter((t) => t.project === p).length])
              )}
              allCount={scopedTasks.length}
              onSelect={(p) => {
                setFilterProject(p);
                setSelectedId(null);
                setConfirmDelete(false);
              }}
            />
          ) : null}

          {view === "toi" ? (
            <ToiView
              rows={enAttente}
              selectedId={selectedId}
              onSelect={select}
              total={tasks.length}
              onBacklog={() => setViewSafe("backlog")}
            />
          ) : null}

          {view === "encours" ? (
            <EnCoursView
              running={running}
              recent={recent}
              spawnPret={spawnPret}
              busy={busy}
              onStop={(p, l) => {
                setBusy(true);
                api
                  .stopRun(p, l)
                  .then((r) => setRunning(r.running))
                  .catch((e) => setError(e instanceof Error ? e.message : String(e)))
                  .finally(() => setBusy(false));
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
              defaultProject={
                filterProject === ALL ? projetPorteur(projects, tasks) : filterProject
              }
              onSelectLine={setSelectedLine}
              onPromote={(line, project, parent) =>
                void mutate(
                  () => api.promote(line, project, parent),
                  (r) => {
                    setSelectedLine(null);
                    setFilterProject(project);
                    setSelectedId(r.id);
                    setViewSafe("backlog");
                  }
                )
              }
            />
          ) : null}

          {view === "backlog" ? (
            <Backlog
              project={
                filterProject === ALL ? projetPorteur(projects, tasks) : filterProject
              }
              tasks={scopedTasks.filter(visible)}
              readyByKey={readyByKey}
              sprint={sprint}
              selectedId={selectedId}
              onSelect={select}
              onCommit={(id) => void mutate(() => api.commitSprint(id))}
              busy={busy}
              spawnPret={spawnPret}
              onLance={setRunning}
            />
          ) : null}

          {view === "sprint" ? (
            <Rows
              heading={`Sprint ${sprint}`}
              empty={`Rien dans ${sprint} — commit depuis Backlog.`}
              tasks={scopedTasks.filter(
                (t) => isSprintRow(t, sprint) && visible(t)
              )}
              allTasks={tasks}
              selectedId={selectedId}
              onSelect={select}
              showProject={filterProject === ALL}
              showOrch
              busy={busy}
            />
          ) : null}

          {view === "done-agent" ? (
            <Rows
              heading="Done agent"
              empty="Aucune task done-agent — l'agent passe le status ici après la vérif."
              tasks={scopedTasks.filter((t) => t.status === "done-agent" && visible(t))}
              allTasks={tasks}
              selectedId={selectedId}
              onSelect={select}
              showProject={filterProject === ALL}
            />
          ) : null}
        </main>

        <aside className="side">
          {view === "inbox" ? (
            <InboxDetail count={inboxLines.length} line={selectedLine} />
          ) : (
            <Detail
              task={selected}
              allTasks={tasks}
              readyByKey={readyByKey}
              busy={busy}
              confirmDelete={confirmDelete}
              setConfirmDelete={setConfirmDelete}
              onCommit={(id) => void mutate(() => api.commitSprint(id))}
              onStatus={(s) =>
                selected && void mutate(() => api.patchTask(selected.id, { status: s }))
              }
              onApprove={() =>
                selected &&
                void mutate(() => api.approve(selected.id), () => setSelectedId(null))
              }
              onDelete={() =>
                selected &&
                void mutate(() => api.deleteTask(selected.id), () => {
                  setSelectedId(null);
                  setConfirmDelete(false);
                })
              }
            />
          )}
        </aside>
      </div>
    </div>
  );
}

/**
 * Le projet à ouvrir par défaut : **celui qui porte du travail**.
 *
 * Le socle ne connaît le nom d'aucun projet — en coder un en dur l'a fait
 * s'ouvrir sur `raster` vide alors que `nafura-platform` en portait 39.
 * Tous vides : le premier, plutôt que rien.
 */
export function projetPorteur(projects: string[], tasks: Task[]): string {
  const n = new Map<string, number>();
  for (const t of tasks) n.set(t.project, (n.get(t.project) || 0) + 1);
  const porteur = projects.find((p) => (n.get(p) || 0) > 0);
  return porteur || projects[0] || "";
}

function idNum(id: string) {
  const m = id.match(/-(\d+)$/);
  return m ? Number(m[1]) : 0;
}

function isSprintRow(t: Task, week: string) {
  return t.sprint === week && t.status !== "done-agent";
}

/* ---------------------------------------------------------------- vue Toi */

/**
 * La seule vue qui compte en mode autonome : ce qui attend une décision.
 * Elle passe avant Backlog et Sprint — tu n'ouvres plus l'app pour piloter.
 */
function ToiView({
  rows,
  selectedId,
  onSelect,
  total = 0,
  onBacklog,
}: {
  rows: Task[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  total?: number;
  onBacklog?: () => void;
}) {
  if (rows.length === 0) {
    return (
      <section>
        <h2>Toi</h2>
        <div className="callout stack">
          <div>
            Rien ne t'attend. Les agents avancent ou la fenêtre est fermée — dans
            les deux cas tu n'as rien à faire.
          </div>
          {/* Sans ça, un backlog plein derrière un « Toi » vide donne une app morte. */}
          {total > 0 ? (
            <div className="row">
              <span className="faint">
                {total} task(s) ouvertes ailleurs.
              </span>
              <button type="button" className="btn" onClick={onBacklog}>
                Voir le backlog
              </button>
            </div>
          ) : null}
        </div>
      </section>
    );
  }
  return (
    <section>
      <h2>Toi — {rows.length} en attente</h2>
      <p className="muted">
        Par ordre de création : ce qui attend depuis longtemps bloque des agents.
      </p>
      <div className="list-panel">
        {rows.map((t) => (
          <div
            key={t.id}
            className={`row attente ${selectedId === t.id ? "selected" : ""}`}
            onClick={() => onSelect(t.id)}
          >
            <span className={`att-mark att-${t.status === "blocked" ? "ext" : t.status === "done-agent" ? "ok" : "q"}`}>
              {t.status === "blocked" ? "✕" : t.status === "done-agent" ? "◆" : "?"}
            </span>
            <button
              type="button"
              className={`id ${selectedId === t.id ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(t.id);
              }}
            >
              {t.id}
            </button>
            <span className="row-title">{demande(t)} — {t.title}</span>
            <span className="faint">{[t.lot, t.souslot].filter(Boolean).join(" / ")}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------- ce qui tourne */

/**
 * Le dernier constat de la revue : l'app n'avait aucune notion d'exécution.
 * L'état vient du serveur et n'est jamais écrit sur disque — un processus mort
 * ne doit pas laisser un `doing` menteur dans une task.
 */
function EnCoursView({
  running,
  recent,
  spawnPret,
  busy,
  onStop,
}: {
  running: Lance[];
  recent: Lance[];
  spawnPret: boolean;
  busy: boolean;
  onStop: (project: string, lot: string) => void;
}) {
  return (
    <section>
      <h2>En cours — {running.length} lot(s) tenu(s)</h2>
      {!spawnPret ? (
        <div className="callout danger">
          <strong>Aucune commande d'agent configurée.</strong> Poser{" "}
          <code>RASTER_AGENT_CMD</code> dans l'environnement local avant de lancer
          le serveur. Raster ne stocke ni commande ni clé — le CADRE dit « le
          dépôt suffit à lire, pas à exécuter ».
        </div>
      ) : null}

      {running.length === 0 ? (
        <div className="callout">
          Rien ne tourne. Un lot se lance depuis le Backlog, sur un sous-lot
          lançable.
        </div>
      ) : (
        <div className="stack" style={{ gap: 12 }}>
          {running.map((r) => (
            <div key={`${r.project}//${r.lot}`} className="list-panel">
              <div className="row feature">
                <span className="att-mark att-q">▸</span>
                <strong className="row-title">
                  {r.project} / {r.lot}
                </strong>
                <span className="pill info">{r.branch}</span>
                <span className="faint">pid {r.pid}</span>
                <span className="row-actions">
                  <button
                    type="button"
                    className="btn danger"
                    disabled={busy}
                    onClick={() => onStop(r.project, r.lot)}
                  >
                    Arrêter
                  </button>
                </span>
              </div>
              <div className="faint" style={{ padding: "0 8px 6px" }}>
                {r.cwd}
              </div>
              <pre className="launch-brief">
                {r.sortie.length ? r.sortie.join("\n") : "(pas encore de sortie)"}
              </pre>
            </div>
          ))}
        </div>
      )}

      {recent.length ? (
        <details className="fold" style={{ marginTop: 16 }}>
          <summary>Derniers lots terminés</summary>
          <div className="stack" style={{ gap: 8, paddingTop: 8 }}>
            {recent
              .slice()
              .reverse()
              .map((r, i) => (
                <div key={`${r.lot}-${i}`} className="row">
                  <span className={`pill ${r.etat === "fini" ? "ok" : "warn"}`}>
                    {r.etat}
                  </span>
                  <span className="row-title">
                    {r.project} / {r.lot}
                  </span>
                  <span className="faint">{r.branch}</span>
                </div>
              ))}
          </div>
        </details>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------- le détail */

function Detail({
  task,
  allTasks,
  readyByKey,
  busy,
  confirmDelete,
  setConfirmDelete,
  onCommit,
  onStatus,
  onApprove,
  onDelete,
}: {
  task: Task | null;
  allTasks: Task[];
  readyByKey: Map<string, Ready>;
  busy: boolean;
  confirmDelete: boolean;
  setConfirmDelete: (v: boolean) => void;
  onCommit: (id: string) => void;
  onStatus: (status: string) => void;
  onApprove: () => void;
  onDelete: () => void;
}) {
  if (!task) {
    return (
      <>
        <h2>Détail</h2>
        <p className="muted">Sélectionne une ligne.</p>
      </>
    );
  }
  const agent = taskAgentType(task);
  const r = readyByKey.get(`${task.project}//${task.lot}//${task.souslot}`);
  const siblings = allTasks.filter(
    (t) =>
      t.id !== task.id &&
      t.project === task.project &&
      t.lot === task.lot &&
      t.souslot === task.souslot
  );

  return (
    <div className="stack detail-task">
      {task.attend ? (
        <div className="bandeau">
          <strong>Ta décision</strong>
          <span className="faint">
            {task.id} · {[task.lot, task.souslot].filter(Boolean).join(" / ")}
          </span>
        </div>
      ) : (
        <div className="detail-kicker">
          <span className={`type type-${task.type}`}>{task.type}</span>
          <span className="pill agent">{agent}</span>
          <span className="faint">status:{task.status}</span>
        </div>
      )}

      <div className="title">{task.title}</div>

      {task.question ? (
        <div className="callout question">
          <div className="q-head">Question</div>
          <pre className="q-body">{task.question}</pre>
        </div>
      ) : null}

      {task.attend ? (
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          {task.status === "done-agent" && task.gate === "me" ? (
            <button
              type="button"
              className="btn primary"
              disabled={busy}
              onClick={onApprove}
            >
              Approuver → done-me
            </button>
          ) : null}
          {task.status === "done-agent" ? (
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() => onStatus("review")}
            >
              Renvoyer à l'agent
            </button>
          ) : null}
          {task.status === "blocked" ? (
            <button
              type="button"
              className="btn primary"
              disabled={busy}
              onClick={() => onStatus("todo")}
            >
              Débloquer
            </button>
          ) : null}
        </div>
      ) : null}

      {task.rapport ? (
        <details className="fold" open={task.attend}>
          <summary>Rapport de livraison — ce qui a été décidé sans toi</summary>
          <pre className="q-body">{task.rapport}</pre>
        </details>
      ) : null}

      <details className="fold">
        <summary>Identité · fichier · readiness</summary>
        <div className="stack" style={{ gap: 6, paddingTop: 8 }}>
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
          {r ? (
            <div className="faint">
              sous-lot {r.lancable ? "▸ lançable" : `✕ ${r.raisons.join(" · ")}`}
              {siblings.length > 0 ? ` · ${siblings.length} voisine(s)` : ""}
            </div>
          ) : null}
          {task.blocked_by.length ? (
            <div className="faint">blocked_by: {task.blocked_by.join(", ")}</div>
          ) : null}
          <div className="faint">{task.file}</div>
          <LaunchButton task={task} busy={busy} />
        </div>
      </details>

      <div className="field">
        <label htmlFor="status">Status</label>
        <select
          id="status"
          value={STATUS_CHOICES.some(([s]) => s === task.status) ? task.status : "todo"}
          disabled={busy}
          onChange={(e) => onStatus(e.target.value)}
        >
          {STATUS_CHOICES.map(([s, label]) => (
            <option key={s} value={s}>
              {label}
            </option>
          ))}
        </select>
        <div className="faint">
          <code>done-me</code> n'est pas ici : il s'obtient par « Approuver », et
          seulement sur un <code>done-agent</code> sous <code>gate: me</code>.
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

      <details className="fold">
        <summary>Abandon</summary>
        <div className="stack" style={{ gap: 8, paddingTop: 8 }}>
          <p className="muted">Delete fichier. Pas de dropped.</p>
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
                <button type="button" className="btn danger" disabled={busy} onClick={onDelete}>
                  Confirmer
                </button>
                <button type="button" className="btn" onClick={() => setConfirmDelete(false)}>
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}

function LaunchButton({ task, busy }: { task: Task; busy: boolean }) {
  const [copied, setCopied] = useState(false);
  const agent = taskAgentType(task);
  return (
    <button
      type="button"
      className="btn compact"
      disabled={busy}
      title="Copie un brief pour l'agent — le spawn n'existe pas encore"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(launchBrief(task));
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? "Brief copié" : `Brief agent ${agent}`}
    </button>
  );
}

/* ------------------------------------------------------------- le backlog */

type Group = {
  key: string;
  project: string;
  lot: string;
  souslot: string;
  tasks: Task[];
};

function groupTree(tasks: Task[]): Group[] {
  const map = new Map<string, Group>();
  for (const t of tasks) {
    const key = `${t.project}//${t.lot}//${t.souslot}`;
    if (!map.has(key)) {
      map.set(key, { key, project: t.project, lot: t.lot, souslot: t.souslot, tasks: [] });
    }
    map.get(key)!.tasks.push(t);
  }
  for (const g of map.values()) g.tasks.sort((a, b) => idNum(a.id) - idNum(b.id));
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
}

function Backlog({
  project,
  tasks,
  readyByKey,
  sprint,
  selectedId,
  onSelect,
  onCommit,
  busy,
  spawnPret,
  onLance,
}: {
  project: string;
  tasks: Task[];
  readyByKey: Map<string, Ready>;
  sprint: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCommit: (id: string) => void;
  busy: boolean;
  spawnPret: boolean;
  onLance: (r: Lance[]) => void;
}) {
  const groups = groupTree(tasks);
  const byLot = new Map<string, Group[]>();
  for (const g of groups) {
    if (!byLot.has(g.lot)) byLot.set(g.lot, []);
    byLot.get(g.lot)!.push(g);
  }

  return (
    <section>
      <h2>Backlog</h2>
      <p className="muted">
        {project} · l'arbre est le <code>chemin</code> · le lot isole, le sous-lot
        se lance · Commit = <code>sprint:</code> → {sprint || "sprint"}
      </p>
      <div className="list-panel backlog-tree">
        {tasks.length === 0 ? (
          <div className="empty">Aucune task — lots vides = inbox / draft</div>
        ) : null}
        {[...byLot.entries()].map(([lot, gs]) => {
          const count = gs.reduce((n, g) => n + g.tasks.length, 0);
          return (
            <div key={lot || "(hors lot)"} className="tree-block">
              <div className="row feature umbrella">
                <span className="tree-mark">▾</span>
                <span className="type type-lot">lot</span>
                <strong className="row-title">{lot || "(hors lot)"}</strong>
                <span className="pill">{count} task(s)</span>
              </div>
              {gs.map((g) => {
                const r = readyByKey.get(g.key);
                return (
                  <div key={g.key}>
                    {g.souslot ? (
                      <div className="row feature" style={{ paddingLeft: 24 }}>
                        <span className="tree-mark">▾</span>
                        <span className="type type-sous-lot">sous-lot</span>
                        <ReadyMark r={r} />
                        <strong className="row-title">{g.souslot}</strong>
                        <span className="pill">{g.tasks.length} task(s)</span>
                        <span className="row-actions">
                          <OrchLaunchButton group={g} kids={g.tasks} busy={busy} spawnPret={spawnPret} onLance={onLance} />
                        </span>
                      </div>
                    ) : null}
                    {g.tasks.map((k) => (
                      <BacklogRow
                        key={k.id}
                        task={k}
                        depth={g.souslot ? 2 : 1}
                        selectedId={selectedId}
                        onSelect={onSelect}
                        onCommit={onCommit}
                        busy={busy}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** Le verdict du sous-lot, calculé — pas un statut posé à la main. */
function ReadyMark({ r }: { r?: Ready }) {
  if (!r || !r.ouvert) return <span className="faint">·</span>;
  if (r.lancable) {
    return (
      <span className="pill ok" title="aucune dépendance ouverte hors du sous-lot">
        ▸ lançable
      </span>
    );
  }
  return (
    <span className="pill warn" title={r.raisons.join(" · ")}>
      ✕ {r.raisons[0]}
    </span>
  );
}

function BacklogRow({
  task,
  depth,
  selectedId,
  onSelect,
  onCommit,
  busy,
}: {
  task: Task;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCommit: (id: string) => void;
  busy: boolean;
}) {
  return (
    <div
      className={`row child type-row-${task.type} ${selectedId === task.id ? "selected" : ""}`}
      style={{ paddingLeft: 8 + depth * 16 }}
    >
      <span className="tree-mark faint">├</span>
      <span className={`type type-${task.type}`}>{task.type}</span>
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
      {task.attend ? <span className="pill mine">t'attend</span> : null}
      <span className="row-actions">
        {task.sprint ? (
          <span className="pill info">{task.sprint}</span>
        ) : (
          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={() => onCommit(task.id)}
          >
            → Sprint
          </button>
        )}
      </span>
    </div>
  );
}

/* ------------------------------------------------- sprint / done-agent */

function Rows({
  heading,
  empty,
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
  tasks: Task[];
  allTasks: Task[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  showProject?: boolean;
  showOrch?: boolean;
  busy?: boolean;
}) {
  const groups = groupTree(tasks);
  return (
    <section>
      <h2>{heading}</h2>
      <div className="stats">
        <div className="stat">
          <strong>{tasks.length}</strong>
          <span>items</span>
        </div>
        <div className="stat">
          <strong>{tasks.filter((t) => t.status === "doing").length}</strong>
          <span>doing</span>
        </div>
        <div className="stat">
          <strong>{tasks.filter((t) => t.attend).length}</strong>
          <span>t'attendent</span>
        </div>
      </div>
      {tasks.length === 0 ? (
        <div className="callout">{empty}</div>
      ) : (
        <div className="stack" style={{ gap: 16 }}>
          {groups.map((g) => (
            <div key={g.key} className="list-panel">
              <div className="row feature" style={{ marginBottom: 8 }}>
                <span className="type type-sous-lot">sous-lot</span>
                <strong className="row-title">
                  {[g.lot, g.souslot].filter(Boolean).join(" / ") || "(hors lot)"}
                </strong>
                {showOrch && g.souslot ? (
                  <span className="row-actions">
                    <OrchLaunchButton
                      group={g}
                      kids={allTasks.filter(
                        (t) =>
                          t.project === g.project &&
                          t.lot === g.lot &&
                          t.souslot === g.souslot
                      )}
                      busy={busy}
                    />
                  </span>
                ) : null}
              </div>
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
                  {g.tasks.map((t) => (
                    <tr key={t.id}>
                      <td>{statusGlyph(t.status)}</td>
                      <td>
                        <span className={`type type-${t.type}`}>{t.type}</span>
                      </td>
                      <td>
                        <span className="pill agent">{taskAgentType(t)}</span>
                      </td>
                      <td>
                        <span className={`pill ${t.attend ? "mine" : "faint"}`}>
                          {t.attend ? "t'attend" : t.assignee || "agent"}
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

/**
 * Un bouton, deux mondes : si le serveur a une commande d'agent, il **lance**.
 * Sinon il retombe sur le brief à coller — parce qu'un bouton qui échoue
 * silencieusement est pire qu'un bouton qui dit ce qu'il sait faire.
 */
function OrchLaunchButton({
  group,
  kids,
  busy = false,
  spawnPret = false,
  onLance,
}: {
  group: { project: string; lot: string; souslot: string };
  kids: Task[];
  busy?: boolean;
  spawnPret?: boolean;
  onLance?: (running: Lance[]) => void;
}) {
  const [etat, setEtat] = useState<"" | "copie" | "lance" | "refus">("");
  const [msg, setMsg] = useState("");

  const lancer = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!spawnPret) {
      try {
        await navigator.clipboard.writeText(orchLaunchBrief(group, kids));
        setEtat("copie");
        window.setTimeout(() => setEtat(""), 2000);
      } catch {
        setEtat("");
      }
      return;
    }
    try {
      const r = await api.run(group.project, group.lot, group.souslot);
      onLance?.(r.running);
      setEtat("lance");
      window.setTimeout(() => setEtat(""), 2000);
    } catch (err) {
      setEtat("refus");
      setMsg(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <>
      <button
        type="button"
        className={spawnPret ? "btn primary compact" : "btn compact"}
        disabled={busy}
        title={
          spawnPret
            ? "Lance un orchestrateur sur ce lot, dans son worktree"
            : "RASTER_AGENT_CMD absente — copie un brief à coller"
        }
        onClick={(e) => void lancer(e)}
      >
        {etat === "copie"
          ? "Brief copié"
          : etat === "lance"
            ? "Lancé"
            : spawnPret
              ? "Lancer"
              : "Orchestrer"}
      </button>
      {etat === "refus" ? <span className="pill warn">{msg}</span> : null}
    </>
  );
}

/* ----------------------------------------------------------------- inbox */

function draftTypeFromLine(line: string) {
  for (const t of ["tech", "physical", "spec", "bug", "qa"]) {
    if (new RegExp(`(?:^|\\s)@${t}\\b`, "i").test(line)) return t;
  }
  return "feature";
}

function draftDescription(line: string) {
  return (
    line
      .replace(/(?:^|\s)@([a-zA-Z0-9_-]+)/g, "")
      .replace(/\s+/g, " ")
      .trim() || line.trim()
  );
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
  onPromote: (line: string, project: string, parent: string) => void;
}) {
  const [projectByLine, setProjectByLine] = useState<Record<string, string>>({});
  const [parentByLine, setParentByLine] = useState<Record<string, string>>({});

  const projectFor = (line: string) =>
    projectByLine[line] ||
    (projects.includes(defaultProject) ? defaultProject : projects[0] || "");

  /** Cibles = des DOSSIERS existants : "<lot>" ou "<lot>/<sous-lot>". */
  const parentsFor = (line: string) => {
    const proj = projectFor(line);
    const paths = new Set<string>();
    for (const t of tasks) {
      if (t.project !== proj || !t.lot) continue;
      paths.add(t.souslot ? `${t.lot}/${t.souslot}` : t.lot);
    }
    return [...paths].sort();
  };

  return (
    <section>
      <h2>Inbox</h2>
      <p className="muted">
        Uniquement <code>raster/inbox.md</code> · {lines.length} draft(s) · pas de
        lot ici
      </p>
      <div className="list-panel">
        {lines.length === 0 ? (
          <div className="empty">Vide — capturer une task draft en haut</div>
        ) : (
          lines.map((line) => {
            const parents = parentsFor(line);
            const parent = parentByLine[line] || "";
            return (
              <div
                key={line}
                className={`row ${selectedLine === line ? "selected" : ""}`}
                onClick={() => onSelectLine(line)}
              >
                <span className={`type type-${draftTypeFromLine(line)}`}>
                  {draftTypeFromLine(line)}
                </span>
                <span className="pill warn">draft</span>
                <span className="row-title">{draftDescription(line)}</span>
                <select
                  value={projectFor(line)}
                  disabled={busy}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    setProjectByLine((p) => ({ ...p, [line]: e.target.value }));
                    setParentByLine((p) => ({ ...p, [line]: "" }));
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
                    setParentByLine((p) => ({ ...p, [line]: e.target.value }))
                  }
                >
                  <option value="">
                    {parents.length === 0 ? "— aucun · rester inbox —" : "— rester inbox —"}
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
                      onPromote(line, projectFor(line), parent);
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

function InboxDetail({ count, line }: { count: number; line: string | null }) {
  if (!line) {
    return (
      <div className="stack">
        <h2>Task draft</h2>
        <p className="muted">
          Source unique : <strong>raster/inbox.md</strong>. Pas d'ID tant que non
          promu.
        </p>
        <div className="pill info" style={{ alignSelf: "flex-start" }}>
          {count} draft(s)
        </div>
      </div>
    );
  }
  return (
    <div className="stack">
      <div className="detail-kicker">
        <span className={`type type-${draftTypeFromLine(line)}`}>
          {draftTypeFromLine(line)}
        </span>
        <span className="faint">task draft · pas d'ID</span>
      </div>
      <h2>Inbox</h2>
      <div className="title">{draftDescription(line)}</div>
      <div className="faint">{line}</div>
      <div className="pill warn" style={{ alignSelf: "flex-start" }}>
        reste dans raster/inbox.md jusqu'au promote
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- chrome */

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
          aria-selected={active === ALL}
          className={active === ALL ? "active" : ""}
          onClick={() => onSelect(ALL)}
        >
          All<span className="n">{allCount}</span>
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
