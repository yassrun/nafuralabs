import {
  Button,
  Callout,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Grid,
  H1,
  H2,
  Pill,
  Row,
  Spacer,
  Stack,
  Stat,
  Table,
  Text,
  useCanvasState,
} from "cursor/canvas";

type ViewId = "historique" | "suggestions" | "vide" | "libre";

const VIEWS: { id: ViewId; label: string }[] = [
  { id: "historique", label: "Article lié + historique" },
  { id: "suggestions", label: "Saisie libre, article trouvé" },
  { id: "vide", label: "Article sans historique" },
  { id: "libre", label: "Pas dans le catalogue" },
];

export default function HistoriquePrixComposantCanvas() {
  const [view, setView] = useCanvasState<ViewId>(
    "historique-prix-composant-view",
    "historique",
  );

  return (
    <Stack gap={20} style={{ maxWidth: 920, padding: 24 }}>
      <Stack gap={8}>
        <H1>Prix composant — historique, pas l’IA</H1>
        <Text tone="secondary">
          Un composant DPU peut être un article catalogue. S’il l’est, le
          chiffreur lit les prix déjà obtenus (consultations) et surtout les
          prix déjà payés (commandes / factures). Un clic recopie le PU. Pas de
          « Proposer un prix (IA) ».
        </Text>
      </Stack>

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

      <Grid columns={2} gap={16}>
        <Stat label="Plus pertinent" value="Achat facturé" tone="success" />
        <Stat
          label="Ensuite"
          value="Consultations fournisseurs"
          tone="info"
        />
      </Grid>

      <Callout tone="info" title="Règle de lecture">
        Un achat (facture, sinon commande envoyée) pèse plus qu’un devis. Un
        devis reste utile pour caler le marché. Le tarif catalogue n’est qu’un
        plancher. Le PU n’est écrit que si le chiffreur choisit une ligne ou
        saisit à la main.
      </Callout>

      {view === "historique" ? <DialogHistorique /> : null}
      {view === "suggestions" ? <DialogSuggestions /> : null}
      {view === "vide" ? <DialogVide /> : null}
      {view === "libre" ? <DialogLibre /> : null}

      <Divider />

      <Stack gap={8}>
        <H2>Données à seeder (lab)</H2>
        <Text tone="secondary">
          Pour que ce dialogue ait quelque chose à montrer sur « Béton B20 »
          et le ciment du bordereau.
        </Text>
        <Table
          headers={["Article", "Consultations", "Achat", "PU à afficher"]}
          rows={[
            [
              "Béton B20 · M3",
              "Lafarge 790 · Ciments du Maroc 805",
              "Facture Lafarge 12/03/2026",
              "820 MAD (achat en tête)",
            ],
            [
              "Ciment CPJ 32,5 R · T",
              "Sika 1 050 · Lafarge 1 080",
              "Commande Sika 18/06/2026",
              "1 048 MAD",
            ],
            [
              "Acier HA Ø12 · T",
              "Deux devis, pas d’achat",
              "—",
              "Meilleur devis 9 400 MAD",
            ],
          ]}
          rowTone={["success", "success", "neutral"]}
        />
        <Text tone="secondary" size="small">
          Source : seed QA Mode B · consultations-achat + bons de commande /
          factures sur les mêmes itemId.
        </Text>
      </Stack>
    </Stack>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap={4}>
      <Text size="small" tone="secondary">
        {label}
      </Text>
      <Text weight="medium">{value}</Text>
    </Stack>
  );
}

