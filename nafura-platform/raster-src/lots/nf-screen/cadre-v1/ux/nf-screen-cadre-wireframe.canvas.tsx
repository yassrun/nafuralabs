import {
  Button,
  Callout,
  Divider,
  H1,
  H2,
  Pill,
  Row,
  Spacer,
  Stack,
  Table,
  Text,
  TextInput,
  useCanvasState,
} from "cursor/canvas";

/**
 * SSOT Raster : nafura-platform/raster-src/lots/nf-screen/cadre-v1/ux/
 * Cadre v1 — header + breadcrumbs + body. Cinq modules.
 */

type ViewId = "listing" | "detail" | "interdit";

const VIEWS: { id: ViewId; label: string }[] = [
  { id: "listing", label: "Listing (body)" },
  { id: "detail", label: "Fiche (body)" },
  { id: "interdit", label: "Interdit — stuffing" },
];

export default function NfScreenCadreWireframe() {
  const [view, setView] = useCanvasState<ViewId>("nf-screen-cadre-view", "listing");

  return (
    <Stack gap={16} style={{ maxWidth: 960, padding: 24 }}>
      <H1>nf-screen — cadre v1</H1>
      <Text tone="secondary">
        Une route = header + fil + body. Catalogue, études, achats, ventes et
        chantiers remplissent le body. Rien entre le titre et le contenu.
      </Text>

      <Row gap={8} wrap>
        {VIEWS.map((v) => (
          <span key={v.id}>
            <Button
              variant={view === v.id ? "primary" : "secondary"}
              onClick={() => setView(v.id)}
            >
              {v.label}
            </Button>
          </span>
        ))}
      </Row>

      <Divider />

      <ScreenChrome />
      {view === "listing" && <ListingBody />}
      {view === "detail" && <DetailBody />}
      {view === "interdit" && <Interdit />}

      <Spacer />
      <H2>Décisions gelées</H2>
      <Text>
        1. nf-screen enveloppe, ce n’est pas un pattern listing. 2. Fil =
        parents, pas un second titre. 3. Create = toolbar listing, pas le
        header. 4. Onglets fiche dans le body. 5. Cinq modules ; hors v1 =
        specials nommés.
      </Text>
    </Stack>
  );
}

function ScreenChrome() {
  return (
    <Stack gap={8}>
      <Row gap={8} wrap>
        <Pill>App shell</Pill>
        <Pill tone="info">nf-screen</Pill>
        <Pill>Achats</Pill>
        <Pill>Catalogue</Pill>
        <Pill>Études</Pill>
        <Pill>Ventes</Pill>
        <Pill>Chantiers</Pill>
      </Row>
      <Text tone="secondary">Cinq modules — même chrome</Text>
      <H2>Écran</H2>
    </Stack>
  );
}

function ListingBody() {
  return (
    <Stack gap={12}>
      <Callout tone="info">
        AC-3 / AC-5 — Pas de fil si le seul crumb = le titre. Recherche et
        Nouveau dans le listing, pas dans le header d’écran.
      </Callout>
      <Row gap={8} wrap>
        <TextInput placeholder="Rechercher…" />
        <Button variant="secondary">Filtres</Button>
        <Button variant="primary">Nouveau</Button>
      </Row>
      <Table
        headers={["Code", "Raison sociale", "Ville", "Statut"]}
        rows={[
          ["FRN-0142", "Béton Atlas", "Casablanca", "Actif"],
          ["FRN-0088", "Holcim Maroc", "Rabat", "Actif"],
          ["FRN-0210", "Sika", "Tanger", "Inactif"],
        ]}
      />
      <Text tone="secondary">1–20 sur 48</Text>
    </Stack>
  );
}

function DetailBody() {
  return (
    <Stack gap={12}>
      <Callout tone="info">
        AC-4 / AC-6 — Onglets dans le body. Contacts et Contrats ne passent pas
        entre le titre et le formulaire.
      </Callout>
      <H2>FRN-0142 — Béton Atlas</H2>
      <Row gap={8} wrap>
        <Pill tone="info">Informations</Pill>
        <Pill>Contacts</Pill>
        <Pill>Contrats</Pill>
        <Pill>Attestations</Pill>
        <Pill>Catalogue</Pill>
      </Row>
      <Table
        headers={["Champ", "Valeur"]}
        rows={[
          ["ICE", "001234567000089"],
          ["Ville", "Casablanca"],
          ["Statut", "Actif"],
        ]}
      />
    </Stack>
  );
}

function Interdit() {
  return (
    <Stack gap={12}>
      <Callout tone="danger">
        Interdit — chips / KPI / nav maison entre le header et le body. Actifs
        = filtre listing. Comparateur = autre route.
      </Callout>
      <Row gap={8} wrap>
        <Button variant="primary">Actifs</Button>
        <Button variant="secondary">Tous</Button>
        <Button variant="secondary">Comparateur</Button>
      </Row>
      <Text tone="secondary">
        Ce bandeau n’appartient pas à nf-screen. Il casse le cadre.
      </Text>
      <Table
        headers={["Code", "Raison sociale"]}
        rows={[["FRN-0142", "Béton Atlas"]]}
      />
    </Stack>
  );
}
