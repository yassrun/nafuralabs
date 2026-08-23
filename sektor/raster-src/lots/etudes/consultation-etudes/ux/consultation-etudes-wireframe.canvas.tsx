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

type ViewId = "vide" | "en-cours" | "devis-recu" | "identifie";

const VIEWS: { id: ViewId; label: string }[] = [
  { id: "vide", label: "Vide" },
  { id: "en-cours", label: "En cours" },
  { id: "devis-recu", label: "Devis reçu" },
  { id: "identifie", label: "Identifié" },
];

export default function ConsultationEtudesWireframe() {
  const [view, setView] = useCanvasState<ViewId>("vide");

  return (
    <Stack gap={16} style={{ maxWidth: 920, padding: 24 }}>
      <H1>Consultation études — dossier</H1>
      <Text tone="secondary">
        Accrochée au dossier, paquet d’identités sur plusieurs postes. Pas une
        consult par poste. Inviter ≠ consulté. Fichier lié compte pour le min N
        ; sans lignes il n’identifie pas d’article.
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

      {view === "vide" && <Vide />}
      {view === "en-cours" && <EnCours />}
      {view === "devis-recu" && <DevisRecu />}
      {view === "identifie" && <Identifie />}

      <Spacer />
      <H2>Décisions UX</H2>
      <Text>
        Cycle : vide → en cours (invités) → devis reçu (compteur min N) →
        identifié (prix CONSULTE). Fallback manuel : cocher les identités
        couvertes parmi les lignes de devis, puis Appliquer. IA plus tard, pas
        ici. Pas de chrome sidebar.
      </Text>
    </Stack>
  );
}

function Vide() {
  return (
    <Stack gap={12}>
      <Row gap={8}>
        <Pill>Dossier</Pill>
        <Pill tone="warning">0 devis</Pill>
        <Pill>Optionnelle</Pill>
      </Row>
      <Callout tone="info">
        Aucune consultation. Ouvrir crée l’appel du dossier (un paquet
        d’identités, plusieurs postes).
      </Callout>
      <H2>Paquet d’identités</H2>
      <Text tone="secondary">Vide — choisir ciment, peinture… depuis la décompo.</Text>
      <H2>Fournisseurs (fiches achats)</H2>
      <Text tone="secondary">Aucun invité. Inviter n’est pas « consulté ».</Text>
      <Row gap={8}>
        <Button variant="primary">Ouvrir la consultation</Button>
        <Button variant="secondary">Choisir des fournisseurs</Button>
      </Row>
    </Stack>
  );
}

function EnCours() {
  return (
    <Stack gap={12}>
      <Row gap={8}>
        <Pill>Paquet 2 identités</Pill>
        <Pill>2 invités</Pill>
        <Pill tone="warning">0 devis reçus</Pill>
      </Row>
      <Callout tone="warning">
        Invités Lafarge + Sika. Pas encore consultés — pas de devis lié.
      </Callout>
      <H2>Paquet</H2>
      <Text>ciment-cpj-45 · peinture-acrylique (postes 1.1, 1.2, 3.1)</Text>
      <H2>Invités</H2>
      <Text>Lafarge — invité · Sika — invité</Text>
      <Row gap={8}>
        <Button variant="primary">Enregistrer un devis reçu</Button>
        <Button variant="secondary">Lier un fichier</Button>
      </Row>
    </Stack>
  );
}

function DevisRecu() {
  return (
    <Stack gap={12}>
      <Row gap={8}>
        <Pill tone="success">1 devis reçu</Pill>
        <Pill>Lafarge consulté</Pill>
        <Pill>Sika invité seulement</Pill>
      </Row>
      <Callout tone="info">
        Fichier Lafarge lié = compte pour le min N. Sans lignes : aucune
        identité à cocher. Fallback : saisir les lignes à la main.
      </Callout>
      <H2>Devis Lafarge</H2>
      <Text>Fichier devis-lafarge.pdf — lié</Text>
      <Text>Lignes : ciment-cpj-45 @ 85,50 MAD — peinture absente</Text>
      <H2>Identifier les couverts</H2>
      <Text>✓ ciment-cpj-45 (1 identification, même si 3 postes)</Text>
      <Text>○ peinture-acrylique — pas sur les lignes, non identifiable</Text>
      <Text tone="secondary">Autre article de l’étude (hors paquet) : reste tarif / manuel.</Text>
      <Row gap={8}>
        <Button variant="primary">Appliquer le prix consulté</Button>
        <Button variant="secondary">Saisir des lignes (manuel)</Button>
      </Row>
    </Stack>
  );
}

function Identifie() {
  return (
    <Stack gap={12}>
      <Row gap={8}>
        <Pill tone="success">ciment identifié</Pill>
        <Pill>CONSULTE</Pill>
        <Pill>peinture = tarif</Pill>
      </Row>
      <Callout tone="success">
        Ciment sur 3 postes = une identification. Prix CONSULTE appliqué. Le
        reste de l’étude reste tarif / manuel. Lignes → catalogue fournisseur
        sur l’identité déjà connue.
      </Callout>
      <H2>Couverture</H2>
      <Text>ciment-cpj-45 — CONSULTE 85,50 — 3 postes</Text>
      <Text>peinture-acrylique — non couvert</Text>
      <Text>ferraillage HA — hors paquet, tarif</Text>
      <Button variant="secondary">Modifier l’identification</Button>
    </Stack>
  );
}
