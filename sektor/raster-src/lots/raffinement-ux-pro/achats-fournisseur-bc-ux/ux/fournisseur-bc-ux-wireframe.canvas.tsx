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
  useHostTheme,
} from "cursor/canvas";

/**
 * Achats — fournisseur catalogue + comparateur + réception BC
 * Source Raster : raffinement-ux-pro/achats-fournisseur-bc-ux/ux/
 */

type ViewId =
  | "labo"
  | "cat-table"
  | "cat-form"
  | "cat-picker"
  | "cat-vide"
  | "comparateur"
  | "cmp-offres"
  | "bc-labo"
  | "bc-combobox";

const VIEWS: { id: ViewId; label: string }[] = [
  { id: "labo", label: "Labo UUID" },
  { id: "cat-table", label: "Catalogue OK" },
  { id: "cat-form", label: "Formulaire" },
  { id: "cat-picker", label: "Picker" },
  { id: "cat-vide", label: "Catalogue vide" },
  { id: "comparateur", label: "Comparateur" },
  { id: "cmp-offres", label: "Offres" },
  { id: "bc-labo", label: "BC labo" },
  { id: "bc-combobox", label: "BC depot" },
];

export default function FournisseurBcUxWireframe() {
  const [view, setView] = useCanvasState<ViewId>(
    "fournisseur-bc-ux-view",
    "labo",
  );

  return (
    <Stack gap={16} style={{ maxWidth: 960, padding: 24 }}>
      <H1>Fournisseur & BC — plus d UUID nu</H1>
      <Text tone="secondary">
        Catalogue fournisseur : picker article + libelles. Comparateur : pick
        article, pas champ UUID. Reception BC : combobox depot, option vide =
        livraison directe chantier.
      </Text>

      <Row gap={8} wrap>
        {VIEWS.map((v) => (
          <Button
            key={v.id}
            variant={view === v.id ? "primary" : "secondary"}
            onClick={() => setView(v.id)}
          >
            {v.label}
          </Button>
        ))}
      </Row>

      <Divider />

      {view === "labo" && <VueLabo />}
      {view === "cat-table" && <VueCatTable />}
      {view === "cat-form" && <VueCatForm />}
      {view === "cat-picker" && <VueCatPicker />}
      {view === "cat-vide" && <VueCatVide />}
      {view === "comparateur" && <VueComparateur />}
      {view === "cmp-offres" && <VueCmpOffres />}
      {view === "bc-labo" && <VueBcLabo />}
      {view === "bc-combobox" && <VueBcCombobox />}

      <Spacer />
      <H2>Decisions UX</H2>
      <Stack gap={6}>
        <Text>
          Article = picker overlay partage (pied lookup). Pas un input UUID, pas
          un combobox items dumpable.
        </Text>
        <Text>
          UOM commerciale / conditionnement = combobox lookup socle. Attestations
          = hors scope (enum natif OK).
        </Text>
        <Text>
          Depot reception BC = combobox locations ≥ 2 car. Valeur vide conserve
          « livraison directe chantier ».
        </Text>
      </Stack>
    </Stack>
  );
}

function ChromeAchats() {
  return (
    <Row gap={8} wrap>
      <Pill>Achats</Pill>
      <Pill tone="info">Fournisseurs</Pill>
      <Pill>Commandes</Pill>
    </Row>
  );
}

function FakeField(props: {
  label: string;
  value?: string;
  placeholder?: string;
  open?: boolean;
  eye?: boolean;
  native?: boolean;
  children?: import("react").ReactNode;
}) {
  const { label, value, placeholder, open, eye, native, children } = props;
  const theme = useHostTheme();
  return (
    <Stack gap={6} style={{ minWidth: 200, flex: 1 }}>
      <Text weight="semibold">{label}</Text>
      <Row gap={8} align="center">
        <div
          style={{
            flex: 1,
            border: `1px solid ${theme.stroke.primary}`,
            borderRadius: 6,
            padding: "8px 10px",
            background: native
              ? theme.fill.secondary
              : theme.fill.primary,
          }}
        >
          <Text tone={value ? "primary" : "secondary"}>
            {value || placeholder || "—"}
          </Text>
        </div>
        {eye ? <Button variant="secondary">Oeil</Button> : null}
      </Row>
      {open ? (
        <Stack
          gap={4}
          style={{
            border: `1px solid ${theme.stroke.primary}`,
            borderRadius: 6,
            padding: 8,
          }}
        >
          {children}
        </Stack>
      ) : null}
    </Stack>
  );
}

