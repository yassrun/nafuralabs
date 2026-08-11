import {
  Button,
  Callout,
  Divider,
  H1,
  H2,
  Pill,
  Row,
  Select,
  Spacer,
  Stack,
  Stat,
  Table,
  Text,
  TextInput,
  useCanvasAction,
  useCanvasState,
  useHostTheme,
} from "cursor/canvas";

type ViewId = "inbox" | "backlog" | "sprint";
type Status = "todo" | "doing" | "blocked" | "review" | "done";
type Priority = "P0" | "P1" | "P2" | "P3";

type Task = {
  id: string;
  status: Status;
  priority: Priority;
  context: string;
  assignee: string;
  gate: string;
  kind: "feature" | "spec" | "task";
  sprint: string;
  parent: string;
  feature: string;
  title: string;
  project: string;
};

/** Snapshot INDEX 11/08 — re-embed après regen si besoin. */
const SEED: Task[] = [
  {
    id: "OPS-01",
    status: "todo",
    priority: "P1",
    context: "nafura",
    assignee: "me",
    gate: "me",
    kind: "task",
    sprint: "",
    parent: "",
    feature: "",
    title: "Configurer Zimbra + migrer ykarkafi@nafuralabs.com",
    project: "ops",
  },
  {
    id: "OPS-02",
    status: "doing",
    priority: "P1",
    context: "nafura",
    assignee: "either",
    gate: "me",
    kind: "feature",
    sprint: "2026-W33",
    parent: "",
    feature: "raster-canvas-ui",
    title: "UI Raster Canvas (sans BDD / sans auth)",
    project: "raster",
  },
  {
    id: "ERP-03",
    status: "todo",
    priority: "P1",
    context: "nafura",
    assignee: "either",
    gate: "me",
    kind: "feature",
    sprint: "",
    parent: "",
    feature: "achats-raffinement",
    title: "Raffinement achats (lot 3)",
    project: "sektor-btp",
  },
  {
    id: "ERP-16",
    status: "todo",
    priority: "P1",
    context: "nafura",
    assignee: "me",
    gate: "me",
    kind: "feature",
    sprint: "",
    parent: "",
    feature: "chiffrage-drawer",
    title: "Drawer chiffrage poste",
    project: "sektor-btp",
  },
  {
    id: "ERP-11",
    status: "todo",
    priority: "P1",
    context: "nafura",
    assignee: "me",
    gate: "none",
    kind: "task",
    sprint: "",
    parent: "ERP-16",
    feature: "chiffrage-drawer",
    title: "Raffiner le mode de fonctionnement du descriptif technique",
    project: "sektor-btp",
  },
  {
    id: "ERP-12",
    status: "todo",
    priority: "P1",
    context: "nafura",
    assignee: "me",
    gate: "none",
    kind: "task",
    sprint: "",
    parent: "ERP-16",
    feature: "chiffrage-drawer",
    title: "Ouverture du popup chiffrage poste — double-clic",
    project: "sektor-btp",
  },
  {
    id: "ERP-13",
    status: "todo",
    priority: "P1",
    context: "nafura",
    assignee: "me",
    gate: "none",
    kind: "task",
    sprint: "",
    parent: "ERP-16",
    feature: "chiffrage-drawer",
    title: "Bug — référentiel unité dans le chiffrage poste",
    project: "sektor-btp",
  },
  {
    id: "ERP-14",
    status: "todo",
    priority: "P1",
    context: "nafura",
    assignee: "me",
    gate: "none",
    kind: "task",
    sprint: "",
    parent: "ERP-16",
    feature: "chiffrage-drawer",
    title: "Bug affichage — commentaires d'équipe superposés",
    project: "sektor-btp",
  },
  {
    id: "ERP-17",
    status: "todo",
    priority: "P1",
    context: "nafura",
    assignee: "me",
    gate: "me",
    kind: "feature",
    sprint: "",
    parent: "",
    feature: "etude-parcours",
    title: "Parcours étude (création, version, en-tête, structure)",
    project: "sektor-btp",
  },
  {
    id: "ERP-08",
    status: "todo",
    priority: "P1",
    context: "nafura",
    assignee: "me",
    gate: "me",
    kind: "task",
    sprint: "",
    parent: "ERP-17",
    feature: "etude-parcours",
    title: "Nouvelle version d'étude depuis une étude terminée",
    project: "sektor-btp",
  },
  {
    id: "ERP-09",
    status: "todo",
    priority: "P1",
    context: "nafura",
    assignee: "me",
    gate: "me",
    kind: "task",
    sprint: "",
    parent: "ERP-17",
    feature: "etude-parcours",
    title: "Revoir les infos d'en-tête de l'étude (chiffrage)",
    project: "sektor-btp",
  },
  {
    id: "ERP-10",
    status: "todo",
    priority: "P1",
    context: "nafura",
    assignee: "me",
    gate: "me",
    kind: "task",
    sprint: "",
    parent: "ERP-17",
    feature: "etude-parcours",
    title: "Création étude / AO — ordre & mix import CPS",
    project: "sektor-btp",
  },
  {
    id: "ERP-15",
    status: "todo",
    priority: "P1",
    context: "nafura",
    assignee: "me",
    gate: "me",
    kind: "task",
    sprint: "",
    parent: "ERP-17",
    feature: "etude-parcours",
    title: "Règle métier — ne pas modifier le lien (structure figée)",
    project: "sektor-btp",
  },
  {
    id: "ERP-46",
    status: "todo",
    priority: "P1",
    context: "nafura",
    assignee: "me",
    gate: "me",
    kind: "feature",
    sprint: "",
    parent: "",
    feature: "flux-articles-v1",
    title: "Flux articles V1",
    project: "sektor-btp",
  },
  {
    id: "ERP-26",
    status: "todo",
    priority: "P1",
    context: "nafura",
    assignee: "me",
    gate: "me",
    kind: "feature",
    sprint: "",
    parent: "",
    feature: "rh-pointage-raffinement",
    title: "Raffinement RH / pointage",
    project: "sektor-btp",
  },
  {
    id: "ERP-29",
    status: "todo",
    priority: "P1",
    context: "nafura",
    assignee: "either",
    gate: "me",
    kind: "task",
    sprint: "",
    parent: "ERP-26",
    feature: "rh-pointage-raffinement",
    title: "RH / pointage — Lot 2 · Validation contrôle et produit",
    project: "sektor-btp",
  },
  {
    id: "PER-01",
    status: "todo",
    priority: "P2",
    context: "personal",
    assignee: "me",
    gate: "me",
    kind: "task",
    sprint: "",
    parent: "",
    feature: "",
    title: "Payer factures eau / élec / internet",
    project: "personal",
  },
  {
    id: "PER-02",
    status: "todo",
    priority: "P2",
    context: "personal",
    assignee: "me",
    gate: "me",
    kind: "feature",
    sprint: "",
    parent: "",
    feature: "raffinement-cv",
    title: "Raffinement de CV",
    project: "personal",
  },
  {
    id: "ERP-06",
    status: "todo",
    priority: "P2",
    context: "nafura",
    assignee: "either",
    gate: "me",
    kind: "feature",
    sprint: "",
    parent: "",
    feature: "chantier-minimal",
    title: "Chantier minimal — fiche pivot (lot 6)",
    project: "sektor-btp",
  },
  {
    id: "ERP-30",
    status: "todo",
    priority: "P2",
    context: "nafura",
    assignee: "either",
    gate: "me",
    kind: "task",
    sprint: "",
    parent: "ERP-26",
    feature: "rh-pointage-raffinement",
    title: "RH / pointage — Lot 3 · Paie juste et paramétrée",
    project: "sektor-btp",
  },
  {
    id: "ERP-31",
    status: "todo",
    priority: "P2",
    context: "nafura",
    assignee: "agent",
    gate: "none",
    kind: "task",
    sprint: "",
    parent: "ERP-26",
    feature: "rh-pointage-raffinement",
    title: "RH / pointage — Lot 4 · Coût remonte au chantier",
    project: "sektor-btp",
  },
  {
    id: "ERP-32",
    status: "todo",
    priority: "P2",
    context: "nafura",
    assignee: "agent",
    gate: "none",
    kind: "task",
    sprint: "",
    parent: "ERP-26",
    feature: "rh-pointage-raffinement",
    title: "RH / pointage — Lot 5 · Intégrité et nettoyage",
    project: "sektor-btp",
  },
  {
    id: "ERP-05",
    status: "todo",
    priority: "P2",
    context: "nafura",
    assignee: "either",
    gate: "me",
    kind: "feature",
    sprint: "",
    parent: "",
    feature: "sous-traitance-raffinement",
    title: "Raffinement sous-traitance (lot 5)",
    project: "sektor-btp",
  },
  {
    id: "ERP-07",
    status: "todo",
    priority: "P3",
    context: "nafura",
    assignee: "either",
    gate: "me",
    kind: "feature",
    sprint: "",
    parent: "",
    feature: "planification-chantier",
    title: "Planification chantier (lot 7 — dernier)",
    project: "sektor-btp",
  },
];

