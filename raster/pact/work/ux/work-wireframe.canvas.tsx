import {
  Button,
  Callout,
  Card,
  CardBody,
  CardHeader,
  Divider,
  H1,
  H2,
  Pill,
  Row,
  Stack,
  Stat,
  Table,
  Text,
  TextInput,
  useCanvasState,
  useHostTheme,
} from "cursor/canvas";

/**
 * BC work — SSOT: raster/pact/work/ux/work-wireframe.canvas.tsx
 * Preview: canvases/work-wireframe.canvas.tsx
 *
 * Décisions UX
 * - Arbre = parent: (lot → sous-lot → task)
 * - Sprint = champ sur la task ; sous-lot jamais sprintable
 * - type: + agent_type: (pill distincte) ; filtre Spec | Exec | QA
 * - CTA Lancer = copie brief Cursor (skill @nafura-*) ; sous-lot Pact = Lancer orchestrateur
 * - Fallback manuel : éditer le .md / node raster/t.mjs index
 * - Feature/bug : exec → review ; spec consolide SPEC+UX ; QA pose done-agent
 * - Orchestrateur = un CH (sous-lot) à la fois, pas le sprint entier
 */

type ViewId = "inbox" | "backlog" | "sprint";
type AgentFilter = "all" | "spec" | "exec" | "qa";

const SPRINT = "2026-W33";

const SPRINT_ROWS = [
  {
    type: "spec",
    agent: "spec",
    id: "RAS-31",
    project: "raster",
    title: "SPEC + canvas agents",
    status: "doing",
    skill: "@nafura-spec",
    file: "raster/raster-src/lots/work/CH-01-EVOL-agents/tasks/RAS-31-update-spec-ux-agents.md",
    blocked: "—",
  },
  {
    type: "feature",
    agent: "exec",
    id: "RAS-32",
    project: "raster",
    title: "Walker type + agent_type",
    status: "todo",
    skill: "@nafura-exec",
    file: "raster/raster-src/lots/work/CH-01-EVOL-agents/tasks/RAS-32-walker-agent-type.md",
    blocked: "RAS-31",
  },
  {
    type: "feature",
    agent: "exec",
    id: "RAS-33",
    project: "raster",
    title: "UI filtre + CTA Lancer",
    status: "todo",
    skill: "@nafura-exec",
    file: "raster/raster-src/lots/work/CH-01-EVOL-agents/tasks/RAS-33-ui-filtre-lancer.md",
    blocked: "RAS-31",
  },
  {
    type: "qa",
    agent: "qa",
    id: "RAS-34",
    project: "raster",
    title: "QA pack agents",
    status: "todo",
    skill: "@nafura-qa",
    file: "raster/raster-src/lots/work/CH-01-EVOL-agents/tasks/RAS-34-qa-agents.md",
    blocked: "RAS-32, RAS-33",
  },
];

export default function WorkWireframe() {
  const theme = useHostTheme();
  const [view, setView] = useCanvasState<ViewId>("view", "sprint");
  const accent = theme.accent;

  return (
    <Stack gap={16} style={{ maxWidth: 960 }}>
      <H1>Raster — BC work</H1>
      <Text tone="secondary">
        Tickets = raster-src. Pact n’est pas indexé. Capture + nav = socle.
        Agents = spec / exec / qa (champ agent_type).
      </Text>
      <Row gap={8}>
        <Button
          variant={view === "inbox" ? "primary" : "secondary"}
          onClick={() => setView("inbox")}
        >
          Inbox
        </Button>
        <Button
          variant={view === "backlog" ? "primary" : "secondary"}
          onClick={() => setView("backlog")}
        >
          Backlog
        </Button>
        <Button
          variant={view === "sprint" ? "primary" : "secondary"}
          onClick={() => setView("sprint")}
        >
          Sprint {SPRINT}
        </Button>
      </Row>
      <Divider />
      {view === "inbox" ? <InboxView accent={accent} /> : null}
      {view === "backlog" ? <BacklogView accent={accent} /> : null}
      {view === "sprint" ? <SprintView accent={accent} /> : null}
      <Callout tone="neutral" title="Fallback manuel">
        Promote / sprint / status / agent_type = frontmatter du fichier task.
        CLI : node raster/t.mjs index. Lancer agent = coller le brief dans
        Cursor.
      </Callout>
    </Stack>
  );
}

function InboxView({ accent }: { accent: string }) {
  return (
    <Stack gap={12}>
      <H2>Inbox globale</H2>
      <Text tone="secondary">
        raster/inbox.md — seule source. Ligne = task draft (description).
        @spec @qa @bug @physical posent type + agent_type à la promote.
      </Text>
      <TextInput placeholder="capture < 5 s" />
      <Table
        headers={["Ligne", "Projet", "Rattacher", ""]}
        rows={[
          [
            "dossiers canon vides",
            "nafuralabs-migration",
            "sous-lot MIG-10",
            "Promouvoir",
          ],
        ]}
      />
      <Text size="small" style={{ color: accent }}>
        AI-first : l’agent propose le parent ; fallback = select manuel.
      </Text>
    </Stack>
  );
}

