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

type ViewId = "flux" | "octobre" | "situation2" | "cumul" | "preuve";

const VIEWS: { id: ViewId; label: string }[] = [
  { id: "flux", label: "Flux mois 2" },
  { id: "octobre", label: "Octobre" },
  { id: "situation2", label: "Situation n2" },
  { id: "cumul", label: "Cumul" },
  { id: "preuve", label: "Discriminants" },
];

export default function SituationAlQodsMois2Wireframe() {
  const [view, setView] = useCanvasState<ViewId>("situation-m2-view", "flux");

  return (
    <Stack gap={16} style={{ maxWidth: 980, padding: 24 }}>
      <H1>Al Qods mois 2 — situation cumulative</H1>
      <Text tone="secondary">
        Septembre consomme. Octobre : 10 m3 sur 2.1 seulement. Situation n2 cumule.
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
      {view === "octobre" && <Octobre />}
      {view === "situation2" && <Situation2 />}
      {view === "cumul" && <Cumul />}
      {view === "preuve" && <Preuve />}
    </Stack>
  );
}

function Flux() {
  return (
    <Table
      headers={["Etape", "Valeur cle"]}
      rows={[
        ["Mois 1 consomme", "situation n1 + attachement sept"],
        ["Avancement oct", "10 m3 sur 2.1"],
        ["Attachement oct", "1 ligne 2.1"],
        ["Situation n2", "cumulPrecedent = n1"],
      ]}
    />
  );
}

function Octobre() {
  return (
    <Stack gap={12}>
      <Callout tone="warning" title="Septembre deja attache">
        Les 40 m3 de septembre ne reapparaissent pas.
      </Callout>
      <Table
        headers={["Nœud", "Octobre", "Dans attachement ?"]}
        rows={[
          ["2.1", "10 m3", "oui"],
          ["Installation", "1 fft budget", "non (interne)"],
          ["3 Etancheite", "0 m2", "non"],
        ]}
      />
    </Stack>
  );
}

function Situation2() {
  return (
    <Card>
      <CardHeader trailing={<Pill active>SIT-02</Pill>}>Situation n2</CardHeader>
      <CardBody>
        <Table
          headers={["Champ", "Valeur"]}
          rows={[
            ["cumulPrecedentHt", "75 735,60 (n1)"],
            ["travauxPeriodeHt", "15 300 (10 m3)"],
            ["cumulCourantHt", "91 035,60"],
            ["RG / avance", "sur travaux octobre"],
          ]}
        />
      </CardBody>
    </Card>
  );
}

function Cumul() {
  return (
    <Stack gap={12}>
      <H2>Decompte cumulatif</H2>
      <Text>Colonne cumul precedente = situation n-1. Periode = delta du mois.</Text>
    </Stack>
  );
}

function Preuve() {
  return (
    <Table
      headers={["Discriminant", "Attendu"]}
      rows={[
        ["Sept non repropose", "oct qte=10 seulement"],
        ["Cumul n2", "precedent = n1"],
        ["Interne absent", "attachement + situation"],
        ["2e gen sans signe", "refuse"],
      ]}
    />
  );
}
