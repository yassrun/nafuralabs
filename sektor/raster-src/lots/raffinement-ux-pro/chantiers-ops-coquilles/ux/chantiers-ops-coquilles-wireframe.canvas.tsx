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
  | "cause"
  | "labo"
  | "ouverture"
  | "hits"
  | "form"
  | "create"
  | "ops";

const VIEWS: { id: ViewId; label: string }[] = [
  { id: "cause", label: "Pourquoi vide" },
  { id: "labo", label: "Labo actuel" },
  { id: "ouverture", label: "Combobox vide" },
  { id: "hits", label: "q = QA" },
  { id: "form", label: "Affectation" },
  { id: "create", label: "Create etape 5" },
  { id: "ops", label: "Autres ops" },
];

const HITS: [string, string][] = [
  ["QA00000", "Owner QA"],
  ["QA00001", "Ingenieur QA"],
  ["QA00004", "Chef chantier QA"],
];

export default function ChantiersOpsCoquillesWireframe() {
  const [view, setView] = useCanvasState<ViewId>(
    "chantiers-ops-coquilles-view",
    "cause",
  );

  return (
    <Stack gap={16} style={{ maxWidth: 960, padding: 24 }}>
      <H1>Ops chantier — combobox, pas picker</H1>
      <Text tone="secondary">
        L’onglet Equipe n’a pas « zero employe ». Le lookup refuse le dump.
        On tape, une liste courte tombe. Le role chantier reste un select
        natif. L’article reste le picker overlay (autre lot).
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

      {view === "cause" && <VueCause />}
      {view === "labo" && <VueLabo />}
      {view === "ouverture" && <VueOuverture />}
      {view === "hits" && <VueHits />}
      {view === "form" && <VueForm />}
      {view === "create" && <VueCreate />}
      {view === "ops" && <VueOps />}

      <Spacer />
      <H2>Decisions UX</H2>
      <Stack gap={6}>
        <Text>
          Pas un employee picker. Meme geste que client / chantier : combobox
          inline, recherche serveur ≥ 2 car., oeil fiche RH.
        </Text>
        <Text>
          Role, meteo, type journal, noeud de ce chantier = select natif.
          Fournisseur ST = combobox partenaires, plus texte + id invente.
        </Text>
        <Text>
          Annuler / Enregistrer = cles chantier deja chargees, pas
          common.cancel.
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
  eye?: "fiche" | "liste" | false;
  native?: boolean;
  children?: import("react").ReactNode;
}) {
  const { label, value, placeholder, open, eye, native, children } = props;
  const theme = useHostTheme();
  return (
    <Stack gap={6} style={{ minWidth: 180, flex: 1 }}>
      <Text weight="semibold">{label}</Text>
      <Row gap={8} align="center">
        <div
          style={{
            flex: 1,
            border: `1px solid ${theme.stroke.primary}`,
            borderRadius: 8,
            background: theme.bg.elevated,
            padding: "8px 12px",
            minHeight: 36,
          }}
        >
          {value ? (
            <Text>{value}</Text>
          ) : (
            <Text tone="secondary">
              {placeholder ?? (native ? "—" : "Taper au moins 2 caracteres")}
            </Text>
          )}
        </div>
        {eye === "fiche" && (
          <Pill active size="sm">
            oeil fiche
          </Pill>
        )}
        {eye === "liste" && (
          <Pill size="sm">
            oeil liste
          </Pill>
        )}
      </Row>
      {open && (
        <div
          style={{
            border: `1px solid ${theme.stroke.secondary}`,
            borderRadius: 8,
            background: theme.bg.elevated,
            overflow: "hidden",
          }}
        >
          {children}
        </div>
      )}
    </Stack>
  );
}

function VueCause() {
  return (
    <Stack gap={12}>
      <H2>Les employes sont la</H2>
      <Callout tone="warning" title="Select vide ≠ seed vide">
        QaLocalEmployeProvisioner cree Owner QA, Chef chantier QA, etc. au
        boot Mode B. ErpLookupService.employes() sans q ≥ 2 rend []. Le
        select natif ne tape jamais → zero option.
      </Callout>
      <Table
        headers={["Appel", "Resultat", "UI Equipe aujourd’hui"]}
        rows={[
          [
            "employes('ACTIF') sans q",
            "[] (anti-dump, volontaire)",
            "dropdown « — »",
          ],
          [
            "GET /rh/employes?statut=ACTIF&q=QA",
            "Owner QA, Chef… + matricules",
            "injoignable depuis le select",
          ],
        ]}
      />
      <Text tone="secondary">
        Restaurer le dump casserait le contrat lookups. Brancher nf-select
        lookupKey=employes.
      </Text>
    </Stack>
  );
}

