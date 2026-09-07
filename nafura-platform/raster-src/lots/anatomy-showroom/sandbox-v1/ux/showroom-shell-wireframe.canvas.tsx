import {
  Button,
  Callout,
  Card,
  CardBody,
  CardHeader,
  Code,
  Divider,
  Grid,
  H1,
  H2,
  H3,
  Pill,
  Row,
  Spacer,
  Stack,
  Table,
  Text,
  useCanvasState,
  useHostTheme,
} from "cursor/canvas";

/**
 * SSOT Git : nafura-platform/raster-src/lots/anatomy-showroom/sandbox-v1/ux/showroom-shell-wireframe.canvas.tsx
 * Preview IDE : canvases/showroom-shell-wireframe.canvas.tsx
 *
 * Décisions UX
 * - Showroom = mini-app platform (pas routes Sektor, pas Storybook SSOT)
 * - Nav : Archetypes (écrans) | Building blocks (atoms/molecules/organisms)
 * - details-1n ≠ master-slave : plein écran + listing embarqué vs split panes
 * - tree = archétype page, pas un viewMode de listing
 * - V1 : mocks in-memory, zéro auth
 * - Fallback : lien « code Anatomy » / doc pattern si démo absente (stub)
 */

type ViewId = "home" | "listing" | "details1n" | "tree" | "vide";

const ARCHETYPES = [
  { id: "listing", label: "nf-listing", status: "live", when: "Collection racine" },
  { id: "details", label: "nf-details", status: "live", when: "Form create/edit/view" },
  { id: "details1n", label: "nf-details-1n", status: "live", when: "Parent + listing(s) enfants" },
  { id: "masterSlave", label: "nf-master-slave", status: "live", when: "Split list|detail ou parent|lines" },
  { id: "tree", label: "nf-tree", status: "live", when: "Hiérarchie / WBS / plan" },
  { id: "wizard", label: "nf-wizard", status: "stub", when: "Création multi-étapes" },
  { id: "settings", label: "nf-settings", status: "stub", when: "Config explicite save" },
  { id: "dashboard", label: "nf-dashboard", status: "stub", when: "KPI / alertes" },
  { id: "documentWs", label: "nf-document-workspace", status: "stub", when: "Doc + lignes + ribbon" },
];

export default function ShowroomShellWireframe() {
  const theme = useHostTheme();
  const [view, setView] = useCanvasState<ViewId>("showroom-view", "home");

  return (
    <Stack gap={20} style={{ maxWidth: 1100 }}>
      <Stack gap={6}>
        <H1>Anatomy Showroom</H1>
        <Text tone="secondary">
          Sandbox navigable des archétypes d’écran et building blocks. Données mock.
          Pas de Keycloak.
        </Text>
      </Stack>

      <Row gap={8}>
        <Button variant={view === "home" ? "primary" : "secondary"} onClick={() => setView("home")}>
          Catalogue
        </Button>
        <Button
          variant={view === "listing" ? "primary" : "secondary"}
          onClick={() => setView("listing")}
        >
          Listing
        </Button>
        <Button
          variant={view === "details1n" ? "primary" : "secondary"}
          onClick={() => setView("details1n")}
        >
          Details-1N
        </Button>
        <Button variant={view === "tree" ? "primary" : "secondary"} onClick={() => setView("tree")}>
          Tree
        </Button>
        <Button variant={view === "vide" ? "primary" : "secondary"} onClick={() => setView("vide")}>
          Stub vide
        </Button>
      </Row>

      <Divider />

      <ShellFrame theme={theme}>
        {view === "home" ? <HomeCatalog /> : null}
        {view === "listing" ? <ListingDemo /> : null}
        {view === "details1n" ? <Details1nDemo /> : null}
        {view === "tree" ? <TreeDemo /> : null}
        {view === "vide" ? <StubEmpty /> : null}
      </ShellFrame>

      <Callout tone="neutral" title="When-to-use — 1-N">
        <Stack gap={8}>
          <Text>
            <Text weight="semibold">nf-details-1n</Text> — page détail pleine largeur, sections
            form + un ou plusieurs <Code>nf-entity-listing</Code> embarqués (onglets / zones).
            Ex. chantier → BL, équipes.
          </Text>
          <Text>
            <Text weight="semibold">nf-master-slave</Text> (entity-collection) — split panes :
            contexte parent | collection. Même relation 1-N, densité différente.
          </Text>
        </Stack>
      </Callout>

      <Callout tone="info" title="Fallback manuel">
        Archétype sans démo live → carte stub « bientôt » + lien vers le fichier Anatomy /
        pattern doc. Pas de page blanche silencieuse.
      </Callout>
    </Stack>
  );
}

function ShellFrame({
  theme,
  children,
}: {
  theme: ReturnType<typeof useHostTheme>;
  children: ReturnType<typeof HomeCatalog>;
}) {
  return (
    <Row
      gap={0}
      style={{
        border: `1px solid ${theme.stroke.secondary}`,
        borderRadius: 6,
        overflow: "hidden",
        minHeight: 420,
      }}
    >
      <Stack
        gap={12}
        style={{
          width: 220,
          flexShrink: 0,
          padding: 14,
          borderRight: `1px solid ${theme.stroke.tertiary}`,
          background: theme.bg.sidebar,
        }}
      >
        <Text weight="semibold" size="small">
          ANATOMY
        </Text>
        <Stack gap={4}>
          <Text weight="semibold" size="small" tone="secondary">
            Archetypes
          </Text>
          {["Listing", "Details", "Details-1N", "Master-slave", "Tree"].map((l) => (
            <Text key={l} size="small">
              {l}
            </Text>
          ))}
        </Stack>
        <Stack gap={4}>
          <Text weight="semibold" size="small" tone="secondary">
            Building blocks
          </Text>
          {["Atoms", "Molecules", "Organisms"].map((l) => (
            <Text key={l} size="small" tone="secondary">
              {l}
            </Text>
          ))}
        </Stack>
      </Stack>
      <Stack gap={12} style={{ flex: 1, padding: 16, minWidth: 0 }}>
        {children}
      </Stack>
    </Row>
  );
}

