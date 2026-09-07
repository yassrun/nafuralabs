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
  Table,
  Text,
  TextInput,
  useCanvasState,
} from "cursor/canvas";

/**
 * Consultation — write-through contact fournisseur.
 * SSOT Raster : lots/consultation/contact-write-through/ux/
 * Amende le refus mort AC-5/AC-6 (28/08) : pas d’override RFQ.
 */

type ViewId = "sans-email" | "prefill" | "formulaire" | "apres";

const VIEWS: { id: ViewId; label: string }[] = [
  { id: "sans-email", label: "Aucun e-mail" },
  { id: "prefill", label: "Contact principal" },
  { id: "formulaire", label: "Saisie write-through" },
  { id: "apres", label: "Après création" },
];

export default function ContactWriteThroughWireframe() {
  const [view, setView] = useCanvasState<ViewId>(
    "contact-write-through-view",
    "formulaire",
  );

  return (
    <Stack gap={16} style={{ maxWidth: 960, padding: 24 }}>
      <H1>Consultation — contact depuis le destinataire</H1>
      <Text tone="secondary">
        0 PartnerContact e-mail : nom + e-mail ici, écrits sur la fiche
        fournisseur. Pas d’e-mail orphelin sur la consultation.
      </Text>

      <Row gap={8} wrap>
        {VIEWS.map((v) => (
          <span key={v.id}>
            <Button
              variant={view === v.id ? "primary" : "secondary"}
              onClick={() => setView(v.id)}
            >
              {v.label}
            </Button>
          </span>
        ))}
      </Row>

      <Divider />

      {view === "sans-email" && <SansEmail />}
      {view === "prefill" && <Prefill />}
      {view === "formulaire" && <Formulaire />}
      {view === "apres" && <Apres />}

      <Spacer />
      <H2>Décisions UX (gel 04/09)</H2>
      <Text>
        1. Pas d’override stocké sur le RFQ. 2. partners.email (contact
        principal) → promote PartnerContact is_primary, Ajouter suffit. 3. Sinon
        champs nom (optionnel) + e-mail (obligatoire). 4. Lien fiche conservé.
        5. ≥ 1 contact existant : comportement 28/08 (auto / choix borné),
        champs masqués.
      </Text>
    </Stack>
  );
}

function Chrome() {
  return (
    <Row gap={8} wrap>
      <Pill>Achats</Pill>
      <Pill tone="info">Consultations</Pill>
      <Pill>CS-2026-0012</Pill>
      <Pill tone="neutral">Préparation</Pill>
    </Row>
  );
}

function SansEmail() {
  return (
    <Stack gap={12}>
      <Chrome />
      <H2>Ajouter un destinataire</H2>
      <TextInput placeholder="Béton Atlas (posé)" />
      <Callout tone="danger">
        AC-3 — Aucun e-mail sur la fiche ni sur un contact. Renseignez l’e-mail
        ici : il sera enregistré sur le fournisseur.
      </Callout>
      <TextInput placeholder="Nom du contact (optionnel)" />
      <TextInput placeholder="E-mail *" />
      <Row gap={8}>
        <Button variant="primary" disabled>
          Ajouter
        </Button>
        <Button variant="secondary">Ouvrir la fiche fournisseur</Button>
      </Row>
    </Stack>
  );
}

function Prefill() {
  return (
    <Stack gap={12}>
      <Chrome />
      <H2>Ajouter un destinataire</H2>
      <TextInput placeholder="Lafarge (posé)" />
      <Callout tone="info">
        AC-1 — E-mail contact principal déjà sur la fiche
        (partners.email). Prérempli. Ajouter crée le PartnerContact.
      </Callout>
      <TextInput placeholder="Lafarge" />
      <TextInput placeholder="achat@lafarge.example" />
      <Text tone="secondary">
        Ce contact sera enregistré sur la fiche fournisseur.
      </Text>
      <Row gap={8}>
        <Button variant="primary">Ajouter</Button>
        <Button variant="secondary">Ouvrir la fiche fournisseur</Button>
      </Row>
    </Stack>
  );
}

function Formulaire() {
  return (
    <Stack gap={12}>
      <Chrome />
      <H2>Ajouter un destinataire</H2>
      <TextInput placeholder="Sika (posé)" />
      <Callout tone="warning">
        AC-2 / AC-6 — Pas de contact e-mail. Saisie ici = write-through, pas un
        champ consultation-only.
      </Callout>
      <TextInput placeholder="M. Kadiri" />
      <TextInput placeholder="devis@sika.example" />
      <Text tone="secondary">
        Ce contact sera enregistré sur la fiche fournisseur.
      </Text>
      <Row gap={8}>
        <Button variant="primary">Ajouter</Button>
        <Button variant="secondary">Ouvrir la fiche fournisseur</Button>
      </Row>
    </Stack>
  );
}

function Apres() {
  return (
    <Stack gap={12}>
      <Chrome />
      <H2>Destinataires</H2>
      <Table
        headers={["Fournisseur", "Contact", "E-mail", "Statut"]}
        rows={[["Sika", "M. Kadiri", "devis@sika.example", "En attente"]]}
      />
      <Callout tone="info">
        AC-7 — PartnerContact créé (is_primary). Prochaine consultation : 1
        contact → auto. Fiche fournisseur : e-mail contact principal recopié
        s’il était vide.
      </Callout>
      <TextInput placeholder="Ajouter un fournisseur…" />
    </Stack>
  );
}
