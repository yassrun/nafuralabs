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

type ViewId = "flux" | "avancement" | "attachement" | "situation" | "cockpit" | "preuve";

const VIEWS: { id: ViewId; label: string }[] = [
  { id: "flux", label: "Flux mois 1" },
  { id: "avancement", label: "Terrain" },
  { id: "attachement", label: "Attachement" },
  { id: "situation", label: "Situation n1" },
  { id: "cockpit", label: "Cockpit lendemain" },
  { id: "preuve", label: "Discriminants QA" },
];

export default function SituationAlQodsMois1Wireframe() {
  const [view, setView] = useCanvasState<ViewId>("situation-m1-view", "flux");

  return (
    <Stack gap={16} style={{ maxWidth: 980, padding: 24 }}>
      <H1>Al Qods mois 1 — attachement + situation</H1>
      <Text tone="secondary">
        Septembre, sans marché notifié. Le chef declare ; le conducteur attache
        et situe. RG / avance seulement ce cycle.
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

      {view === "flux" && <Flux />}
      {view === "avancement" && <Avancement />}
      {view === "attachement" && <Attachement />}
      {view === "situation" && <Situation />}
      {view === "cockpit" && <Cockpit />}
      {view === "preuve" && <Preuve />}

      <Spacer />
      <H2>Decisions UX</H2>
      <Text>
        Attachement = grille lue, pas de saisie quantite. Situation generee
        seulement apres signature MOE. Reference de vente = devis si pas de
        marche. Interne et ST 0 m2 jamais dans attachement / situation.
      </Text>
    </Stack>
  );
}

function Flux() {
  return (
    <Stack gap={12}>
      <Table
        headers={["Etape", "Qui", "Sortie"]}
        rows={[
          ["Avancement 2.1 / 2.3", "chef-chantier", "40 m3 + 120 m2 declares"],
          ["Attachement sep.", "conducteur", "lignes lues, MOE signe"],
          ["Situation n1", "conducteur", "RG + avance, ref devis"],
          ["Cockpit", "conducteur", "prochain trou reel"],
        ]}
      />
      <Callout tone="info" title="Vente active">
        Pas de marche notifie — libelle Reference de vente (devis), pas ecran
        mort Creer le marche.
      </Callout>
    </Stack>
  );
}

function Avancement() {
  return (
    <Stack gap={12}>
      <H2>Saisie quantite seule</H2>
      <Card>
        <CardHeader trailing={<Pill>nœud 2.1</Pill>}>Avancement terrain</CardHeader>
        <CardBody>
          <Stack gap={8}>
            <Text>Quantite faite : 40 · Unite : m3 · Date : 12/09</Text>
            <Text tone="secondary">Pas de pourcentage. 181 m3 refuse.</Text>
            <Button variant="primary">Enregistrer</Button>
          </Stack>
        </CardBody>
      </Card>
    </Stack>
  );
}

function Attachement() {
  return (
    <Stack gap={12}>
      <H2>Periode 01/09 – 30/09</H2>
      <Table
        headers={["Nœud", "Qte periode", "PU vendu", "Saisie ?"]}
        rows={[
          ["2.1 Beton", "40 m3", "lu", "non"],
          ["2.3 Coffrage", "120 m2", "lu", "non"],
          ["Installation", "—", "—", "absent (interne)"],
          ["3 Etancheite", "—", "—", "absent (0 m2)"],
        ]}
      />
      <Row gap={8}>
        <Button variant="secondary">Envoyer lien MOE</Button>
        <Pill active>SIGNE_MOE</Pill>
      </Row>
    </Stack>
  );
}

function Situation() {
  return (
    <Stack gap={12}>
      <Card>
        <CardHeader trailing={<Pill>BROUILLON</Pill>}>
          Situation n1 · Reference de vente DV-…
        </CardHeader>
        <CardBody>
          <Table
            headers={["Ligne", "Montant HT"]}
            rows={[
              ["2.1 · 40 m3", "…"],
              ["2.3 · 120 m2", "…"],
              ["Travaux periode", "somme"],
              ["RG", "taux chantier"],
              ["Avance", "taux chantier"],
              ["Net a payer HT", "…"],
            ]}
          />
          <Spacer size={8} />
          <Button variant="primary">Generer depuis attachement signe</Button>
        </CardBody>
      </Card>
      <Callout tone="warning" title="Sans signature">
        Attachement EN_ATTENTE_MOE → generation refusee, message explicite.
      </Callout>
    </Stack>
  );
}

function Cockpit() {
  return (
    <Stack gap={12}>
      <Card>
        <CardHeader trailing={<Pill active>EN_COURS</Pill>}>
          CH Al Qods — lendemain situation n1
        </CardHeader>
        <CardBody>
          <Text>Prochaine action : soumettre situation au MOA · ou BL acier</Text>
          <Row gap={8} wrap>
            <Button variant="secondary">Attachement octobre</Button>
            <Button variant="secondary">Situation</Button>
            <Button variant="ghost">Pas : saisir avancement septembre</Button>
          </Row>
        </CardBody>
      </Card>
    </Stack>
  );
}

function Preuve() {
  return (
    <Stack gap={12}>
      <Table
        headers={["Discriminant", "Attendu"]}
        rows={[
          ["Attachement lu", "pas de retape quantite"],
          ["Interne", "budget oui, attachement non"],
          ["ST 0 m2", "absent situation client"],
          ["Sans signe", "situation refusee"],
          ["Devis sans marche", "situation OK"],
          ["Roles", "chef avancement, conducteur situation"],
        ]}
      />
    </Stack>
  );
}
