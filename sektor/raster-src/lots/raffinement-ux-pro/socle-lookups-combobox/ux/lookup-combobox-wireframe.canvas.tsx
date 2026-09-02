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
  | "trois-gestes"
  | "ouverture"
  | "hits"
  | "choisi"
  | "vide-oeil"
  | "enum"
  | "aucun"
  | "erreur"
  | "filtre";

const VIEWS: { id: ViewId; label: string }[] = [
  { id: "trois-gestes", label: "3 gestes" },
  { id: "ouverture", label: "Ouverture vide" },
  { id: "hits", label: "Saisie + hits" },
  { id: "choisi", label: "Valeur + oeil fiche" },
  { id: "vide-oeil", label: "Vide + oeil liste" },
  { id: "enum", label: "Enum sans oeil" },
  { id: "aucun", label: "0 hit" },
  { id: "erreur", label: "Erreur reseau" },
  { id: "filtre", label: "Filtre listing" },
];

const HITS: [string, string][] = [
  ["FRN-0142", "Beton Atlas SARL"],
  ["FRN-0201", "Atlas Acier"],
  ["FRN-0088", "Atelier Bois Nord"],
];

export default function LookupComboboxWireframe() {
  const [view, setView] = useCanvasState<ViewId>("lookup-combobox-view", "trois-gestes");

  return (
    <Stack gap={16} style={{ maxWidth: 960, padding: 24 }}>
      <H1>Lookup combobox — pas un picker</H1>
      <Text tone="secondary">
        Champ de formulaire. On tape, une liste courte tombe, Entree valide.
        L’oeil ouvre la fiche si un id est pose, la liste du referentiel si le
        champ est vide. L’article reste le picker overlay (lot deja gele).
      </Text>

      <Callout tone="info" title="Un anatomy, trois cas">
        Enum ferme = select natif, pas d’oeil. FK metier = combobox + oeil si
        ecran. Pick riche (article) = picker, hors de ce lot.
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

      {view === "trois-gestes" && <VueGestes />}
      {view === "ouverture" && <VueOuverture />}
      {view === "hits" && <VueHits />}
      {view === "choisi" && <VueChoisi />}
      {view === "vide-oeil" && <VueVideOeil />}
      {view === "enum" && <VueEnum />}
      {view === "aucun" && <VueAucun />}
      {view === "erreur" && <VueErreur />}
      {view === "filtre" && <VueFiltre />}

      <Spacer />
      <H2>Decisions UX</H2>
      <Stack gap={6}>
        <Text>
          Pas de dump a l’ouverture : aucun GET collection tant que ≥ 2
          caracteres. Une valeur deja posee se resout par id, pas par un dump
          pour retrouver la ligne.
        </Text>
        <Text>
          Recherche as-you-type, debounce ~300 ms, code + raison sociale. Code
          exact en tete. Actifs seulement par defaut.
        </Text>
        <Text>
          Oeil : id pose → nouvel onglet fiche `/achats/fournisseurs/:id` (ou
          equivalent). Champ vide → liste. Pas d’oeil sur un enum, ni si la
          carte n’a pas de route.
        </Text>
        <Text>
          Valeur posee : libelle en lecture seule + croix dans le champ. Clic
          croix = champ vide, la saisie redevient possible. Pas de frappe tant
          qu’un id est pose.
        </Text>
        <Text>
          0 hit : message. Pas de CTA Creer dans le combobox v1. Article =
          picker deja tranche, pas ce champ.
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
  clear?: boolean;
  children?: import("react").ReactNode;
}) {
  const { label, value, placeholder, open, eye, clear, children } = props;
  const theme = useHostTheme();
  return (
    <Stack gap={6} style={{ maxWidth: 420 }}>
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
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          {value ? (
            <Text>{value}</Text>
          ) : (
            <Text tone="secondary">{placeholder ?? "Taper pour chercher…"}</Text>
          )}
          {clear && value ? (
            <Pill size="sm" title="Effacer">
              ×
            </Pill>
          ) : null}
        </div>
        {eye === "fiche" && (
          <Pill active size="sm" title="Ouvrir la fiche">
            oeil fiche
          </Pill>
        )}
        {eye === "liste" && (
          <Pill size="sm" title="Ouvrir la liste">
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

function VueGestes() {
  return (
    <Stack gap={12}>
      <H2>Pas un controle unique</H2>
      <Table
        headers={["Cas", "Controle", "Recherche", "Oeil"]}
        rows={[
          ["Type contrat, mode reglement", "select natif", "non", "non"],
          [
            "Client, fournisseur, chantier, employe",
            "combobox inline",
            "≥ 2 car. serveur",
            "oui si ecran",
          ],
          [
            "Article catalogue",
            "picker overlay",
            "deja gele",
            "hors lot",
          ],
        ]}
      />
      <Text tone="secondary">
        Client / fournisseur tombent dans la ligne 2. Un overlay « picker
        fournisseur » avec tableau serait trop lourd pour « je choisis un
        tiers et je reste sur le BC ».
      </Text>
    </Stack>
  );
}

function VueOuverture() {
  return (
    <Stack gap={12}>
      <H2>Ouverture — prompt, pas une liste</H2>
      <Card>
        <CardHeader>BC achat · fournisseur</CardHeader>
        <CardBody>
          <FakeField
            label="Fournisseur"
            placeholder="Taper au moins 2 caracteres"
            eye="liste"
          />
        </CardBody>
      </Card>
      <Callout tone="warning" title="AC-2">
        Aucun GET /partners a l’ouverture. L’oeil liste est la : le champ est
        vide, donc il ouvre /achats/fournisseurs — pas une fiche.
      </Callout>
    </Stack>
  );
}

function VueHits() {
  const theme = useHostTheme();
  return (
    <Stack gap={12}>
      <H2>Saisie — hits serveur</H2>
      <Card>
        <CardHeader>BC achat · fournisseur</CardHeader>
        <CardBody>
          <FakeField label="Fournisseur" value="at" open eye="liste">
            {HITS.map(([code, nom], i) => (
              <div
                key={code}
                style={{
                  padding: "8px 12px",
                  background: i === 0 ? theme.fill.tertiary : undefined,
                  borderTop: i ? `1px solid ${theme.stroke.tertiary}` : undefined,
                }}
              >
                <Row gap={8} align="center" justify="space-between">
                  <Text weight={i === 0 ? "semibold" : "normal"}>{nom}</Text>
                  <Text tone="secondary">{code}</Text>
                </Row>
              </div>
            ))}
          </FakeField>
        </CardBody>
      </Card>
      <Text tone="secondary">↑↓ focus · Entree valide le hit · Echap ferme.</Text>
    </Stack>
  );
}

function VueChoisi() {
  return (
    <Stack gap={12}>
      <H2>Valeur posee — oeil = fiche</H2>
      <Card>
        <CardHeader>Devis · client</CardHeader>
        <CardBody>
          <FakeField
            label="Client"
            value="CLI-0041 — Residence Atlas"
            eye="fiche"
            clear
          />
        </CardBody>
      </Card>
      <Callout tone="info" title="AC-6 + AC-15">
        Clic oeil → nouvel onglet /ventes/clients/&lt;id&gt;. Pas la liste. La
        session est conservee (comme l’oeil liste aujourd’hui). Croix dans le
        champ : | Residence Atlas  × | → champ vide, puis on retape. Pas de
        frappe tant qu’une valeur est posee.
      </Callout>
    </Stack>
  );
}

function VueVideOeil() {
  return (
    <Stack gap={12}>
      <H2>Champ vide — oeil = liste</H2>
      <FakeField label="Chantier" placeholder="Taper pour chercher…" eye="liste" />
      <Text tone="secondary">
        AC-7. Si le lookupKey n’est pas dans la carte : pas d’oeil (AC-8).
      </Text>
    </Stack>
  );
}

function VueEnum() {
  const theme = useHostTheme();
  return (
    <Stack gap={12}>
      <H2>Enum — select natif, pas d’oeil</H2>
      <Card>
        <CardHeader>Contrat fournisseur · type</CardHeader>
        <CardBody>
          <Stack gap={6} style={{ maxWidth: 420 }}>
            <Text weight="semibold">Type</Text>
            <div
              style={{
                border: `1px solid ${theme.stroke.primary}`,
                borderRadius: 8,
                padding: "8px 12px",
                background: theme.bg.elevated,
              }}
            >
              <Text>CADRE</Text>
            </div>
          </Stack>
        </CardBody>
      </Card>
      <Text tone="secondary">
        Type contrat, mode reglement, nature : liste fermee, courte. Pas de
        recherche, pas d’oeil, pas de GET.
      </Text>
    </Stack>
  );
}

function VueAucun() {
  return (
    <Stack gap={12}>
      <H2>0 hit</H2>
      <FakeField label="Fournisseur" value="zzqx" open eye="liste">
        <div style={{ padding: 12 }}>
          <Text tone="secondary">Aucun fournisseur pour « zzqx ».</Text>
        </div>
      </FakeField>
      <Callout tone="neutral" title="Hors v1">
        Pas de CTA Creer ici. Les routes create existent deja ; on les
        rebranchera plus tard.
      </Callout>
    </Stack>
  );
}

function VueErreur() {
  return (
    <Stack gap={12}>
      <H2>Reseau</H2>
      <FakeField
        label="Client"
        value="CLI-0041 — Residence Atlas"
        open
        eye="fiche"
      >
        <div style={{ padding: 12 }}>
          <Stack gap={8}>
            <Text>Recherche impossible. Reessayer.</Text>
            <Button variant="secondary">Relancer</Button>
          </Stack>
        </div>
      </FakeField>
      <Text tone="secondary">
        AC-10 : la valeur deja posee n’est pas effacee.
      </Text>
    </Stack>
  );
}

function VueFiltre() {
  return (
    <Stack gap={12}>
      <H2>Filtre listing — meme combobox</H2>
      <Card>
        <CardHeader>Factures vente · filtres</CardHeader>
        <CardBody>
          <Row gap={16} wrap>
            <FakeField label="Client" placeholder="Filtrer par client" />
            <FakeField label="Chantier" placeholder="Filtrer par chantier" />
          </Row>
        </CardBody>
      </Card>
      <Text tone="secondary">
        AC-12. Pas un select natif de 500 clients. L’oeil sur un filtre est
        optionnel ; s’il est la, les memes regles fiche / liste s’appliquent.
      </Text>
    </Stack>
  );
}
