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
  Spacer,
  Stack,
  Table,
  Text,
  useCanvasState,
  useHostTheme,
} from "cursor/canvas";

type ViewId =
  | "labo-lignes"
  | "picker"
  | "location"
  | "parc-labo"
  | "parc-pro"
  | "hors";

const VIEWS: { id: ViewId; label: string }[] = [
  { id: "labo-lignes", label: "Labo lignes" },
  { id: "picker", label: "Picker stock" },
  { id: "location", label: "Emplacement" },
  { id: "parc-labo", label: "Parc labo" },
  { id: "parc-pro", label: "Parc MVP" },
  { id: "hors", label: "Hors v1" },
];

export default function CatalogueParcEtLignesWireframe() {
  const [view, setView] = useCanvasState<ViewId>(
    "catalogue-parc-et-lignes-view",
    "labo-lignes",
  );

  return (
    <Stack gap={16} style={{ maxWidth: 960, padding: 24 }}>
      <H1>Catalogue — lignes + parc GMAO</H1>
      <Text tone="secondary">
        Perte / inventaire : meme picker stock que reception. Emplacements :
        combobox socle, pas dump 500. Parc : pointage / pleins / affectation
        sortent du FormsModule texte UUID.
      </Text>

      <Callout tone="info" title="Deps soft (deja livrees)">
        socle-lookups-combobox + picker-article boucles 28/08. On branche, on
        ne reinvente pas l’atome.
      </Callout>

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

      {view === "labo-lignes" && <VueLaboLignes />}
      {view === "picker" && <VuePicker />}
      {view === "location" && <VueLocation />}
      {view === "parc-labo" && <VueParcLabo />}
      {view === "parc-pro" && <VueParcPro />}
      {view === "hors" && <VueHors />}

      <Spacer />
      <H2>Decisions UX</H2>
      <Stack gap={6}>
        <Text>
          Ligne article = picker overlay stock (pas combobox items). Cause
          perte = enum natif. Prefill inventaire garde le chargement soldes.
        </Text>
        <Text>
          Emplacement fiche / filtre = combobox locations (≥ 2 car.). Motifs
          perte = liste bornee, pas un typeahead partenaires.
        </Text>
        <Text>
          Parc MVP = 3 gestes (pointage, pleins, affectation). Pas de refonte
          entity-listing de tout materiel-parc.
        </Text>
      </Stack>
    </Stack>
  );
}

function FakeField(props: {
  label: string;
  value?: string;
  placeholder?: string;
  open?: boolean;
  eye?: boolean;
  native?: boolean;
  dump?: boolean;
  children?: import("react").ReactNode;
}) {
  const { label, value, placeholder, open, eye, native, dump, children } = props;
  const theme = useHostTheme();
  return (
    <Stack gap={6} style={{ minWidth: 180, flex: 1 }}>
      <Text weight="semibold">{label}</Text>
      <Row gap={8} align="center">
        <div
          style={{
            flex: 1,
            border: `1px solid ${theme.stroke.primary}`,
            borderRadius: native ? 4 : 8,
            padding: "8px 10px",
            background: dump
              ? "color-mix(in srgb, #c44 12%, transparent)"
              : theme.fill.secondary,
            minHeight: 36,
          }}
        >
          <Text tone={value ? "primary" : "secondary"}>
            {value ?? placeholder ?? (native ? "▾ select" : "Taper…")}
          </Text>
        </div>
        {eye && <Pill>oeil</Pill>}
      </Row>
      {open && children}
    </Stack>
  );
}

function VueLaboLignes() {
  return (
    <Stack gap={12}>
      <H2>Labo actuel — dump catalogue</H2>
      <Card>
        <CardHeader>perte-lines-editor</CardHeader>
        <CardBody>
          <Stack gap={8}>
            <Text>
              Au mount : <Text weight="semibold">loadArticles(activeOnly)</Text>{" "}
              → nf-select avec des centaines d’options. Reception est deja
              picker ; perte / inventaire / sortie sont restes derriere.
            </Text>
            <FakeField
              label="Article (ligne)"
              value="ART-001 — Ciment CPJ … (500 options)"
              dump
              native
            />
            <FakeField label="Cause" value="CASSE" native />
            <Callout tone="warning" title="FAIL contrat lookups / picker">
              Dump catalogue = exactement ce que picker-article a interdit.
            </Callout>
          </Stack>
        </CardBody>
      </Card>
    </Stack>
  );
}

