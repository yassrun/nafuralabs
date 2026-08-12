import {
  Button,
  Callout,
  Card,
  CardBody,
  CardHeader,
  Code,
  CollapsibleSection,
  Divider,
  H1,
  H2,
  H3,
  Pill,
  Row,
  Select,
  Spacer,
  Stack,
  Stat,
  Table,
  Text,
  TextInput,
  Toggle,
  useCanvasState,
  useHostTheme,
} from "cursor/canvas";

/**
 * Raster UI — wireframe orchestrateur (à valider)
 * SSOT: products/raster/docs/specs/epics/raster-ui/ux/raster-ui-wireframe.canvas.tsx
 * Tickets: products/<app>/docs/specs/epics/<slug>/tasks/
 */

type ViewId = "inbox" | "backlog" | "sprint";
type Status = "todo" | "doing" | "blocked" | "review" | "done";
type Priority = "P0" | "P1" | "P2" | "P3";

type Task = {
  id: string;
  status: Status;
  priority: Priority;
  assignee: string;
  gate: string;
  kind: "feature" | "spec" | "task";
  sprint: string;
  parent: string;
  feature: string;
  title: string;
  project: string;
  blocked_by: string[];
};

const SPRINT = "2026-W33";
const SPRINT_RANGE = "lun 10/08 → dim 16/08";

const SEED: Task[] = [
  {
    id: "ERP-65",
    status: "doing",
    priority: "P0",
    assignee: "agent",
    gate: "qa",
    kind: "task",
    sprint: SPRINT,
    parent: "ERP-17",
    feature: "etude-parcours",
    title: "Bug — Valider l'extraction → 500",
    project: "sektor-btp",
    blocked_by: [],
  },
  {
    id: "ERP-66",
    status: "doing",
    priority: "P1",
    assignee: "agent",
    gate: "qa",
    kind: "task",
    sprint: SPRINT,
    parent: "ERP-17",
    feature: "etude-parcours",
    title: "Bug — Badge Estimé sans prix",
    project: "sektor-btp",
    blocked_by: [],
  },
  {
    id: "OPS-02",
    status: "doing",
    priority: "P1",
    assignee: "either",
    gate: "me",
    kind: "feature",
    sprint: SPRINT,
    parent: "",
    feature: "raster-ui",
    title: "UI Raster Canvas (orchestrateur)",
    project: "raster",
    blocked_by: [],
  },
  {
    id: "OPS-01",
    status: "todo",
    priority: "P1",
    assignee: "me",
    gate: "me",
    kind: "task",
    sprint: "",
    parent: "",
    feature: "",
    title: "Configurer Zimbra + migrer ykarkafi",
    project: "ops",
    blocked_by: [],
  },
  {
    id: "ERP-16",
    status: "todo",
    priority: "P1",
    assignee: "me",
    gate: "me",
    kind: "feature",
    sprint: "",
    parent: "",
    feature: "chiffrage-drawer",
    title: "Drawer chiffrage poste",
    project: "sektor-btp",
    blocked_by: [],
  },
  {
    id: "ERP-11",
    status: "todo",
    priority: "P1",
    assignee: "me",
    gate: "none",
    kind: "task",
    sprint: "",
    parent: "ERP-16",
    feature: "chiffrage-drawer",
    title: "Descriptif technique — mode de fonctionnement",
    project: "sektor-btp",
    blocked_by: [],
  },
  {
    id: "ERP-12",
    status: "todo",
    priority: "P1",
    assignee: "me",
    gate: "none",
    kind: "task",
    sprint: "",
    parent: "ERP-16",
    feature: "chiffrage-drawer",
    title: "Ouverture popup chiffrage — double-clic",
    project: "sektor-btp",
    blocked_by: [],
  },
  {
    id: "ERP-13",
    status: "todo",
    priority: "P1",
    assignee: "me",
    gate: "none",
    kind: "task",
    sprint: "",
    parent: "ERP-16",
    feature: "chiffrage-drawer",
    title: "Bug — référentiel unité mode décomposé",
    project: "sektor-btp",
    blocked_by: ["ERP-11"],
  },
  {
    id: "ERP-05",
    status: "todo",
    priority: "P2",
    assignee: "either",
    gate: "me",
    kind: "feature",
    sprint: "",
    parent: "",
    feature: "sous-traitance-raffinement",
    title: "Raffinement sous-traitance",
    project: "sektor-btp",
    blocked_by: [],
  },
  {
    id: "ERP-53",
    status: "todo",
    priority: "P1",
    assignee: "me",
    gate: "me",
    kind: "feature",
    sprint: "",
    parent: "",
    feature: "document-reader",
    title: "Document reader",
    project: "sektor-btp",
    blocked_by: [],
  },
  {
    id: "PER-01",
    status: "todo",
    priority: "P2",
    assignee: "me",
    gate: "me",
    kind: "task",
    sprint: "",
    parent: "",
    feature: "",
    title: "Payer factures eau / élec / internet",
    project: "personal",
    blocked_by: [],
  },
];