const STATUS_OPTS = [
  { value: "todo", label: "todo" },
  { value: "doing", label: "doing" },
  { value: "blocked", label: "blocked" },
  { value: "review", label: "review" },
  { value: "done", label: "done" },
];

const GLYPH: Record<Status, string> = {
  todo: "·",
  doing: "▸",
  blocked: "✕",
  review: "◐",
  done: "✓",
};

function statusTone(
  s: Status,
): "neutral" | "info" | "warning" | "success" | "deleted" {
  if (s === "doing") return "info";
  if (s === "blocked") return "deleted";
  if (s === "review") return "warning";
  if (s === "done") return "success";
  return "neutral";
}

function counts(tasks: Task[]) {
  return {
    live: tasks.filter((x) => x.status !== "done").length,
    doing: tasks.filter((x) => x.status === "doing").length,
    review: tasks.filter((x) => x.status === "review").length,
    sprint: tasks.filter(
      (x) => x.sprint === "2026-W33" && x.status !== "done",
    ).length,
  };
}

function Nav({
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
        <Pill
          key={it.id}
          active={view === it.id}
          onClick={() => setView(it.id)}
        >
          {it.label}
        </Pill>
      ))}
    </Row>
  );
}

function TaskRowActions({
  task,
  onStatus,
}: {
  task: Task;
  onStatus: (id: string, status: Status) => void;
}) {
  const dispatch = useCanvasAction();
  const folder =
    task.project === "raster"
      ? "raster/nafura/products/raster/tasks/"
      : task.project === "ops"
        ? "raster/nafura/ops/tasks/"
        : task.project === "personal"
          ? "raster/personal/tasks/"
          : "raster/nafura/products/sektor-btp/tasks/";

  return (
    <Row gap={8} align="center" wrap>
      <Select
        value={task.status}
        options={STATUS_OPTS}
        onChange={(v) => onStatus(task.id, v as Status)}
      />
      <Button
        variant="secondary"
        onClick={() =>
          dispatch({
            type: "newComposerChat",
            userPrompt: `Check progress Raster : passe ${task.id} → ${task.status} (status déjà choisi dans le canvas Raster) et append journal. Gate=${task.gate}. Si done → archive. Respecte raster/AGENTS.md.`,
          })
        }
      >
        Appliquer via agent
      </Button>
      <Button
        variant="ghost"
        onClick={() => dispatch({ type: "openFile", path: folder })}
      >
        Ouvrir dossier
      </Button>
    </Row>
  );
}