function VueLabo() {
  return (
    <Stack gap={12}>
      <ChromeAchats />
      <Callout tone="warning">
        Mort — input « UUID article », colonne articleId, select depot dump /
        vide (locations() sans q).
      </Callout>
      <Table
        headers={["Article", "Ref. fourn.", "Prix HT", "Actif"]}
        rows={[
          ["a1b2c3d4-…", "REF-LAF-01", "85,00", "Oui"],
          ["e5f6…", "REF-SIK-02", "12,40", "Oui"],
        ]}
      />
      <FakeField
        label="Article ID"
        placeholder="UUID article"
        native
      />
      <FakeField
        label="Depot / magasin"
        value="(select peuplé ou vide)"
        native
      />
    </Stack>
  );
}

function VueCatTable() {
  return (
    <Stack gap={12}>
      <ChromeAchats />
      <H2>Fiche fournisseur · Catalogue</H2>
      <Callout tone="info">AC-1 — code + designation, pas UUID.</Callout>
      <Table
        headers={["Article", "Ref. fourn.", "Designation", "Prix HT", "Actif", ""]}
        rows={[
          ["ciment-cpj-45", "REF-LAF-01", "Ciment CPJ 45", "85,00", "Oui", "Modifier"],
          ["sable-de-dune", "REF-SIK-02", "Sable de dune", "12,40", "Oui", "Modifier"],
        ]}
      />
    </Stack>
  );
}

function VueCatForm() {
  return (
    <Stack gap={12}>
      <ChromeAchats />
      <H2>Nouvelle ligne catalogue</H2>
      <Callout tone="info">AC-2…AC-6 — picker + combobox UOM.</Callout>
      <Row gap={12} wrap>
        <Stack gap={6} style={{ flex: 1, minWidth: 240 }}>
          <Text weight="semibold">Article *</Text>
          <Row gap={8}>
            <Pill tone="info">ciment-cpj-45 — Ciment CPJ 45</Pill>
            <Button variant="secondary">Changer</Button>
          </Row>
        </Stack>
        <FakeField label="UOM commerciale *" value="T — Tonne" eye open={false} />
      </Row>
      <Row gap={12} wrap>
        <FakeField label="Ref. fournisseur" value="REF-LAF-01" />
        <FakeField label="Prix commercial HT" value="85,00" />
        <FakeField label="Conditionnement UOM" placeholder="Optionnel — taper ≥ 2" eye />
      </Row>
      <Row gap={8}>
        <Button variant="primary">Enregistrer</Button>
        <Button variant="secondary">Annuler</Button>
      </Row>
    </Stack>
  );
}

function VueCatPicker() {
  return (
    <Stack gap={12}>
      <ChromeAchats />
      <H2>Picker article (overlay)</H2>
      <Callout tone="info">AC-3 — ouverture vide, q ≥ 2, pied pick seul.</Callout>
      <Stack
        gap={10}
        style={{
          border: "1px solid var(--stroke, #ccc)",
          borderRadius: 8,
          padding: 16,
        }}
      >
        <Text weight="semibold">Choisir un article</Text>
        <TextInput placeholder="Code ou designation (≥ 2 car.)" />
        <Table
          headers={["Code", "Designation", "U", "PU"]}
          rows={[
            ["ciment-cpj-45", "Ciment CPJ 45", "T", "90"],
            ["ciment-cpj-35", "Ciment CPJ 35", "T", "82"],
          ]}
        />
        <Row gap={8}>
          <Button variant="primary">Choisir</Button>
          <Button variant="secondary">Fermer</Button>
        </Row>
      </Stack>
    </Stack>
  );
}