const INBOX_BY_PROJECT: Record<string, string[]> = {
  "sektor-btp": ["fix overlay commentaires chiffrage @erp"],
  raster: ["brief landing Raster @raster"],
  ops: ["RDV comptable @ops @me"],
  personal: [],
};

const GLYPH: Record<Status, string> = {
  todo: "·",
  doing: "▸",
  blocked: "✕",
  review: "◐",
  done: "✓",
};

const STATUS_OPTS = [
  { value: "todo", label: "todo" },
  { value: "doing", label: "doing" },
  { value: "blocked", label: "blocked" },
  { value: "review", label: "review" },
  { value: "done", label: "done" },
];

function statusTone(
  s: Status,
): "neutral" | "info" | "success" | "warning" | "deleted" {
  if (s === "doing") return "info";
  if (s === "blocked") return "deleted";
  if (s === "review") return "warning";
  if (s === "done") return "success";
  return "neutral";
}

function CaptureBar({
  project,
  setProject,
  draft,
  setDraft,
  onCapture,
}: {
  project: string;
  setProject: (p: string) => void;
  draft: string;
  setDraft: (v: string) => void;
  onCapture: () => void;
}) {
  const theme = useHostTheme();
  const projects = ["sektor-btp", "raster", "ops", "personal"];
  return (
    <Stack
      gap={8}
      style={{
        padding: 12,
        background: theme.fill.tertiary,
        borderBottom: `1px solid ${theme.stroke.secondary}`,
      }}
    >
      <Row gap={8} align="center" wrap>
        <Text weight="semibold" size="small">
          Capture
        </Text>
        <Text tone="tertiary" size="small">
          → inbox du projet · &lt; 5 s
        </Text>
      </Row>
      <Row gap={8} align="center" wrap>
        <Select
          value={project}
          options={projects.map((p) => ({ value: p, label: p }))}
          onChange={setProject}
        />
        <div style={{ flex: 1, minWidth: 200 }}>
          <TextInput
            value={draft}
            placeholder="ex. raffiner sous-traitance listing @erp"
            onChange={setDraft}
          />
        </div>
        <Button variant="primary" onClick={onCapture} disabled={!draft.trim()}>
          Capturer
        </Button>
      </Row>
      <Text tone="tertiary" size="small">
        Fichier : products/{project}/docs/specs/inbox.md
      </Text>
    </Stack>
  );
}

function ShellNav({
  view,
  setView,
}: {
  view: ViewId;
  setView: (v: ViewId) => void;
}) {
  const items: { id: ViewId; label: string }[] = [
    { id: "inbox", label: "Inbox" },
    { id: "backlog", label: "Backlog" },
    { id: "sprint", label: "Sprint" },
  ];
  return (
    <Row gap={8} wrap>
      {items.map((it) => (
        <span key={it.id}>
          <Pill active={view === it.id} onClick={() => setView(it.id)}>
            {it.label}
          </Pill>
        </span>
      ))}
    </Row>
  );
}