function VuePicker() {
  const theme = useHostTheme();
  return (
    <Stack gap={12}>
      <H2>Cible — picker stock sur ligne</H2>
      <Card>
        <CardHeader>Fiche perte · lignes</CardHeader>
        <CardBody>
          <Stack gap={10}>
            <Row gap={8} align="center">
              <Button variant="secondary">+ Ajouter une ligne</Button>
            </Row>
            <Table
              headers={["Article", "Qty", "Cause", ""]}
              rows={[
                [
                  <Button key="p" variant="secondary">
                    Choisir un article
                  </Button>,
                  "—",
                  "AUTRE ▾",
                  "🗑",
                ],
                ["ART-0142 — Acier HA12", "12", "DECOUPE ▾", "🗑"],
              ]}
            />
            <div
              style={{
                border: `1px solid ${theme.stroke.primary}`,
                borderRadius: 8,
                padding: 12,
                background: theme.fill.secondary,
              }}
            >
              <Text weight="semibold">Overlay picker · contexte stock</Text>
              <Text tone="secondary">
                Ouverture vide. q ≥ 2 ou filtre nature. Natures stockables
                seulement. Pas de dump page 40.
              </Text>
              <Stack gap={4} style={{ marginTop: 8 }}>
                <Text>ART-0142 — Acier HA12 · ml · 12.50</Text>
                <Text>ART-0201 — Ciment CPJ45 · t · 890</Text>
              </Stack>
            </div>
          </Stack>
        </CardBody>
      </Card>
    </Stack>
  );
}

function VueLocation() {
  return (
    <Stack gap={12}>
      <H2>Emplacement — combobox, pas cache vide</H2>
      <Text tone="secondary">
        Inventaire filtre + fiche : allLocations. Perte fiche :
        chantierLocations. Le socle refuse le dump ; la facade ne doit pas
        poser [] comme seule source.
      </Text>
      <Row gap={12} wrap>
        <Card style={{ flex: 1, minWidth: 260 }}>
          <CardHeader>Ouverture</CardHeader>
          <CardBody>
            <FakeField
              label="Emplacement"
              placeholder="Taper ≥ 2 car."
              open
              eye
            >
              <Text tone="secondary">Aucune option — taper pour chercher</Text>
            </FakeField>
          </CardBody>
        </Card>
        <Card style={{ flex: 1, minWidth: 260 }}>
          <CardHeader>q = DEP</CardHeader>
          <CardBody>
            <FakeField label="Emplacement" value="DEP-CENTRAL" open eye>
              <Stack gap={4}>
                <Text>DEP-CENTRAL — Depot central</Text>
                <Text>DEP-NORD — Depot nord</Text>
              </Stack>
            </FakeField>
          </CardBody>
        </Card>
      </Row>
    </Stack>
  );
}

function VueParcLabo() {
  return (
    <Stack gap={12}>
      <H2>Parc GMAO — labo FormsModule</H2>
      <Card>
        <CardHeader>Pointage engins</CardHeader>
        <CardBody>
          <Stack gap={8}>
            <FakeField label="Engin" value="mat-001" dump />
            <FakeField label="Chantier" value="PROJ-2024-001" dump />
            <FakeField label="Heures" value="8" native />
            <Text tone="secondary">
              Texte libre + ids inventes. Pleins : select carnets dump. Pas
              d’oeil, pas de recherche.
            </Text>
          </Stack>
        </CardBody>
      </Card>
    </Stack>
  );
}

function VueParcPro() {
  return (
    <Stack gap={12}>
      <H2>Parc MVP — 3 gestes</H2>
      <Row gap={12} wrap>
        <Card style={{ flex: 1, minWidth: 240 }}>
          <CardHeader>Pointage</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <FakeField
                label="Engin"
                value="PEL-20 — Pelle 20 t"
                eye
                placeholder="code / nom"
              />
              <FakeField
                label="Chantier"
                value="CH-2026-001 — Al Qods"
                eye
              />
              <FakeField label="Heures" value="8" native />
            </Stack>
          </CardBody>
        </Card>
        <Card style={{ flex: 1, minWidth: 240 }}>
          <CardHeader>Pleins</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <FakeField label="Engin" placeholder="combobox materiels" eye />
              <FakeField
                label="Carnet (de cet engin)"
                value="Reservoir 400 L"
                native
              />
              <FakeField label="Litres" value="80" native />
            </Stack>
          </CardBody>
        </Card>
        <Card style={{ flex: 1, minWidth: 240 }}>
          <CardHeader>Affectation</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <FakeField label="Engin" placeholder="materiels" eye />
              <FakeField label="Chantier" placeholder="chantiers" eye />
              <Text tone="secondary">Dates natives. Pas d’UUID nu.</Text>
            </Stack>
          </CardBody>
        </Card>
      </Row>
    </Stack>
  );
}

function VueHors() {
  return (
    <Stack gap={12}>
      <H2>Hors v1</H2>
      <Stack gap={6}>
        <Text>• stock-balances pageSize 5000 (P2)</Text>
        <Text>• Refonte arbre familles / listing articles</Text>
        <Text>
          • Entity-listing complet OT / fiche 360 / planning / hub locations
        </Text>
        <Text>• CTA creer engin depuis le champ</Text>
      </Stack>
    </Stack>
  );
}
