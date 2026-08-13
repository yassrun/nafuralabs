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
 * BC work — 3 écrans. SSOT: raster/pact/work/ux/work-wireframe.canvas.tsx
 * Preview: canvases/work-wireframe.canvas.tsx
 *
 * Décisions UX
 * - Arbre = parent: (lot → sous-lot → task)
 * - Sprint = champ sur la task ; sous-lot jamais sprintable
 * - Sans sprint: = backlog (reste dans l’arbre)
 * - Fallback manuel : éditer le .md / node raster/t.mjs index
 */

type ViewId = "inbox" | "backlog" | "sprint";

const SPRINT = "2026-W33";

export default function WorkWireframe() {
  const theme = useHostTheme();
  const [view, setView] = useCanvasState<ViewId>("view", "backlog");
  const accent = theme.accent;

  return (
    <Stack gap={16} style={{ maxWidth: 920 }}>
      <H1>Raster — BC work</H1>
      <Text tone="secondary">
        Tickets = raster-src. Pact n’est pas indexé. Capture + nav = socle.
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
      {view === "sprint" ? <SprintView /> : null}
      <Callout tone="neutral" title="Fallback manuel">
        Promote / sprint / status = frontmatter du fichier task. CLI : node
        raster/t.mjs index.
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
        Sans parent → reste ici. Pas de lot / sous-lot.
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
      <Text size="small" tone="secondary">
        Vide tant que inbox.md n’a pas de ligne. Hats vides ≠ inbox.
      </Text>
      <Text size="small" style={{ color: accent }}>
        AI-first : l’agent propose le parent ; fallback = select manuel.
      </Text>
    </Stack>
  );
}

function BacklogView({ accent }: { accent: string }) {
  return (
    <Stack gap={12}>
      <H2>Backlog — nafuralabs-migration</H2>
      <Row gap={8}>
        <Stat value="7" label="tasks" />
        <Stat value="0" label="en sprint (ce projet)" />
      </Row>
      <Card>
        <CardHeader trailing={<Pill tone="neutral">lot</Pill>}>
          MIG-01 strangler
        </CardHeader>
        <CardBody>
          <Stack gap={8}>
            <Row gap={8}>
              <Pill size="sm">sous-lot</Pill>
              <Text weight="semibold">MIG-10 squelettes</Text>
              <Text tone="secondary" size="small">
                pas sprintable
              </Text>
            </Row>
            <Row gap={8} style={{ paddingLeft: 20 }}>
              <Pill size="sm" tone="success">
                physical
              </Pill>
              <Text>MIG-11 dossiers canon</Text>
              <Pill size="sm">todo</Pill>
              <Pill size="sm">backlog</Pill>
            </Row>
            <Row gap={8}>
              <Pill size="sm">sous-lot</Pill>
              <Text weight="semibold">MIG-20 nafura-platform</Text>
            </Row>
            <Row gap={8} style={{ paddingLeft: 20 }}>
              <Pill size="sm" tone="info">
                feature
              </Pill>
              <Text>MIG-21 Pact baseline</Text>
              <Pill size="sm">todo</Pill>
              <Pill size="sm">backlog</Pill>
            </Row>
          </Stack>
        </CardBody>
      </Card>
      <Text size="small" style={{ color: accent }}>
        Commit → Sprint pose sprint: {SPRINT} sur la task, ne move pas le
        fichier.
      </Text>
    </Stack>
  );
}

function SprintView() {
  return (
    <Stack gap={12}>
      <H2>Sprint {SPRINT}</H2>
      <Text tone="secondary">
        Tous projets · uniquement kind:task avec sprint: {SPRINT}
      </Text>
      <Table
        headers={["Type", "ID", "Projet", "Titre", "Status"]}
        rows={[
          ["feature", "RAS-13", "raster", "Walker + API raster-src", "doing"],
          ["feature", "RAS-14", "raster", "e2e scan raster-src", "doing"],
        ]}
      />
    </Stack>
  );
}