function DetailPanel({
  task,
  draftStatus,
  setDraftStatus,
  showManual,
  setShowManual,
  confirmDelete,
  setConfirmDelete,
  onDelete,
}: {
  task: Task | null;
  draftStatus: Status;
  setDraftStatus: (s: Status) => void;
  showManual: boolean;
  setShowManual: (v: boolean) => void;
  confirmDelete: boolean;
  setConfirmDelete: (v: boolean) => void;
  onDelete: (id: string) => void;
}) {
  if (!task) {
    return (
      <Card>
        <CardHeader>Détail</CardHeader>
        <CardBody>
          <Text tone="secondary" size="small">
            Sélectionne une task dans le tree.
          </Text>
        </CardBody>
      </Card>
    );
  }

  const path = task.feature
    ? `products/${task.project}/docs/specs/epics/${task.feature}/tasks/`
    : `products/${task.project}/docs/specs/epics/_backlog/tasks/`;

  const childHint =
    task.kind === "feature"
      ? "Supprime aussi les tasks enfants (abandon)."
      : "Abandon = delete fichier + hors INDEX. Pas de status dropped.";

  return (
    <Card>
      <CardHeader
        trailing={
          <Pill size="sm" tone={statusTone(task.status)}>
            {GLYPH[task.status]} {task.status}
          </Pill>
        }
      >
        {task.id}
      </CardHeader>
      <CardBody>
        <Stack gap={12}>
          <Text weight="semibold">{task.title}</Text>
          <Row gap={6} wrap>
            <Pill size="sm">{task.kind}</Pill>
            <Pill size="sm">{task.priority}</Pill>
            <Pill size="sm">[{task.assignee}]</Pill>
            <Pill size="sm">gate:{task.gate}</Pill>
            {task.sprint ? (
              <Pill size="sm" tone="info">
                {task.sprint}
              </Pill>
            ) : (
              <Pill size="sm">backlog</Pill>
            )}
            {task.feature ? <Pill size="sm">{task.feature}</Pill> : null}
          </Row>
          <Text tone="tertiary" size="small">
            {path}
            {task.id}-….md
          </Text>
          {task.blocked_by.length > 0 ? (
            <Text size="small">blocked_by: {task.blocked_by.join(", ")}</Text>
          ) : null}

          <Divider />
          <H3>Check progress</H3>
          <Select
            value={draftStatus}
            options={STATUS_OPTS}
            onChange={(v) => setDraftStatus(v as Status)}
          />
          <Button variant="primary">Appliquer via agent</Button>
          <Row gap={8} align="center">
            <Toggle checked={showManual} onChange={setShowManual} />
            <Text size="small">Fallback manuel</Text>
          </Row>
          {showManual ? (
            <Stack gap={6}>
              <Code>{`t progress ${task.id} ${draftStatus}`}</Code>
              <Code>{`t delete ${task.id}`}</Code>
              <Button variant="secondary">Ouvrir fichier task</Button>
            </Stack>
          ) : null}

          <Divider />
          <H3>Abandon</H3>
          <Text tone="secondary" size="small">
            {childHint}
          </Text>
          {!confirmDelete ? (
            <Button
              variant="ghost"
              onClick={() => setConfirmDelete(true)}
            >
              Supprimer…
            </Button>
          ) : (
            <Stack gap={8}>
              <Callout tone="danger" title={`Confirmer delete ${task.id}`}>
                Irréversible dans le wireframe (démo). En prod : agent / `t
                delete` efface le fichier.
              </Callout>
              <Row gap={8} wrap>
                <Button
                  variant="primary"
                  onClick={() => {
                    onDelete(task.id);
                    setConfirmDelete(false);
                  }}
                >
                  Confirmer suppression
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setConfirmDelete(false)}
                >
                  Annuler
                </Button>
              </Row>
            </Stack>
          )}
        </Stack>
      </CardBody>
    </Card>
  );
}