function VueLabo() {
  const theme = useHostTheme();
  return (
    <Stack gap={12}>
      <H2>Onglet Equipe — labo</H2>
      <Card>
        <CardHeader trailing={<Pill size="sm">Ajouter</Pill>}>
          Equipe · CH-2026-001
        </CardHeader>
        <CardBody>
          <Row gap={12} wrap>
            <FakeField label="Employe" native placeholder="—" />
            <FakeField label="Role chantier" native value="Chef de chantier" />
            <FakeField label="Debut" native value="28/08/2026" />
            <FakeField label="Fin" native placeholder="mm/dd/yyyy" />
          </Row>
          <Spacer />
          <Row gap={8}>
            <Pill size="sm">common.cancel</Pill>
            <Pill active size="sm">
              common.save
            </Pill>
          </Row>
          <Spacer />
          <div
            style={{
              padding: 16,
              border: `1px dashed ${theme.stroke.secondary}`,
              borderRadius: 8,
            }}
          >
            <Text tone="secondary">
              Aucune affectation. Affectez des employes a ce chantier avec un
              role.
            </Text>
          </div>
        </CardBody>
      </Card>
      <Text tone="secondary">
        Deux bugs visibles : controle FK faux, cles i18n hors namespace
        chantier (common.cancel au lieu de chantiers.common.actions.cancel).
      </Text>
    </Stack>
  );
}

function VueOuverture() {
  return (
    <Stack gap={12}>
      <H2>Ouverture — aucune option</H2>
      <FakeField
        label="Employe"
        placeholder="Taper au moins 2 caracteres"
        eye="liste"
        open
      >
        <Stack gap={4} style={{ padding: 12 }}>
          <Text tone="secondary">Aucun GET tant que &lt; 2 caracteres.</Text>
        </Stack>
      </FakeField>
      <Callout tone="info" title="Pas un empty-state metier">
        Le tableau sous le formulaire peut dire « Aucune affectation ». Le
        champ, lui, attend une frappe. Ne pas afficher « aucun employe en
        RH » a l’ouverture.
      </Callout>
    </Stack>
  );
}

function VueHits() {
  const theme = useHostTheme();
  return (
    <Stack gap={12}>
      <H2>q = QA</H2>
      <FakeField label="Employe" value="QA" open eye="liste">
        {HITS.map(([mat, nom], i) => (
          <div
            key={mat}
            style={{
              padding: "8px 12px",
              background:
                i === 0 ? theme.bg.secondary : theme.bg.elevated,
            }}
          >
            <Row gap={8} align="center">
              <Text weight="semibold">{mat}</Text>
              <Text>{nom}</Text>
            </Row>
          </div>
        ))}
      </FakeField>
      <Text tone="secondary">
        Matricule + nom. Entree valide. Pas d’UUID. Actifs seulement.
      </Text>
    </Stack>
  );
}

function VueForm() {
  return (
    <Stack gap={12}>
      <H2>Formulaire d’affectation</H2>
      <Card>
        <CardHeader>Ajouter une affectation</CardHeader>
        <CardBody>
          <Row gap={12} wrap>
            <FakeField
              label="Employe"
              value="Chef chantier QA · QA00004"
              eye="fiche"
            />
            <FakeField label="Role chantier" native value="Chef de chantier" />
            <FakeField label="Debut" native value="28/08/2026" />
            <FakeField label="Fin" native placeholder="optionnel" />
          </Row>
          <Spacer />
          <Row gap={8}>
            <Button variant="secondary" size="sm">
              Annuler
            </Button>
            <Button variant="primary" size="sm">
              Enregistrer
            </Button>
          </Row>
        </CardBody>
      </Card>
      <Text tone="secondary">
        Oeil fiche → /rh/employes/{"{id}"}. Role sans oeil. Dates natives.
      </Text>
    </Stack>
  );
}

function VueCreate() {
  return (
    <Stack gap={12}>
      <H2>Create chantier — titulaires</H2>
      <Stack gap={10} style={{ maxWidth: 480 }}>
        <FakeField label="Chef de chantier" eye="liste" />
        <FakeField label="Conducteur de travaux" eye="liste" />
        <FakeField label="Ingenieur" eye="liste" />
      </Stack>
      <Text tone="secondary">
        Trois fois le meme combobox. Pas trois dumps paralleles.
      </Text>
    </Stack>
  );
}

function VueOps() {
  return (
    <Stack gap={12}>
      <H2>Meme geste sur les autres coquilles</H2>
      <Table
        headers={["Ecran", "FK → combobox", "Reste natif"]}
        rows={[
          ["Attachement saisie", "chantier", "meteo, zone du chantier"],
          [
            "ST create",
            "chantier + fournisseur (id partenaire)",
            "noeud / poste de ce chantier",
          ],
          ["Journal", "chantier", "type d’entree"],
          ["Documents", "filtre + upload chantier", "categorie, noeud"],
          ["Avancement", "chantier (deja)", "ajout de ligne poste"],
        ]}
      />
      <Callout tone="neutral" title="ST">
        Aujourd’hui : input texte + sousTraitantId = st-timestamp. Cible :
        combobox fournisseurs, POST de l’UUID partenaire.
      </Callout>
    </Stack>
  );
}
