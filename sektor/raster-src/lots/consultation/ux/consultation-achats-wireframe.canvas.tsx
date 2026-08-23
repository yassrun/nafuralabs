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
  Text,
  useCanvasState,
} from "cursor/canvas";

type ViewId =
  | "liste-achats"
  | "popup-creer"
  | "import-devis"
  | "arbre-consulte"
  | "hors-etude";

const VIEWS: { id: ViewId; label: string }[] = [
  { id: "liste-achats", label: "Liste Achats" },
  { id: "popup-creer", label: "Overlay étude" },
  { id: "import-devis", label: "Import devis" },
  { id: "arbre-consulte", label: "Flag CONSULTÉ" },
  { id: "hors-etude", label: "Hors étude" },
];

export default function ConsultationAchatsWireframe() {
  const [view, setView] = useCanvasState<ViewId>("liste-achats");

  return (
    <Stack gap={16} style={{ maxWidth: 960, padding: 24 }}>
      <H1>Consultation — objet Achats</H1>
      <Text tone="secondary">
        Liste dans Achats. Geste étude = liste des consultations liées, pas un
        formulaire. Devis = fichier + Import magique. DA / AO / devis client =
        hors sujet.
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

      {view === "liste-achats" && <ListeAchats />}
      {view === "popup-creer" && <PopupCreer />}
      {view === "import-devis" && <ImportDevis />}
      {view === "arbre-consulte" && <ArbreConsulte />}
      {view === "hors-etude" && <HorsEtude />}

      <Spacer />
      <H2>Décisions UX</H2>
      <Text>
        Menu = Achats, pas Études. Overlay : d’abord la liste des consultations
        liées à l’étude, déjà-dedans visible, clic = panier d’articles, créer
        seulement si besoin. Pas un formulaire dropdown + cases. Import magique
        extrait les lignes. Flag CONSULTÉ sur l’article après N devis, si liée.
      </Text>
    </Stack>
  );
}

function ListeAchats() {
  return (
    <Stack gap={12}>
      <Row gap={8}>
        <Pill>Achats</Pill>
        <Pill>Demandes</Pill>
        <Pill>Appels d’offres</Pill>
        <Pill tone="info">Consultations</Pill>
      </Row>
      <Callout tone="info">
        Sous-menu Achats / expression. Pas un item Études à côté de Devis
        client.
      </Callout>
      <H2>Liste</H2>
      <Text>CS-2026-0004 — Lafarge — ciment, sable — 1 devis reçu — liée DE-0050</Text>
      <Text>CS-2026-0005 — Sika — peinture — demande — hors étude</Text>
      <Row gap={8}>
        <Button variant="primary">+ Consultation</Button>
        <Button variant="secondary">Filtrer liée / hors étude</Button>
      </Row>
    </Stack>
  );
}