function InboxView({
  seedByProject,
  localByProject,
  captureProject,
  setCaptureProject,
}: {
  seedByProject: Record<string, string[]>;
  localByProject: Record<string, string[]>;
  captureProject: string;
  setCaptureProject: (p: string) => void;
}) {
  const projects = Array.from(
    new Set([
      ...Object.keys(seedByProject),
      ...Object.keys(localByProject),
      "sektor-btp",
      "raster",
      "ops",
      "personal",
    ]),
  );

  const total = projects.reduce((n, p) => {
    const lines = [
      ...(localByProject[p] || []),
      ...(seedByProject[p] || []),
    ];
    return n + lines.length;
  }, 0);

  return (
    <Stack gap={14}>
      <Row gap={8} align="center" wrap>
        <H2>Inbox</H2>
        <Text tone="secondary" size="small">
          Par projet · products/&lt;app&gt;/docs/specs/inbox.md
        </Text>
        <Pill size="sm">{total} ligne(s)</Pill>
      </Row>

      {total === 0 ? (
        <Callout tone="info" title="Toutes les inboxes vides">
          Capture en haut (choisir le projet) — une ligne, @tag, pas d’ID.
        </Callout>
      ) : null}

      {projects.map((proj) => {
        const lines = [
          ...(localByProject[proj] || []),
          ...(seedByProject[proj] || []),
        ];
        return (
          <span key={proj}>
            <CollapsibleSection
              title={proj}
              count={lines.length}
              defaultOpen={lines.length > 0 || proj === captureProject}
              trailing={
                <Button
                  variant={captureProject === proj ? "primary" : "ghost"}
                  onClick={() => setCaptureProject(proj)}
                >
                  Capturer ici
                </Button>
              }
            >
              <Stack gap={8}>
                <Text tone="tertiary" size="small">
                  products/{proj}/docs/specs/inbox.md
                </Text>
                {lines.length === 0 ? (
                  <Text tone="secondary" size="small">
                    Vide
                  </Text>
                ) : (
                  <Table
                    headers={["Ligne", "Hints"]}
                    rows={lines.map((line) => {
                      const tags = (line.match(/@\w+/g) || []).join(" ");
                      return [
                        line.replace(/@\w+/g, "").trim(),
                        tags || "—",
                      ];
                    })}
                  />
                )}
                <Row gap={8} wrap>
                  <Button
                    variant="primary"
                    disabled={lines.length === 0}
                  >
                    Promote via agent
                  </Button>
                  <Button variant="secondary">Ouvrir inbox.md</Button>
                </Row>
              </Stack>
            </CollapsibleSection>
          </span>
        );
      })}
    </Stack>
  );
}

function BacklogView({
  tasks,
  selectedId,
  setSelectedId,
  onCommitFeature,
}: {
  tasks: Task[];
  selectedId: string;
  setSelectedId: (id: string) => void;
  onCommitFeature: (featureId: string) => void;
}) {
  const projects = Array.from(new Set(tasks.map((t) => t.project)));

  return (
    <Stack gap={14}>
      <Row gap={8} align="center" wrap>
        <H2>Backlog</H2>
        <Text tone="secondary" size="small">
          Tree projet → feature → tasks · Commit = sprint sur les tasks
        </Text>
      </Row>
      <Callout tone="neutral" title="Fichiers dans le produit">
        products/&lt;app&gt;/docs/specs/epics/&lt;slug&gt;/tasks/ — Raster
        agrège seulement.
      </Callout>

      {projects.map((proj) => {
        const inProj = tasks.filter((t) => t.project === proj);
        const features = inProj.filter((t) => t.kind === "feature" && !t.parent);
        const orphans = inProj.filter((t) => !t.parent && t.kind !== "feature");

        return (
          <span key={proj}>
            <CollapsibleSection
              title={proj}
              count={inProj.length}
              defaultOpen={proj === "sektor-btp" || proj === "raster"}
            >
              <Stack gap={10}>
                {features.map((feat) => {
                  const kids = inProj.filter((t) => t.parent === feat.id);
                  const uncommittedKids = kids.filter((k) => !k.sprint);
                  const featInSprint = !!feat.sprint;
                  return (
                    <span key={feat.id}>
                      <Stack
                        gap={6}
                        style={{
                          paddingLeft: 4,
                          marginBottom: 8,
                        }}
                      >
                        <Row gap={8} wrap align="center">
                          <Text size="small">{GLYPH[feat.status]}</Text>
                          <Pill
                            size="sm"
                            active={selectedId === feat.id}
                            onClick={() => setSelectedId(feat.id)}
                          >
                            {feat.id}
                          </Pill>
                          <Text weight="semibold" size="small">
                            {feat.title}
                          </Text>
                          <Pill size="sm" tone="info">
                            feature
                          </Pill>
                          <Pill size="sm">{feat.priority}</Pill>
                          {featInSprint ? (
                            <Pill size="sm" tone="success">
                              {feat.sprint}
                            </Pill>
                          ) : (
                            <Button
                              variant="primary"
                              onClick={() => onCommitFeature(feat.id)}
                            >
                              → Sprint {SPRINT}
                            </Button>
                          )}
                        </Row>
                        <Text tone="tertiary" size="small">
                          epics/{feat.feature || "…"}/tasks/ · {kids.length}{" "}
                          task(s)
                          {uncommittedKids.length
                            ? ` · ${uncommittedKids.length} hors sprint`
                            : ""}
                        </Text>
                        {kids.length === 0 ? (
                          <Text tone="secondary" size="small">
                            Pas d’enfants — découper avant exécution
                          </Text>
                        ) : (
                          kids.map((k) => (
                            <span key={k.id}>
                              <Row
                                gap={8}
                                wrap
                                align="center"
                                style={{ paddingLeft: 20 }}
                              >
                                <Text size="small" tone="secondary">
                                  {GLYPH[k.status]}
                                </Text>
                                <Pill
                                  size="sm"
                                  active={selectedId === k.id}
                                  onClick={() => setSelectedId(k.id)}
                                >
                                  {k.id}
                                </Pill>
                                <Text size="small" tone="secondary">
                                  {k.title}
                                </Text>
                                {k.sprint ? (
                                  <Pill size="sm" tone="info">
                                    {k.sprint}
                                  </Pill>
                                ) : (
                                  <Pill size="sm">backlog</Pill>
                                )}
                                {k.blocked_by.length > 0 ? (
                                  <Pill size="sm">
                                    blocked:{k.blocked_by.join(",")}
                                  </Pill>
                                ) : null}
                              </Row>
                            </span>
                          ))
                        )}
                      </Stack>
                    </span>
                  );
                })}

                {orphans.length > 0 ? (
                  <Stack gap={4}>
                    <H3>_backlog</H3>
                    {orphans.map((o) => (
                      <span key={o.id}>
                        <Row gap={8} wrap align="center">
                          <Text size="small">{GLYPH[o.status]}</Text>
                          <Pill
                            size="sm"
                            active={selectedId === o.id}
                            onClick={() => setSelectedId(o.id)}
                          >
                            {o.id}
                          </Pill>
                          <Text size="small">{o.title}</Text>
                          {!o.sprint ? (
                            <Button
                              variant="secondary"
                              onClick={() => onCommitFeature(o.id)}
                            >
                              → Sprint
                            </Button>
                          ) : (
                            <Pill size="sm" tone="info">
                              {o.sprint}
                            </Pill>
                          )}
                        </Row>
                      </span>
                    ))}
                  </Stack>
                ) : null}
              </Stack>
            </CollapsibleSection>
          </span>
        );
      })}
    </Stack>
  );
}