function PromoteInboxButton() {
  const dispatch = useCanvasAction();
  return (
    <Button
      variant="secondary"
      onClick={() =>
        dispatch({
          type: "newComposerChat",
          userPrompt:
            "Promote les lignes inbox.md vers tasks/ selon raster/AGENTS.md (kind/priority/assignee/gate), puis regen INDEX.",
        })
      }
    >
      Promote inbox.md via agent
    </Button>
  );
}

function CommitAgentButton({ id }: { id: string }) {
  const dispatch = useCanvasAction();
  return (
    <Button
      variant="ghost"
      onClick={() =>
        dispatch({
          type: "newComposerChat",
          userPrompt: `Commit sprint : pose sprint: 2026-W33 sur ${id}, append journal, regen SPRINT.md (raster/AGENTS.md).`,
        })
      }
    >
      Via agent
    </Button>
  );
}

export default function PmCanvasWireframe() {
  const theme = useHostTheme();
  const [view, setView] = useCanvasState<ViewId>("view", "sprint");
  const [tasks, setTasks] = useCanvasState<Task[]>("tasks", SEED);
  const [selectedId, setSelectedId] = useCanvasState<string>(
    "selectedId",
    "OPS-02",
  );
  const [capture, setCapture] = useCanvasState<string>("capture", "");
  const [inbox, setInbox] = useCanvasState<string[]>("inbox", [
    "exemple : fix overlay commentaires @erp",
  ]);

  const c = counts(tasks);
  const selected = tasks.find((x) => x.id === selectedId) ?? tasks[0];
  const sprintTasks = tasks.filter(
    (x) => x.sprint === "2026-W33" && x.status !== "done",
  );
  const readyCommit = tasks.filter(
    (x) =>
      !x.sprint &&
      x.kind === "task" &&
      x.priority === "P1" &&
      x.status !== "done",
  );
  const projects = Array.from(new Set(tasks.map((x) => x.project)));

  const setStatus = (id: string, status: Status) => {
    setTasks((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
  };

  const commitLocal = (id: string) => {
    setTasks((prev) =>
      prev.map((x) =>
        x.id === id ? { ...x, sprint: x.sprint || "2026-W33" } : x,
      ),
    );
  };

  return (
    <Stack gap={20} style={{ padding: 20, maxWidth: 980 }}>
      <Stack gap={6}>
        <H1>Raster — Canvas</H1>
        <Text tone="secondary" size="small">
          Sans BDD · sans auth · snapshot fichiers raster/ · OPS-02
        </Text>
      </Stack>

      <Row gap={16} wrap>
        <Stat value={String(c.live)} label="Live" />
        <Stat value={String(c.sprint)} label="Sprint W33" tone="info" />
        <Stat value={String(c.doing)} label="Doing" />
        <Stat value={String(c.review)} label="Review" tone="warning" />
      </Row>

      <Nav view={view} setView={setView} />

      <Callout tone="info" title="Contrat mutate">
        Select status = démo locale. « Appliquer via agent » ouvre un chat
        check-progress qui écrit les vrais fichiers + regen. Capture réelle
        reste une ligne dans inbox.md (ou futur t capture).
      </Callout>

      {view === "inbox" && (
        <Stack gap={12}>
          <H2>Inbox</H2>
          <Text tone="secondary" size="small">
            Une ligne, @tag, pas d’ID. Promote → tasks/.
          </Text>
          <Row gap={8} align="center" wrap>
            <TextInput
              value={capture}
              onChange={setCapture}
              placeholder="ex. fix overlay commentaires @erp"
              style={{ flex: 1, minWidth: 240 }}
            />
            <Button
              onClick={() => {
                const line = capture.trim();
                if (!line) return;
                setInbox((prev) => [line, ...prev]);
                setCapture("");
              }}
            >
              Capturer (local)
            </Button>
          </Row>
          <Table
            headers={["#", "Ligne"]}
            columnAlign={["right", "left"]}
            rows={inbox.map((line, i) => [String(i + 1), line])}
          />
          <PromoteInboxButton />
        </Stack>
      )}

      {view === "backlog" && (
        <Stack gap={16}>
          <H2>Backlog</H2>
          <Text tone="secondary" size="small">
            Clusters feature · source INDEX (snapshot). Pill = sélection.
          </Text>
          {projects.map((proj) => {
            const roots = tasks.filter(
              (x) => x.project === proj && !x.parent && x.status !== "done",
            );
            return (
              <Stack key={proj} gap={8}>
                <Text weight="semibold">{proj}</Text>
                {roots.map((root) => {
                  const children = tasks.filter(
                    (x) => x.parent === root.id && x.status !== "done",
                  );
                  return (
                    <Stack
                      key={root.id}
                      gap={4}
                      style={{
                        border: `1px solid ${theme.stroke.tertiary}`,
                        borderRadius: 8,
                        padding: 10,
                        background:
                          selectedId === root.id
                            ? theme.bg.elevated
                            : theme.bg.editor,
                      }}
                    >
                      <Row gap={8} align="center" wrap>
                        <Pill
                          active={selectedId === root.id}
                          onClick={() => setSelectedId(root.id)}
                        >
                          {GLYPH[root.status]} {root.id}
                        </Pill>
                        <Text weight="medium">{root.title}</Text>
                        <Pill size="sm">{root.kind}</Pill>
                        <Pill size="sm">{root.priority}</Pill>
                      </Row>
                      {children.map((ch) => (
                        <Row
                          key={ch.id}
                          gap={8}
                          align="center"
                          wrap
                          style={{ paddingLeft: 16 }}
                        >
                          <Pill
                            active={selectedId === ch.id}
                            onClick={() => setSelectedId(ch.id)}
                            size="sm"
                          >
                            {GLYPH[ch.status]} {ch.id}
                          </Pill>
                          <Text size="small">{ch.title}</Text>
                          <Pill size="sm" tone={statusTone(ch.status)}>
                            {ch.status}
                          </Pill>
                        </Row>
                      ))}
                    </Stack>
                  );
                })}
              </Stack>
            );
          })}
        </Stack>
      )}

      {view === "sprint" && (
        <Stack gap={16}>
          <H2>Sprint 2026-W33</H2>
          <Text tone="secondary" size="small">
            lun 10/08 → dim 16/08 · committed = champ sprint: posé
          </Text>
          <Table
            headers={["", "ID", "Titre", "P", "Status", "Assignee"]}
            columnAlign={["center", "left", "left", "center", "left", "left"]}
            rows={sprintTasks.map((x) => [
              GLYPH[x.status],
              <Pill
                key={x.id}
                active={selectedId === x.id}
                onClick={() => setSelectedId(x.id)}
                size="sm"
              >
                {x.id}
              </Pill>,
              x.title,
              x.priority,
              <Pill key={`${x.id}-s`} size="sm" tone={statusTone(x.status)}>
                {x.status}
              </Pill>,
              x.assignee,
            ])}
          />
          <Divider />
          <H2>Prêtes à commit (P1 tasks, hors sprint)</H2>
          <Table
            headers={["ID", "Titre", "Commit local", "Commit via agent"]}
            rows={readyCommit.map((x) => [
              x.id,
              x.title,
              <Button
                key={`${x.id}-l`}
                variant="secondary"
                onClick={() => {
                  commitLocal(x.id);
                  setSelectedId(x.id);
                }}
              >
                + W33 (démo)
              </Button>,
              <CommitAgentButton key={`${x.id}-a`} id={x.id} />,
            ])}
          />
        </Stack>
      )}

      {selected && (
        <>
          <Divider />
          <Stack gap={10}>
            <H2>
              {selected.id} — {selected.title}
            </H2>
            <Row gap={8} wrap>
              <Pill size="sm">{selected.kind}</Pill>
              <Pill size="sm">{selected.priority}</Pill>
              <Pill size="sm" tone={statusTone(selected.status)}>
                {selected.status}
              </Pill>
              <Pill size="sm">gate:{selected.gate || "—"}</Pill>
              <Pill size="sm">[{selected.assignee}]</Pill>
              {selected.sprint ? (
                <Pill size="sm" tone="info">
                  {selected.sprint}
                </Pill>
              ) : (
                <Pill size="sm">backlog</Pill>
              )}
              {selected.feature ? (
                <Pill size="sm">{selected.feature}</Pill>
              ) : null}
            </Row>
            <TaskRowActions task={selected} onStatus={setStatus} />
            <Text tone="secondary" size="small">
              UX figée : 3 vues · clusters feature · status Select + apply
              agent · pas de Kanban · pas d’auth.
            </Text>
          </Stack>
        </>
      )}

      <Spacer />
      <Text tone="tertiary" size="small">
        SSOT Git : raster/ux/raster-canvas-wireframe.canvas.tsx · Preview : canvases/
      </Text>
    </Stack>
  );
}