function DialogHistorique() {
  return (
    <Card>
      <CardHeader trailing={<Text tone="secondary">✕</Text>}>
        Modifier le composant
      </CardHeader>
      <CardBody>
        <Stack gap={14}>
          <Field label="Type *" value="Matière" />
          <Field label="Désignation *" value="Béton B20" />
          <Row gap={8} align="center">
            <Pill tone="success" size="sm" active>
              Catalogue · ART-BETON-B20
            </Pill>
            <Text size="small" tone="secondary">
              Béton B20 · M3
            </Text>
            <Button variant="ghost">Délier</Button>
          </Row>
          <Grid columns={3} gap={12}>
            <Field label="Unité *" value="M3" />
            <Field label="Quantité *" value="0,08" />
            <Field label="Prix unitaire *" value="820" />
          </Grid>
          <Stack gap={8}>
            <Row gap={8} align="center" justify="space-between">
              <H2>Historique de prix</H2>
              <Pill tone="success" size="sm">
                Achat plus pertinent
              </Pill>
            </Row>
            <Table
              headers={["Origine", "Date", "Fournisseur", "PU HT", ""]}
              columnAlign={["left", "left", "left", "right", "right"]}
              rows={[
                [
                  "Achat facturé",
                  "12/03/2026",
                  "LafargeHolcim",
                  "820,00",
                  "Reprendre",
                ],
                ["Commande", "01/02/2026", "LafargeHolcim", "835,00", "Reprendre"],
                ["Consultation", "02/04/2026", "Sika Maroc", "790,00", "Reprendre"],
                [
                  "Consultation",
                  "02/04/2026",
                  "Ciments du Maroc",
                  "805,00",
                  "Reprendre",
                ],
              ]}
              rowTone={["success", "neutral", "neutral", "neutral"]}
            />
          </Stack>
          <Field label="Source du prix" value="Achat (facture / commande)" />
          <Row justify="space-between" align="center">
            <Text>Montant</Text>
            <Text weight="semibold">65,60 MAD</Text>
          </Row>
          <Row gap={8} justify="end">
            <Button variant="secondary">Annuler</Button>
            <Button variant="primary">Enregistrer</Button>
          </Row>
        </Stack>
      </CardBody>
    </Card>
  );
}

function DialogSuggestions() {
  return (
    <Card>
      <CardHeader trailing={<Text tone="secondary">✕</Text>}>
        Ajouter un composant
      </CardHeader>
      <CardBody>
        <Stack gap={14}>
          <Field label="Désignation *" value="Béton B20" />
          <Callout tone="warning" title="Article catalogue possible">
            La désignation n’est pas encore liée. Lier permet d’afficher
            l’historique d’achats et de consultations.
          </Callout>
          <Table
            headers={["Code", "Article", "Unité", ""]}
            rows={[["ART-BETON-B20", "Béton B20", "M3", "Lier"]]}
            rowTone={["warning"]}
          />
          <Grid columns={3} gap={12}>
            <Field label="Unité *" value="M2" />
            <Field label="Quantité *" value="0,08" />
            <Field label="Prix unitaire *" value="0" />
          </Grid>
          <Row gap={8} justify="end">
            <Button variant="secondary">Annuler</Button>
            <Button variant="primary">Ajouter</Button>
          </Row>
        </Stack>
      </CardBody>
    </Card>
  );
}

function DialogVide() {
  return (
    <Card>
      <CardHeader trailing={<Text tone="secondary">✕</Text>}>
        Modifier le composant
      </CardHeader>
      <CardBody>
        <Stack gap={14}>
          <Field label="Désignation *" value="Étais métalliques réglables" />
          <Callout tone="neutral" title="Aucun historique">
            Pas de consultation ni d’achat sur cet article. Saisir le PU à la
            main, ou ouvrir une consultation depuis le poste.
          </Callout>
          <Grid columns={3} gap={12}>
            <Field label="Unité *" value="U" />
            <Field label="Quantité *" value="12" />
            <Field label="Prix unitaire *" value="0" />
          </Grid>
          <Row gap={8} justify="end">
            <Button variant="secondary">Annuler</Button>
            <Button variant="primary">Enregistrer</Button>
          </Row>
        </Stack>
      </CardBody>
    </Card>
  );
}

function DialogLibre() {
  return (
    <Card>
      <CardHeader trailing={<Text tone="secondary">✕</Text>}>
        Premier composant
      </CardHeader>
      <CardBody>
        <Stack gap={14}>
          <Field label="Désignation *" value="Main d’œuvre coffreur" />
          <Callout tone="neutral" title="Pas dans le catalogue">
            Composant libre. PU manuel tant que l’article n’est pas créé dans
            le catalogue.
          </Callout>
          <Spacer />
          <Grid columns={3} gap={12}>
            <Field label="Unité *" value="H" />
            <Field label="Quantité *" value="2,5" />
            <Field label="Prix unitaire *" value="45" />
          </Grid>
          <Row gap={8} justify="end">
            <Button variant="secondary">Annuler</Button>
            <Button variant="primary">Ajouter</Button>
          </Row>
        </Stack>
      </CardBody>
    </Card>
  );
}