function BacklogView({ accent }: { accent: string }) {
  return (
    <Stack gap={12}>
      <H2>Backlog — raster</H2>
      <Row gap={8}>
        <Stat value="4" label="tasks CH-01" />
        <Stat value="4" label="en sprint" />
      </Row>
      <Card>
        <CardHeader trailing={<Pill tone="neutral">lot</Pill>}>
          RAS-10 work
        </CardHeader>
        <CardBody>
          <Stack gap={8}>
            <Row gap={8}>
              <Pill size="sm">sous-lot</Pill>
              <Text weight="semibold">RAS-30 CH-01 agents</Text>
              <Text tone="secondary" size="small">
                pas sprintable
              </Text>
              <Button variant="primary">Lancer orchestrateur</Button>
            </Row>
            <Row gap={8} style={{ paddingLeft: 20 }}>
              <Pill size="sm" tone="neutral">
                spec
              </Pill>
              <Pill size="sm">spec</Pill>
              <Text>RAS-31 SPEC + canvas</Text>
              <Pill size="sm" tone="warning">
                doing
              </Pill>
            </Row>
            <Row gap={8} style={{ paddingLeft: 20 }}>
              <Pill size="sm" tone="info">
                feature
              </Pill>
              <Pill size="sm">exec</Pill>
              <Text>RAS-32 walker</Text>
              <Pill size="sm">todo</Pill>
            </Row>
            <Row gap={8} style={{ paddingLeft: 20 }}>
              <Pill size="sm" tone="info">
                feature
              </Pill>
              <Pill size="sm">exec</Pill>
              <Text>RAS-33 UI Lancer</Text>
              <Pill size="sm">todo</Pill>
            </Row>
            <Row gap={8} style={{ paddingLeft: 20 }}>
              <Pill size="sm" tone="success">
                qa
              </Pill>
              <Pill size="sm">qa</Pill>
              <Text>RAS-34 QA pack</Text>
              <Pill size="sm">todo</Pill>
            </Row>
          </Stack>
        </CardBody>
      </Card>
      <Text size="small" style={{ color: accent }}>
        Première pill = type (travail). Deuxième = agent_type (skill).
      </Text>
    </Stack>
  );
}

function SprintView({ accent }: { accent: string }) {
  const [filter, setFilter] = useCanvasState<AgentFilter>("agent", "all");
  const [picked, setPicked] = useCanvasState<string>("picked", "RAS-31");
  const rows = SPRINT_ROWS.filter(
    (r) => filter === "all" || r.agent === filter
  );
  const selected = SPRINT_ROWS.find((r) => r.id === picked) || rows[0];

  return (
    <Stack gap={12}>
      <H2>Sprint {SPRINT}</H2>
      <Text tone="secondary">
        Tous projets · kind:task avec sprint: {SPRINT} · filtre agent_type ·
        orch = par sous-lot Pact
      </Text>
      <Row gap={8} style={{ alignItems: "center" }}>
        <Pill size="sm">sous-lot</Pill>
        <Text weight="semibold">RAS-30 CH-01 agents</Text>
        <Button variant="primary">Lancer orchestrateur</Button>
      </Row>
      <Text size="small" style={{ color: accent }}>
        Un CH à la fois : spec → exec → spec (MAJ SPEC+UX) → qa (MAJ ou créer)
        → done-agent. Skill @nafura-orch. Pas de CTA sprint entier.
      </Text>
      <Row gap={8}>
        {(
          [
            ["all", "All"],
            ["spec", "Spec"],
            ["exec", "Exec"],
            ["qa", "QA"],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            variant={filter === id ? "primary" : "secondary"}
            onClick={() => setFilter(id)}
          >
            {label}
          </Button>
        ))}
      </Row>
      <Row gap={8}>
        <Stat value={String(rows.length)} label="visibles" />
        <Stat value="1" label="doing" />
      </Row>
      <Table
        headers={["Type", "Agent", "ID", "Projet", "Titre", "Status"]}
        rows={rows.map((r) => [
          r.type,
          r.agent,
          r.id,
          r.project,
          r.title,
          r.status,
        ])}
      />
      <Text size="small" tone="secondary">
        Clic ID → détail à droite (ici dessous dans le wireframe).
      </Text>
      {selected ? (
        <Card>
          <CardHeader
            trailing={
              <Row gap={6}>
                <Pill size="sm">{selected.type}</Pill>
                <Pill size="sm" tone="info">
                  {selected.agent}
                </Pill>
              </Row>
            }
          >
            {selected.id} · {selected.title}
          </CardHeader>
          <CardBody>
            <Stack gap={8}>
              <Text size="small" tone="secondary">
                {selected.file}
              </Text>
              <Text size="small">blocked_by: {selected.blocked}</Text>
              <Row gap={8}>
                <Button
                  variant="primary"
                  onClick={() => setPicked(selected.id)}
                >
                  Lancer agent {selected.agent}
                </Button>
                <Button variant="secondary">→ Sprint (déjà)</Button>
              </Row>
              <Text size="small" style={{ color: accent }}>
                CTA copie un brief : skill {selected.skill} · id {selected.id} ·
                coller dans Cursor. Pas de spawn SDK.
              </Text>
            </Stack>
          </CardBody>
        </Card>
      ) : null}
    </Stack>
  );
}
