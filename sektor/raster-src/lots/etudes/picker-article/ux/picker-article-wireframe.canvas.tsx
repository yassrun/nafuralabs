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
  | "ouverture"
  | "hits"
  | "filtres"
  | "loading"
  | "vide"
  | "erreur"
  | "dpu"
  | "stock"
  | "lookup"
  | "dirty";

const VIEWS: { id: ViewId; label: string }[] = [
  { id: "ouverture", label: "Ouverture vide" },
  { id: "hits", label: "Saisie + hits" },
  { id: "filtres", label: "Filtres" },
  { id: "loading", label: "Chargement" },
  { id: "vide", label: "Aucun resultat" },
  { id: "erreur", label: "Erreur reseau" },
  { id: "dpu", label: "Pied DPU" },
  { id: "stock", label: "Pied stock" },
  { id: "lookup", label: "Pied lookup" },
  { id: "dirty", label: "Selection" },
];

const NATURES = [
  "MATIERE",
  "CONSOMMABLE",
  "CARBURANT",
  "OUTILLAGE",
  "MATERIEL",
  "LOCATION",
  "MAIN_DOEUVRE",
  "SOUS_TRAITANCE",
  "SERVICE",
];

const STOCKABLES = ["MATIERE", "CONSOMMABLE", "CARBURANT", "OUTILLAGE"];

const HITS = [
  ["ART-CPJ45", "Ciment CPJ 45", "t", "1 180"],
  ["CIM-32", "Ciment CPJ 32,5", "t", "1 050"],
  ["SAB-01", "Sable 0/5 concasse", "m3", "220"],
];

export default function PickerArticleWireframe() {
  const [view, setView] = useCanvasState<ViewId>("picker-article-view", "ouverture");

  return (
    <Stack gap={16} style={{ maxWidth: 960, padding: 24 }}>
      <H1>Picker article partagé</H1>
      <Text tone="secondary">
        Un composant catalogue. Extraire reste le chemin IA. Ce picker est le
        fallback manuel — « Ajouter depuis le catalogue » en tête du panneau,
        pas sur chaque ligne. Pas un dialog études.
      </Text>

      <Callout tone="info" title="AI-first, manuel en fallback">
        Extraire classe les besoins (déjà sur le tenant / à créer). Ici on
        cherche un article déjà là. Pas de CTA Extraire ni « Créer dans le
        catalogue » dans ce dialog.
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

      {view === "ouverture" && <VueOuverture />}
      {view === "hits" && <VueHits />}
      {view === "filtres" && <VueFiltres />}
      {view === "loading" && <VueLoading />}
      {view === "vide" && <VueVide />}
      {view === "erreur" && <VueErreur />}
      {view === "dpu" && <VueDpu />}
      {view === "stock" && <VueStock />}
      {view === "lookup" && <VueLookup />}
      {view === "dirty" && <VueDirty />}

      <Spacer />
      <H2>Décisions UX</H2>
      <Stack gap={6}>
        <Text>
          Pas de dump à l’ouverture : aucun GET tant que ≥ 2 caractères ou un
          filtre posé par l’humain (nature, famille, lot d’usage). Ouverture
          DPU depuis le header, sans chip nature pré-rempli. Prompt de saisie,
          pas une liste.
        </Text>
        <Text>
          Recherche as-you-type, debounce ~300 ms, code + désignation. Code
          exact en tête. SKU / cleStable hors v1.
        </Text>
        <Text>
          Trois filtres serveur, pas un triplet Catégorie / Famille / Type.
          Famille = arbre item_categories (parent inclut enfants). Type = nature.
          Lot d’usage = GROS_OEUVRE, VRD, FINITIONS, SECOND_OEUVRE, TECHNIQUE.
        </Text>
        <Text>
          Pagination / scroll — pas de plafond 40. Actifs seulement par défaut.
          Unité + PU sur chaque hit. Clavier ↑↓ + Entrée.
        </Text>
        <Text>
          Pied selon le contexte : DPU = qty + PU tarif + « Ajouter au poste »
          (ouvert depuis le header, pas de nature pré-remplie) ; stock = natures
          stockables, pick seul ; lookup `items` (tarif / solde / tx) = article
          seul, toutes natures.
        </Text>
        <Text>
          0 hit : message clair. Créer / Extraire restent ailleurs (décompo,
          fiche articles). Erreur réseau : message + Relancer, dialog ouvert.
        </Text>
      </Stack>
    </Stack>
  );
}

function DialogShell({
  title,
  context,
  children,
}: {
  title: string;
  context: string;
  children?: Parameters<typeof CardBody>[0]["children"];
}) {
  return (
    <Card>
      <CardHeader trailing={<Pill size="sm">{context}</Pill>}>
        {title}
      </CardHeader>
      <CardBody>{children}</CardBody>
    </Card>
  );
}