function SprintView({
  tasks,
  selectedId,
  setSelectedId,
}: {
  tasks: Task[];
  selectedId: string;
  setSelectedId: (id: string) => void;
}) {
  const committed = tasks.filter((t) => t.sprint === SPRINT);
  const doing = committed.filter((t) => t.status === "doing").length;

  return (
    <Stack gap={12}>
      <H2>
        SPRINT {SPRINT}{" "}
        <Text tone="tertiary" size="small">
          {SPRINT_RANGE}
        </Text>
      </H2>
      <Text tone="secondary" size="small">
        Owned by Raster orchestrateur · fichiers restent dans les produits
      </Text>
      <Row gap={12} wrap>
        <Stat value={String(committed.length)} label="committed" />
        <Stat value={String(doing)} label="doing" tone="info" />
      </Row>
      {committed.length === 0 ? (
        <Callout tone="warning" title="Sprint vide">
          Commit depuis Backlog (bouton sur feature = tasks enfants).
        </Callout>
      ) : (
        <Table
          headers={["", "ID", "Projet", "Titre", "Status"]}
          rows={committed.map((t) => [
            GLYPH[t.status],
            <Pill
              size="sm"
              active={selectedId === t.id}
              onClick={() => setSelectedId(t.id)}
            >
              {t.id}
            </Pill>,
            t.project,
            t.title,
            <Pill size="sm" tone={statusTone(t.status)}>
              {t.status}
            </Pill>,
          ])}
        />
      )}
    </Stack>
  );
}

