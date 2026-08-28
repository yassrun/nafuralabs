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
  | "gain-bloque"
  | "conversion"
  | "devis-liste"
  | "chantier"
  | "catalogue"
  | "checklist"
  | "ia";

const VIEWS: { id: ViewId; label: string }[] = [
  { id: "gain-bloque", label: "Gain bloque" },
  { id: "conversion", label: "Conversion" },
  { id: "devis-liste", label: "Liste devis" },
  { id: "chantier", label: "Chantier source" },
  { id: "catalogue", label: "Decision catalogue" },
  { id: "checklist", label: "Checklist" },
  { id: "ia", label: "IA dossier" },
];

export default function FinitionParcoursWireframe() {
  const [view, setView] = useCanvasState<ViewId>(
    "finition-parcours-view",
    "gain-bloque",
  );

  return (
    <Stack gap={16} style={{ maxWidth: 960, padding: 24 }}>
      <H1>Finition parcours Etude → Chantier</H1>
      <Text tone="secondary">
        Garde-fous avant gain, conversion sans marche, chaine cliquable,
        decision Catalogue, IA du dossier ouvert. Pas de DA / BL / cloture
        dans ce sous-lot.
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

      {view === "gain-bloque" && <GainBloque />}
      {view === "conversion" && <Conversion />}
      {view === "devis-liste" && <DevisListe />}
      {view === "chantier" && <ChantierSource />}
      {view === "catalogue" && <Catalogue />}
      {view === "checklist" && <Checklist />}
      {view === "ia" && <IaDossier />}

      <Spacer />
      <H2>Decisions UX</H2>
      <Text>
        CTA conversion = Creer le chantier, jamais et marche. Convertir
        inactif sans libelle. Planning hors ratio des prerequis une fois
        EN_COURS. 0/0 composants = aucun composant, pas 100 %. Fallback
        manuel : accepter un warning avec motif, ou corriger le chiffrage.
      </Text>
    </Stack>
  );
}

function GainBloque() {
  return (
    <Stack gap={12}>
      <Callout tone="danger" title="2 blocages · gain refuse">
        100 % des couts ne sont pas etablis. Marquer gagne est inactif.
        L API refuse la meme commande.
      </Callout>
      <Card>
        <CardHeader>DE-0103 · Ecole Al Amal · Devis genere</CardHeader>
        <CardBody>
          <Stack gap={8}>
            <Row gap={8} wrap>
              <Pill active>2 blocages</Pill>
              <Pill>Vente 742 815 MAD</Pill>
              <Pill tone="warning">Debourse non etabli</Pill>
              <Pill>Marge indisponible</Pill>
            </Row>
            <Table
              headers={["Code", "Severite", "Fait", "Action"]}
              rows={[
                [
                  "ETU-COUT-100",
                  "BLOQUANT",
                  "0 MAD debourse / 3 postes",
                  "Chiffrer les postes",
                ],
                [
                  "ETU-LIBRE",
                  "WARNING",
                  "4 composants LIBRE sans decision",
                  "Trancher Catalogue",
                ],
              ]}
            />
            <Row gap={8}>
              <Button variant="primary" disabled>
                Marquer gagne
              </Button>
              <Button variant="secondary">Corriger le chiffrage</Button>
            </Row>
          </Stack>
        </CardBody>
      </Card>
      <Text tone="secondary">
        Un warning accepte (partielle) montre acteur, date, motif et reste
        visible apres le devis. Compteur = blocages + warnings actifs, jamais 0
        si un bandeau existe.
      </Text>
    </Stack>
  );
}

function Conversion() {
  return (
    <Stack gap={12}>
      <Callout tone="info" title="Aucun marche ici">
        Le chantier nait en preparation. Le marche nait a la notification.
        La vente reste le devis valide.
      </Callout>
      <Card>
        <CardHeader>Creer le chantier</CardHeader>
        <CardBody>
          <Stack gap={8}>
            <Text>Libelle du chantier · obligatoire</Text>
            <Text tone="secondary">Ecole Al Amal</Text>
            <Text>Code chantier · facultatif, genere si vide</Text>
            <Text tone="secondary">CH-2026-101 (propose)</Text>
            <Row gap={16}>
              <Text>Date de demarrage · facultatif, avant OS</Text>
              <Text>Duree (mois) · facultatif, avant OS</Text>
            </Row>
            <Row gap={8}>
              <Button variant="secondary">Annuler</Button>
              <Button variant="primary">Convertir</Button>
            </Row>
            <Text tone="secondary">
              Convertir reste inactif tant que le libelle est vide. Pas de
              bouton Creer chantier et marche.
            </Text>
          </Stack>
        </CardBody>
      </Card>
    </Stack>
  );
}