function SearchBar({ value, placeholder }: { value: string; placeholder: string }) {
  const theme = useHostTheme();
  return (
    <div
      style={{
        padding: "8px 12px",
        background: theme.fill.tertiary,
        color: value ? theme.text.primary : theme.text.tertiary,
        border: `1px solid ${theme.stroke.secondary}`,
      }}
    >
      <Text as="span" size="small">
        {value || placeholder}
      </Text>
    </div>
  );
}

function NatureChips({
  natures,
  active,
}: {
  natures: string[];
  active?: string;
}) {
  return (
    <Row gap={6} wrap>
      {natures.map((n) => (
        <Pill key={n} size="sm" active={n === active}>
          {n}
        </Pill>
      ))}
    </Row>
  );
}

function FilterRow({
  famille,
  lot,
}: {
  famille: string;
  lot: string;
}) {
  return (
    <Row gap={12} wrap>
      <Text size="small" tone="secondary">
        Famille : {famille}
      </Text>
      <Text size="small" tone="secondary">
        Lot d’usage : {lot}
      </Text>
    </Row>
  );
}

function VueOuverture() {
  return (
    <Stack gap={12}>
      <Callout tone="warning" title="Pas de liste">
        Aucun GET catalogue. Le prompt demande une saisie ou un filtre — ce
        n’est pas un dump de 40 articles.
      </Callout>
      <DialogShell title="Choisir un article" context="DPU · Ajouter depuis le catalogue">
        <Stack gap={12}>
          <SearchBar
            value=""
            placeholder="Code ou désignation — 2 caractères min., ou poser un filtre"
          />
          <NatureChips natures={NATURES} />
          <FilterRow famille="Toutes" lot="Tous" />
          <Text tone="tertiary" size="small">
            Saisir ou filtrer pour chercher. Extraire reste dans le panneau
            décompo, pas ici.
          </Text>
        </Stack>
      </DialogShell>
    </Stack>
  );
}

function VueHits() {
  return (
    <Stack gap={12}>
      <Callout tone="success" title="Code exact en tête">
        Saisie « ART-CPJ45 » : le hit de code exact passe avant les désignations
        proches. Unité et PU visibles.
      </Callout>
      <DialogShell title="Choisir un article" context="DPU">
        <Stack gap={12}>
          <SearchBar value="ART-CPJ45" placeholder="" />
          <NatureChips natures={NATURES} />
          <FilterRow famille="Toutes" lot="Tous" />
          <Table
            headers={["Code", "Désignation", "Unité", "PU"]}
            rows={HITS}
            rowTone={["info", undefined, undefined]}
            striped
          />
          <Text size="small" tone="tertiary">
            ↑↓ pour parcourir · Entrée pour valider le hit focusé
          </Text>
        </Stack>
      </DialogShell>
    </Stack>
  );
}

function VueFiltres() {
  return (
    <Stack gap={12}>
      <Callout tone="info" title="Filtres serveur">
        Nature + famille parent « Liants » (enfants inclus) + lot GROS_OEUVRE.
        Un filtre seul, sans saisie, déclenche la recherche. Pas de Catégorie
        à côté de Famille.
      </Callout>
      <DialogShell title="Choisir un article" context="DPU">
        <Stack gap={12}>
          <SearchBar value="" placeholder="Filtre posé — recherche lancée sans saisie" />
          <NatureChips natures={NATURES} active="MATIERE" />
          <FilterRow famille="Liants (et enfants)" lot="GROS_OEUVRE" />
          <Table
            headers={["Code", "Désignation", "Unité", "PU"]}
            rows={[
              ["ART-CPJ45", "Ciment CPJ 45", "t", "1 180"],
              ["CIM-32", "Ciment CPJ 32,5", "t", "1 050"],
            ]}
            striped
          />
          <Text size="small" tone="tertiary">
            Suite au scroll — pas de plafond 40.
          </Text>
        </Stack>
      </DialogShell>
    </Stack>
  );
}

function VueLoading() {
  const theme = useHostTheme();
  return (
    <Stack gap={12}>
      <DialogShell title="Choisir un article" context="DPU">
        <Stack gap={12}>
          <SearchBar value="cim" placeholder="" />
          <NatureChips natures={NATURES} />
          <div
            style={{
              padding: 24,
              textAlign: "center",
              background: theme.fill.tertiary,
              color: theme.text.secondary,
            }}
          >
            <Text>Recherche…</Text>
          </div>
        </Stack>
      </DialogShell>
    </Stack>
  );
}

function VueVide() {
  return (
    <Stack gap={12}>
      <Callout tone="neutral" title="Créer n’est pas ici">
        Extraire / « Créer dans le catalogue » restent sur le panneau décompo
        et la fiche articles. Ce picker dit seulement qu’il n’a rien trouvé.
      </Callout>
      <DialogShell title="Choisir un article" context="DPU">
        <Stack gap={12}>
          <SearchBar value="xyzzy" placeholder="" />
          <NatureChips natures={NATURES} />
          <Text>Aucun article ne correspond. Affiner la saisie ou les filtres.</Text>
          <Row gap={8}>
            <Button variant="secondary" disabled>
              Extraire — ailleurs
            </Button>
            <Button variant="secondary" disabled>
              Créer dans le catalogue — ailleurs
            </Button>
          </Row>
        </Stack>
      </DialogShell>
    </Stack>
  );
}