export default function RasterUiWireframe() {
  const theme = useHostTheme();
  const [view, setView] = useCanvasState<ViewId>("raster.ui3.view", "backlog");
  const [selectedId, setSelectedId] = useCanvasState<string>(
    "raster.ui2.selected",
    "ERP-16",
  );
  const [captureProject, setCaptureProject] = useCanvasState<string>(
    "raster.ui2.capProj",
    "sektor-btp",
  );
  const [draft, setDraft] = useCanvasState<string>("raster.ui2.capture", "");
  const [localInbox, setLocalInbox] = useCanvasState<Record<string, string[]>>(
    "raster.ui2.localInbox",
    {},
  );
  const [taskState, setTaskState] = useCanvasState<Task[]>(
    "raster.ui2.tasks",
    SEED,
  );
  const [draftStatus, setDraftStatus] = useCanvasState<Status>(
    "raster.ui2.draftStatus",
    "todo",
  );
  const [showManual, setShowManual] = useCanvasState<boolean>(
    "raster.ui2.manual",
    true,
  );
  const [confirmDelete, setConfirmDelete] = useCanvasState<boolean>(
    "raster.ui2.confirmDelete",
    false,
  );

  const selected = taskState.find((t) => t.id === selectedId) ?? null;

  const onCapture = () => {
    const line = draft.trim();
    if (!line) return;
    setLocalInbox({
      ...localInbox,
      [captureProject]: [line, ...(localInbox[captureProject] || [])],
    });
    setDraft("");
    setView("inbox");
  };

  const onSelect = (id: string) => {
    setSelectedId(id);
    setConfirmDelete(false);
    const t = taskState.find((x) => x.id === id);
    if (t) setDraftStatus(t.status);
  };

  const onCommitFeature = (featureId: string) => {
    setTaskState(
      taskState.map((t) => {
        if (t.id === featureId && t.kind === "feature") {
          return { ...t, sprint: SPRINT };
        }
        if (t.parent === featureId && !t.sprint) {
          return { ...t, sprint: SPRINT };
        }
        if (t.id === featureId && t.kind === "task" && !t.sprint) {
          return { ...t, sprint: SPRINT };
        }
        return t;
      }),
    );
    setView("sprint");
  };

  const onDelete = (id: string) => {
    const target = taskState.find((t) => t.id === id);
    const next = taskState.filter((t) => {
      if (t.id === id) return false;
      if (target?.kind === "feature" && t.parent === id) return false;
      return true;
    });
    setTaskState(next);
    const fallback = next[0]?.id || "";
    setSelectedId(fallback);
    setConfirmDelete(false);
  };

  return (
    <Stack gap={0} style={{ minHeight: "100%" }}>
      <Stack
        gap={10}
        style={{
          padding: "16px 16px 12px",
          borderBottom: `1px solid ${theme.stroke.secondary}`,
        }}
      >
        <Row gap={10} align="center" wrap>
          <H1>Raster</H1>
          <Pill size="sm" tone="info">
            orchestrateur
          </Pill>
          <Text tone="tertiary" size="small">
            tickets dans les produits · OPS-02
          </Text>
        </Row>
        <ShellNav view={view} setView={setView} />
      </Stack>

      <CaptureBar
        project={captureProject}
        setProject={setCaptureProject}
        draft={draft}
        setDraft={setDraft}
        onCapture={onCapture}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 300px",
          gap: 16,
          padding: 16,
          alignItems: "start",
        }}
      >
        <Stack gap={12}>
          {view === "inbox" ? (
            <InboxView
              seedByProject={INBOX_BY_PROJECT}
              localByProject={localInbox}
              captureProject={captureProject}
              setCaptureProject={setCaptureProject}
            />
          ) : null}
          {view === "backlog" ? (
            <BacklogView
              tasks={taskState}
              selectedId={selectedId}
              setSelectedId={onSelect}
              onCommitFeature={onCommitFeature}
            />
          ) : null}
          {view === "sprint" ? (
            <SprintView
              tasks={taskState}
              selectedId={selectedId}
              setSelectedId={onSelect}
            />
          ) : null}
        </Stack>

        <DetailPanel
          task={selected}
          draftStatus={draftStatus}
          setDraftStatus={setDraftStatus}
          showManual={showManual}
          setShowManual={setShowManual}
          confirmDelete={confirmDelete}
          setConfirmDelete={setConfirmDelete}
          onDelete={onDelete}
        />
      </div>

      <Spacer />
      <Text tone="tertiary" size="small" style={{ padding: "0 16px 16px" }}>
        SSOT canvas :
        products/raster/docs/specs/epics/raster-ui/ux/raster-ui-wireframe.canvas.tsx
      </Text>
    </Stack>
  );
}
