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
} from "cursor/canvas";

type ViewId =
  | "carte"
  | "etude"
  | "cockpit"
  | "matiere"
  | "st"
  | "mois"
  | "preuve";

const VIEWS: { id: ViewId; label: string }[] = [
  { id: "carte", label: "Carte STE" },
  { id: "etude", label: "Fabrique etude" },
  { id: "cockpit", label: "Cockpit du jour" },
  { id: "matiere", label: "DA et BL" },
  { id: "st", label: "ST sur poste" },
  { id: "mois", label: "Fin de mois" },
  { id: "preuve", label: "Preuve non superficielle" },
];

export default function VieDeChantierWireframe() {
  const [view, setView] = useCanvasState<ViewId>("vie-de-chantier-view", "carte");

  return (
    <Stack gap={16} style={{ maxWidth: 980, padding: 24 }}>
      <H1>Vie de chantier — Al Qods palier 1</H1>
      <Text tone="secondary">
        STE Al Binaa. Gros oeuvre, sans planning, sans finance. L etude
        fabrique le graphe ; le conducteur vit le mois depuis le cockpit.
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

      {view === "carte" && <Carte />}
      {view === "etude" && <Etude />}
      {view === "cockpit" && <Cockpit />}
      {view === "matiere" && <Matiere />}
      {view === "st" && <St />}
      {view === "mois" && <Mois />}
      {view === "preuve" && <Preuve />}

      <Spacer />
      <H2>Decisions UX</H2>
      <Text>
        Chaque action du cockpit arrive avec le chantier (et le nœud) deja
        choisi. Planning jamais la porte vers DA ou ST. Livraison directe =
        chemin par defaut. Fallback manuel : DA sans nœud pour la base vie
        interne.
      </Text>
    </Stack>
  );
}

function Carte() {
  return (
    <Stack gap={12}>
      <Callout tone="info" title="Ce que la STE attend">
        Etudes fabrique. Chantier execute. Achats achete et sous-traite.
        Catalogue identifie la matiere. Marches notifie. Finance plus tard.
      </Callout>
      <Table
        headers={["BC", "Al Qods", "Pas Al Qods"]}
        rows={[
          ["Etudes", "Bordereau + DPU + consult + devis + conversion", "Finition IA / gates"],
          ["Catalogue", "Meme item ciment que la DA et le BL", "Magasin obligatoire"],
          ["Achats", "Consult etude ; DA+BL chantier ; contrat ST", "Attachement ST"],
          ["Chantiers", "Cockpit, qte, docs, interne", "Gantt, pointage"],
          ["Marches", "Notification, vente active", "Avenant complet"],
          ["Finance", "—", "Lettrage, RAS comptable, paie"],
        ]}
      />
    </Stack>
  );
}

function Etude() {
  return (
    <Stack gap={12}>
      <H2>Fabrique — on n y retouche pas</H2>
      <Table
        headers={["Poste", "Qte", "Vie"]}
        rows={[
          ["1 Terrassement", "1 fft", "Interne, non decompose"],
          ["2.1 Beton B25", "180 m3", "DPU matiere, ciment CONSULTE"],
          ["2.2 Acier HA", "25 t", "DPU matiere"],
          ["2.3 Coffrage", "850 m2", "ST — on n a pas la ressource"],
          ["3 Etancheite", "420 m2", "ST — pas notre metier"],
        ]}
      />
      <Text tone="secondary">
        Conversion : chantier EN_PREPARATION, zero marche. Nœud interne
        Installation ajoute ensuite.
      </Text>
    </Stack>
  );
}

function Cockpit() {
  return (
    <Stack gap={12}>
      <Card>
        <CardHeader trailing={<Pill active>EN_COURS</Pill>}>
          CH-… · Groupe scolaire Al Qods
        </CardHeader>
        <CardBody>
          <Stack gap={8}>
            <Row gap={8} wrap>
              <Pill>Vente = devis</Pill>
              <Pill>Avancement 22 %</Pill>
              <Pill>1 BL en attente</Pill>
            </Row>
            <Text>Prochaine action : receptionner le BL Lafarge (2.1)</Text>
            <Row gap={8} wrap>
              <Button variant="primary">Reception BL</Button>
              <Button variant="secondary">Saisir avancement</Button>
              <Button variant="secondary">Nouvelle DA</Button>
              <Button variant="secondary">Documents</Button>
              <Button variant="secondary">Contrat ST</Button>
              <Button variant="ghost">Planning (recommande)</Button>
            </Row>
          </Stack>
        </CardBody>
      </Card>
      <Text tone="secondary">
        Chef : avancement, BL, docs. DAF : pas ces boutons. Magasinier : BL,
        pas situation.
      </Text>
    </Stack>
  );
}

function Matiere() {
  return (
    <Stack gap={12}>
      <Callout tone="warning" title="BL partiel — le QA superficiel rate ca">
        BC acier 25 t. Premier BL 12 t. Reste 13 t. On n avance pas 25 t.
      </Callout>
      <Table
        headers={["Etape", "Fait", "Imputation"]}
        rows={[
          ["DA", "40 t CPJ 45, nœud 2.1", "besoin"],
          ["BC Lafarge", "meme lignes", "engage"],
          ["BL 44012", "40 t, livraison directe", "reel sur 2.1"],
          ["DA acier", "25 t, nœud 2.2", "besoin"],
          ["BL 1/2", "12 t", "reste 13 t visible"],
        ]}
      />
    </Stack>
  );
}

function St() {
  return (
    <Stack gap={12}>
      <H2>ST accrochee au poste, pas au Gantt</H2>
      <Card>
        <CardHeader>Contrat ST · coffreur · poste 2.3</CardHeader>
        <CardBody>
          <Stack gap={8}>
            <Text>BPU 850 m2 · retenue 10 % · 0 activite</Text>
            <Text>
              Avancement client : quantite sur 2.3 (120 m2 ce mois). Attachement
              ST fournisseur : suite, pas ce lot.
            </Text>
          </Stack>
        </CardBody>
      </Card>
    </Stack>
  );
}

function Mois() {
  return (
    <Stack gap={12}>
      <Table
        headers={["Document", "Source", "Dans la situation ?"]}
        rows={[
          ["Attachement sep.", "40 m3 + 120 m2 lus", "oui, une fois signe"],
          ["Installation", "nœud interne declare", "jamais"],
          ["Etancheite", "contrat ST, 0 m2", "non"],
          ["Situation n1", "cet attachement", "decompte client"],
        ]}
      />
      <Text tone="secondary">
        Le chef ne retape aucune ligne. Le MOE signe le lien public.
      </Text>
    </Stack>
  );
}

function Preuve() {
  return (
    <Stack gap={12}>
      <Callout tone="danger" title="Vert interdit sans le fait">
        Listing HTTP 200, KPI affiches, seed DE-0103 : ce n est pas Al Qods.
      </Callout>
      <Table
        headers={["Si on ne voit pas", "Le scenario a rate"]}
        rows={[
          ["12 t / 25 t", "BL partiel"],
          ["refus 181 m3", "depassement"],
          ["installation absente attachement", "interne"],
          ["chef sans bouton situation", "RBAC"],
          ["DA down → indisponible, pas 0", "resilience"],
        ]}
      />
    </Stack>
  );
}