function HomeCatalog() {
  return (
    <Stack gap={14}>
      <Stack gap={4}>
        <H2>Catalogue</H2>
        <Text tone="secondary" size="small">
          Un clic = route démo. Live = interactif · Stub = carte + lien doc.
        </Text>
      </Stack>
      <Grid columns={3} gap={10}>
        {ARCHETYPES.map((a) => (
          <Card key={a.id} size="sm">
            <CardHeader
              title={a.label}
              trailing={
                <Pill tone={a.status === "live" ? "success" : "neutral"} size="sm">
                  {a.status}
                </Pill>
              }
            />
            <CardBody>
              <Text size="small" tone="secondary">
                {a.when}
              </Text>
            </CardBody>
          </Card>
        ))}
      </Grid>
    </Stack>
  );
}

function ListingDemo() {
  return (
    <Stack gap={12}>
      <Row justify="space-between" align="center">
        <Stack gap={2}>
          <H2>Products</H2>
          <Text size="small" tone="secondary">
            nf-listing · mock · click = select · dblclick = detail
          </Text>
        </Stack>
        <Button variant="primary">New</Button>
      </Row>
      <Row gap={8}>
        <Pill size="sm">Search…</Pill>
        <Pill size="sm" tone="neutral">
          Filters
        </Pill>
        <Pill size="sm" tone="neutral">
          Columns
        </Pill>
      </Row>
      <Table
        headers={["Code", "Name", "Status"]}
        rows={[
          ["PRD-01", "Ciment CPJ 45", "Active"],
          ["PRD-02", "Fer 12 mm", "Active"],
          ["PRD-03", "Sable 0/2", "Draft"],
        ]}
      />
      <Text size="small" tone="secondary">
        Pagination · 1–3 / 3
      </Text>
    </Stack>
  );
}

function Details1nDemo() {
  const theme = useHostTheme();
  return (
    <Stack gap={14}>
      <Row justify="space-between" align="center">
        <Stack gap={2}>
          <H2>Order ORD-1042</H2>
          <Text size="small" tone="secondary">
            nf-details-1n · header form + listing lignes
          </Text>
        </Stack>
        <Row gap={8}>
          <Button variant="secondary">Cancel</Button>
          <Button variant="primary">Save</Button>
        </Row>
      </Row>

      <Grid columns={2} gap={12}>
        <Stack gap={4}>
          <Text size="small" tone="secondary">
            Customer
          </Text>
          <Text>Atlas Bâtiment SA</Text>
        </Stack>
        <Stack gap={4}>
          <Text size="small" tone="secondary">
            Status
          </Text>
          <Pill size="sm" tone="warning">
            Draft
          </Pill>
        </Stack>
      </Grid>

      <Divider />

      <Stack gap={8}>
        <Row justify="space-between" align="center">
          <H3>Lines</H3>
          <Button variant="secondary">Add line</Button>
        </Row>
        <Text size="small" tone="secondary">
          Embarqué : même chrome listing (toolbar réduite + table), scoped au parent.
        </Text>
        <div
          style={{
            border: `1px solid ${theme.stroke.tertiary}`,
            borderRadius: 4,
            padding: 10,
          }}
        >
          <Table
            headers={["#", "Article", "Qty", "UoM"]}
            rows={[
              ["1", "Ciment CPJ 45", "40", "T"],
              ["2", "Fer 12 mm", "2.5", "T"],
            ]}
          />
        </div>
      </Stack>
    </Stack>
  );
}

function TreeDemo() {
  return (
    <Stack gap={12}>
      <Stack gap={2}>
        <H2>Plan comptable</H2>
        <Text size="small" tone="secondary">
          nf-tree · expand / select · actions nœud
        </Text>
      </Stack>
      <Stack gap={6}>
        <Text>▾ 1 — Comptes de capitaux</Text>
        <Text style={{ paddingLeft: 16 }}>▾ 11 — Capitaux propres</Text>
        <Text style={{ paddingLeft: 32 }} weight="semibold">
          · 111 — Capital social
        </Text>
        <Text style={{ paddingLeft: 32 }}>· 112 — Primes</Text>
        <Text>▸ 2 — Immobilisations</Text>
        <Text>▸ 3 — Stocks</Text>
      </Stack>
    </Stack>
  );
}

function StubEmpty() {
  return (
    <Stack gap={10}>
      <H2>nf-wizard</H2>
      <Callout tone="warning" title="Démo non branchée">
        Stub catalogue. Ouvrir{" "}
        <Code>lib/anatomy/pages/config-driven-wizard-page.class.ts</Code> ou le pattern UX
        Master-Slave / Wizard doc.
      </Callout>
      <Spacer />
      <Button variant="secondary">Ouvrir la doc pattern</Button>
    </Stack>
  );
}