function VueErreur() {
  return (
    <Stack gap={12}>
      <DialogShell title="Choisir un article" context="DPU">
        <Stack gap={12}>
          <SearchBar value="cim" placeholder="" />
          <Callout tone="danger" title="Recherche interrompue">
            Le catalogue n’a pas répondu. Le dialog reste ouvert.
          </Callout>
          <Button variant="primary">Relancer</Button>
        </Stack>
      </DialogShell>
    </Stack>
  );
}

function VueDpu() {
  return (
    <Stack gap={12}>
      <Callout tone="info" title="Pied étude">
        Ouvert depuis « Ajouter depuis le catalogue » en tête du panneau. Pas
        de chip nature pré-rempli. Qty + PU tarif, puis Ajouter au poste.
      </Callout>
      <DialogShell title="Choisir un article" context="DPU">
        <Stack gap={12}>
          <SearchBar value="ciment" placeholder="" />
          <NatureChips natures={NATURES} />
          <Table
            headers={["Code", "Désignation", "Unité", "PU"]}
            rows={[HITS[0]]}
            rowTone={["info"]}
          />
          <Row gap={12} align="center" justify="space-between">
            <Row gap={12} align="center">
              <Text size="small">Qté 1,00</Text>
              <Text size="small">PU tarif 1 180</Text>
            </Row>
            <Row gap={8}>
              <Button variant="secondary">Annuler</Button>
              <Button variant="primary">Ajouter au poste</Button>
            </Row>
          </Row>
        </Stack>
      </DialogShell>
    </Stack>
  );
}

function VueStock() {
  return (
    <Stack gap={12}>
      <Callout tone="info" title="Pied réception / retour / transfert">
        Natures stockables seulement. Pick seul — pas de qty ni tarif dans ce
        pied.
      </Callout>
      <DialogShell title="Choisir un article" context="Réception">
        <Stack gap={12}>
          <SearchBar value="ciment" placeholder="" />
          <NatureChips natures={STOCKABLES} active="MATIERE" />
          <Table
            headers={["Code", "Désignation", "Unité", "PU"]}
            rows={[
              ["ART-CPJ45", "Ciment CPJ 45", "t", "1 180"],
              ["SAB-01", "Sable 0/5 concasse", "m3", "220"],
            ]}
            rowTone={["info", undefined]}
          />
          <Row gap={8} justify="end">
            <Button variant="secondary">Annuler</Button>
            <Button variant="primary">Choisir</Button>
          </Row>
        </Stack>
      </DialogShell>
    </Stack>
  );
}

function VueLookup() {
  return (
    <Stack gap={12}>
      <Callout tone="info" title="Pied lookup items">
        Tarif / solde / inventory-tx — lookupKey `items`. Pick article seul,
        toutes natures actives. Pas de qty ni PU tarif dans le pied.
      </Callout>
      <DialogShell title="Choisir un article" context="Lookup · tarif">
        <Stack gap={12}>
          <SearchBar value="ciment" placeholder="" />
          <NatureChips natures={NATURES} />
          <Table
            headers={["Code", "Désignation", "Unité", "PU"]}
            rows={[
              ["ART-CPJ45", "Ciment CPJ 45", "t", "1 180"],
              ["CIM-32", "Ciment CPJ 32,5", "t", "1 050"],
            ]}
            rowTone={["info", undefined]}
          />
          <Row gap={8} justify="end">
            <Button variant="secondary">Annuler</Button>
            <Button variant="primary">Choisir</Button>
          </Row>
        </Stack>
      </DialogShell>
    </Stack>
  );
}

function VueDirty() {
  return (
    <Stack gap={12}>
      <Callout tone="warning" title="Sélection non encore ajoutée">
        Un hit est focusé. En DPU, qty / PU sont éditables. Fermer sans
        Ajouter / Choisir abandonne — le poste ne change pas.
      </Callout>
      <DialogShell title="Choisir un article" context="DPU · brouillon">
        <Stack gap={12}>
          <SearchBar value="ciment" placeholder="" />
          <NatureChips natures={NATURES} active="MATIERE" />
          <Table
            headers={["Code", "Désignation", "Unité", "PU"]}
            rows={HITS}
            rowTone={["info", undefined, undefined]}
          />
          <Row gap={12} align="center" justify="space-between">
            <Row gap={12}>
              <Text size="small" weight="semibold">
                Qté 1,25
              </Text>
              <Text size="small" weight="semibold">
                PU 1 180
              </Text>
            </Row>
            <Pill active>ART-CPJ45 sélectionné</Pill>
          </Row>
          <Row gap={8} justify="end">
            <Button variant="secondary">Annuler</Button>
            <Button variant="primary">Ajouter au poste</Button>
          </Row>
        </Stack>
      </DialogShell>
    </Stack>
  );
}