function PopupCreer() {
  const [pane, setPane] = useCanvasState<"liste" | "detail" | "creer">(
    "liste",
  );

  return (
    <Stack gap={12}>
      <Row gap={8}>
        <Pill>Étape Coût</Pill>
        <Pill tone="success">Arbre visible</Pill>
        <Pill>Ciment CPJ 45</Pill>
      </Row>
      <Callout tone="warning">
        Mort : formulaire « Créer une consultation » (fournisseur + cases +
        deux CTA). Cible : liste des consultations de CETTE étude.
      </Callout>
      <Row gap={8}>
        <Button
          variant={pane === "liste" ? "primary" : "secondary"}
          onClick={() => setPane("liste")}
        >
          1. Liste liées
        </Button>
        <Button
          variant={pane === "detail" ? "primary" : "secondary"}
          onClick={() => setPane("detail")}
        >
          2. Clic → articles
        </Button>
        <Button
          variant={pane === "creer" ? "primary" : "secondary"}
          onClick={() => setPane("creer")}
        >
          3. Créer
        </Button>
      </Row>

      {pane === "liste" && (
        <Stack gap={10}>
          <H2>Consultations de cette étude</H2>
          <Text tone="secondary">
            Composant : Ciment CPJ 45 (postes 01.01.01–03)
          </Text>
          <Text>
            CS-2026-0015 — Lafarge — Demande — 4 articles — Ciment déjà dedans
            · œil → fiche Achats
          </Text>
          <Text>
            CS-2026-0016 — Sika — Devis reçu — 2 articles — Ciment pas encore
            · œil → fiche Achats
          </Text>
          <Text tone="secondary">
            Clic une ligne = voir son panier. Œil = ouvrir la fiche consultation
            (nouvel onglet), comme sur le nf-select.
          </Text>
          <Row gap={8}>
            <Button variant="primary" onClick={() => setPane("detail")}>
              Ouvrir CS-2026-0016
            </Button>
            <Button variant="secondary" onClick={() => setPane("creer")}>
              Nouvelle consultation
            </Button>
          </Row>
        </Stack>
      )}

      {pane === "detail" && (
        <Stack gap={10}>
          <H2>CS-2026-0016 — Sika</H2>
          <Text>Statut : Devis reçu. Liée à cette étude. Devis : 1. Œil / Voir la fiche → Achats.</Text>
          <H2>Articles du panier</H2>
          <Text>Peinture acrylique — postes 01.01.04</Text>
          <Text>Enduit — postes 01.02.01</Text>
          <Callout tone="info">
            Ciment CPJ 45 n’est pas dans ce panier → on l’ajoute. S’il y
            était déjà, on le dit, on ne le re-coche pas.
          </Callout>
          <Row gap={8}>
            <Button variant="primary">Ajouter Ciment CPJ 45</Button>
            <Button variant="secondary" onClick={() => setPane("liste")}>
              Retour liste
            </Button>
          </Row>
        </Stack>
      )}

      {pane === "creer" && (
        <Stack gap={10}>
          <H2>Nouvelle consultation</H2>
          <Text>Fournisseur : fiche Achats (Lafarge, Sika…)</Text>
          <Text>
            Article de départ : Ciment CPJ 45 — déjà posé, pas tout l’arbre
            à cocher.
          </Text>
          <Row gap={8}>
            <Button variant="primary">Créer et y mettre Ciment</Button>
            <Button variant="secondary" onClick={() => setPane("liste")}>
              Annuler
            </Button>
          </Row>
        </Stack>
      )}
    </Stack>
  );
}

function ImportDevis() {
  return (
    <Stack gap={12}>
      <Row gap={8}>
        <Pill>CS-2026-0004</Pill>
        <Pill>Lafarge</Pill>
        <Pill tone="warning">0 devis</Pill>
      </Row>
      <Callout tone="info">
        On importe le fichier. Import magique extrait les lignes. Pas de
        textarea cle_stable=prix.
      </Callout>
      <H2>Déposer le devis</H2>
      <Text>devis-lafarge.pdf — Import magique…</Text>
      <H2>Extrait (revue)</H2>
      <Text>ciment-cpj-45 · 12 t · 1 083,75 MAD</Text>
      <Text>sable-de-dune · 8 m³ · 210,00 MAD</Text>
      <Row gap={8}>
        <Button variant="primary">Confirmer l’extraction</Button>
        <Button variant="secondary">Rejouer l’import</Button>
      </Row>
    </Stack>
  );
}

function ArbreConsulte() {
  return (
    <Stack gap={12}>
      <Row gap={8}>
        <Pill tone="success">N = 1 devis</Pill>
        <Pill>ciment CONSULTÉ</Pill>
        <Pill>peinture = tarif</Pill>
      </Row>
      <Callout tone="success">
        Liée à l’étude. Ciment couvert par l’extrait → flag CONSULTÉ + PU
        sur tous les postes de cette identité. Peinture hors devis → pas
        flaguée.
      </Callout>
      <H2>Arbre Coût</H2>
      <Text>Ciment CPJ 45 — CONSULTÉ — 1 083,75</Text>
      <Text>Sable de dune — CONSULTÉ — 210,00</Text>
      <Text>Peinture acrylique — — (tarif / manuel)</Text>
    </Stack>
  );
}

function HorsEtude() {
  return (
    <Stack gap={12}>
      <Row gap={8}>
        <Pill>Achats</Pill>
        <Pill>CS-2026-0005</Pill>
        <Pill>Pas de dossier</Pill>
      </Row>
      <Callout tone="info">
        Même objet. Pas d’arbre, pas de flag. Demande → import devis.
        On peut lier une étude plus tard.
      </Callout>
      <H2>Fiche</H2>
      <Text>Fournisseur Sika · panier peinture · 1 devis importé</Text>
      <Text tone="secondary">Lien étude : aucun</Text>
      <Button variant="secondary">Lier à un dossier étude</Button>
    </Stack>
  );
}