function VueCatVide() {
  return (
    <Stack gap={12}>
      <ChromeAchats />
      <H2>Catalogue fournisseur</H2>
      <Callout tone="neutral">AC-8 — empty-state metier.</Callout>
      <Text>Aucune ligne catalogue pour ce fournisseur.</Text>
      <Button variant="primary">+ Ajouter une ligne</Button>
    </Stack>
  );
}

function VueComparateur() {
  return (
    <Stack gap={12}>
      <ChromeAchats />
      <H2>Comparateur fournisseurs</H2>
      <Callout tone="info">AC-9, AC-10 — pick article, date native.</Callout>
      <Row gap={12} wrap align="end">
        <Stack gap={6} style={{ flex: 1, minWidth: 240 }}>
          <Text weight="semibold">Article *</Text>
          <Row gap={8}>
            <Button variant="secondary">Choisir un article…</Button>
          </Row>
          <Text tone="secondary">Pas de champ UUID.</Text>
        </Stack>
        <FakeField label="Date de reference" value="28/08/2026" native />
        <Button variant="primary">Comparer</Button>
      </Row>
    </Stack>
  );
}

function VueCmpOffres() {
  return (
    <Stack gap={12}>
      <ChromeAchats />
      <H2>Offres — ciment-cpj-45</H2>
      <Callout tone="info">AC-11, AC-12 — designation fournisseur lisible.</Callout>
      <Table
        headers={["Fournisseur", "Conditionnement", "Prix commercial", "Comparable", "Delai"]}
        rows={[
          ["Lafarge · meilleur", "1 T", "85,00", "85,00 / T", "5 j"],
          ["Sika", "25 kg", "3,20", "128,00 / T", "7 j"],
          ["Acme (perime)", "1 T", "80,00", "80,00 / T", "—"],
        ]}
      />
    </Stack>
  );
}

function VueBcLabo() {
  return (
    <Stack gap={12}>
      <Row gap={8} wrap>
        <Pill>Achats</Pill>
        <Pill tone="info">BC-2026-0012</Pill>
      </Row>
      <Callout tone="warning">
        Labo — select depot via locations() sans q → liste vide apres anti-dump
        socle.
      </Callout>
      <H2>Nouvelle reception</H2>
      <FakeField
        label="Depot / magasin"
        value="(select natif — options absentes ou dump)"
        native
      />
    </Stack>
  );
}

function VueBcCombobox() {
  const theme = useHostTheme();
  return (
    <Stack gap={12}>
      <Row gap={8} wrap>
        <Pill>Achats</Pill>
        <Pill tone="info">BC-2026-0012</Pill>
      </Row>
      <Callout tone="info">
        AC-13…AC-16 — combobox locations ; vide = livraison directe.
      </Callout>
      <H2>Nouvelle reception</H2>
      <FakeField
        label="Depot / magasin (optionnel)"
        placeholder="Taper ≥ 2 car. — ou laisser vide"
        open
        eye
      >
        <Text tone="secondary" style={{ fontSize: 12 }}>
          Aucune option tant que q &lt; 2
        </Text>
        <div
          style={{
            marginTop: 6,
            padding: 6,
            borderRadius: 4,
            background: theme.fill.secondary,
          }}
        >
          <Text>DEP-01 — Entrepot central (WAREHOUSE)</Text>
        </div>
        <div style={{ padding: 6 }}>
          <Text>DEP-02 — Magasin chantier Nord</Text>
        </div>
      </FakeField>
      <FakeField label="N° BL fournisseur" placeholder="BL-…" />
      <Table
        headers={["Article", "Reste", "Qte recue"]}
        rows={[
          ["ciment-cpj-45", "10", "10"],
          ["sable-de-dune", "5", "5"],
        ]}
      />
      <Row gap={8}>
        <Button variant="primary">Valider reception</Button>
        <Button variant="secondary">Annuler</Button>
      </Row>
      <Text tone="secondary">
        Valeur vide = « Livraison directe chantier — sans magasin ».
      </Text>
    </Stack>
  );
}