function DevisListe() {
  return (
    <Stack gap={12}>
      <H2>Portefeuille Devis</H2>
      <Text tone="secondary">
        /etudes ouvre le portefeuille Etudes. Devis a son entree de menu.
        Une pagination, en francais.
      </Text>
      <Table
        headers={["N°", "Client", "Objet", "HT", "Statut"]}
        rows={[
          ["DV-2026-0060", "MOA Al Amal", "Ecole", "742 815", "Approuve"],
          ["DV-2026-0059", "Commune X", "VRD", "120 000", "Brouillon"],
        ]}
      />
      <Text>
        Clic ligne ou numero → fiche /etudes/devis/{"{id}"}. Chargement :
        squelette, jamais 0 devis avant la reponse.
      </Text>
    </Stack>
  );
}

function ChantierSource() {
  return (
    <Stack gap={12}>
      <Card>
        <CardHeader>CH-2026-101 · Ecole Al Amal · En cours</CardHeader>
        <CardBody>
          <Stack gap={8}>
            <Row gap={8} wrap>
              <Text>Client MOA Al Amal</Text>
              <Button variant="secondary">DV-2026-0060</Button>
              <Button variant="secondary">DE-0103</Button>
            </Row>
            <Text tone="secondary">
              Identifiants du snapshot, pas une recherche par numero. Meme
              liens depuis l etude convertie et depuis le devis approuve.
            </Text>
          </Stack>
        </CardBody>
      </Card>
    </Stack>
  );
}

function Catalogue() {
  return (
    <Stack gap={12}>
      <H2>Decisions Catalogue — encore lisibles apres conversion</H2>
      <Table
        headers={["Composant", "Decision", "Item", "Par", "Quand"]}
        rows={[
          [
            "Ciment CPJ 45",
            "Cree et lie",
            "ART-CPJ45 →",
            "qa@",
            "27/08 18:02",
          ],
          [
            "Adjuvant X",
            "Poste seulement",
            "—",
            "qa@",
            "27/08 18:04",
          ],
          [
            "Sable 0/5",
            "Ignore · equivalent local",
            "—",
            "qa@",
            "27/08 18:05",
          ],
        ]}
      />
      <Text tone="secondary">
        Un LIBRE sans decision bloque le gain (warning a trancher). Le lien
        item ouvre la fiche Catalogue.
      </Text>
    </Stack>
  );
}

function Checklist() {
  return (
    <Stack gap={12}>
      <Row gap={8} wrap>
        <Pill>7/7 prerequis</Pill>
        <Pill tone="warning">planning recommande</Pill>
      </Row>
      <Table
        headers={["Item", "Role", "Etat"]}
        rows={[
          ["Client", "prerequis", "OK"],
          ["Devis source", "prerequis", "OK"],
          ["Arbre", "prerequis", "OK"],
          ["Budget", "prerequis", "OK"],
          ["Responsables", "prerequis", "OK"],
          ["Dates", "prerequis", "OK"],
          ["Ordre de service", "prerequis", "OK"],
          ["Planning", "recommande", "A faire"],
        ]}
      />
      <Text tone="secondary">
        Chantier deja EN_COURS : le planning n entre pas dans 7/8. Prochaine
        action = avancement, pas demarrer.
      </Text>
    </Stack>
  );
}

function IaDossier() {
  return (
    <Stack gap={12}>
      <Callout tone="info" title="Dossier compris : DE-0103 · Ecole Al Amal">
        Pas un chat generique. Trois gestes du dossier ouvert.
      </Callout>
      <Row gap={8} wrap>
        <Button variant="primary">Controler le chiffrage</Button>
        <Button variant="secondary">Detecter les incoherences</Button>
        <Button variant="secondary">Proposer rattachements catalogue</Button>
      </Row>
      <Table
        headers={["Suggestion", "Etat", "Par"]}
        rows={[
          ["Rattacher Ciment CPJ 45", "Acceptee", "qa@"],
          ["PU 12,00 trop bas vs tarif", "Corrigee → 14,50", "qa@"],
          ["Creer Adjuvant X", "Refusee", "qa@"],
        ]}
      />
      <Text tone="secondary">
        Continuité : extraction CPS → DPGF → cout → devis reste visible comme
        provenance, pas comme un second agent.
      </Text>
    </Stack>
  );
}
