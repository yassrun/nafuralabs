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
 * Consultation RFQ — 1 panier puis N destinataires.
 * SSOT Raster : lots/consultation/destinataires-envoi-suivi/ux/
 * Casse le gel 22/08 « un fournisseur ». Chrome listing/detail + picker conservés.
 */

type ViewId =
  | "create-vide"
  | "create-panier"
  | "create-erreur"
  | "fiche-prep"
  | "refus-contact"
  | "prete-envoyer"
  | "apres-envoi"
  | "suivi-0"
  | "suivi-partiel"
  | "suivi-complet"
  | "import-destinataire"
  | "liste";

const VIEWS: { id: ViewId; label: string }[] = [
  { id: "create-vide", label: "Créer vide" },
  { id: "create-panier", label: "Créer panier" },
  { id: "create-erreur", label: "Créer erreur" },
  { id: "fiche-prep", label: "Fiche prep" },
  { id: "refus-contact", label: "Refus contact" },
  { id: "prete-envoyer", label: "Prête à envoyer" },
  { id: "apres-envoi", label: "Après envoi" },
  { id: "suivi-0", label: "Suivi 0 devis" },
  { id: "suivi-partiel", label: "Partiel" },
  { id: "suivi-complet", label: "Complet" },
  { id: "import-destinataire", label: "Import 1 dest." },
  { id: "liste", label: "Liste" },
];

export default function DestinatairesEnvoiSuiviWireframe() {
  const [view, setView] = useCanvasState<ViewId>(
    "destinataires-envoi-suivi-view",
    "create-vide",
  );

  return (
    <Stack gap={16} style={{ maxWidth: 960, padding: 24 }}>
      <H1>Consultation — panier puis N destinataires</H1>
      <Text tone="secondary">
        /new = panier seulement (picker). Fiche = destinataires + Envoyer +
        suivi + import par ligne. Pas de wizard. Statut dérivé des devis, pas
        d’une machine d’envoi.
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

      {view === "create-vide" && <CreateVide />}
      {view === "create-panier" && <CreatePanier />}
      {view === "create-erreur" && <CreateErreur />}
      {view === "fiche-prep" && <FichePrep />}
      {view === "refus-contact" && <RefusContact />}
      {view === "prete-envoyer" && <PreteEnvoyer />}
      {view === "apres-envoi" && <ApresEnvoi />}
      {view === "suivi-0" && <SuiviZero />}
      {view === "suivi-partiel" && <SuiviPartiel />}
      {view === "suivi-complet" && <SuiviComplet />}
      {view === "import-destinataire" && <ImportDestinataire />}
      {view === "liste" && <ListeOk />}

      <Spacer />
      <H2>Décisions UX (gel 28/08)</H2>
      <Text>
        1. Panier d’abord sur /new — plus de champ fournisseur unique (casse
        AC-10/AC-11 UX pro). 2. Destinataires sur la fiche, combobox
        fournisseurs. 3. Sans PartnerContact.email → refus + lien fiche, pas de
        mail collé. 4. Envoyer = action ; journal = preuve. 5. Après 1er envoi :
        panier figé ; on peut ajouter un destinataire et renvoyer aux nouveaux.
        6. Import magique sur la ligne destinataire. 7. Destinataire EN_ATTENTE
        | DEVIS_RECU. Consultation PREPARATION | OUVERTE | PARTIELLE | COMPLETE.
      </Text>
    </Stack>
  );
}

function ChromeAchats() {
  return (
    <Row gap={8} wrap>
      <Pill>Achats</Pill>
      <Pill>Demandes</Pill>
      <Pill>Appels d’offres</Pill>
      <Pill tone="info">Consultations</Pill>
    </Row>
  );
}

function CreateVide() {
  return (
    <Stack gap={12}>
      <ChromeAchats />
      <H2>Nouvelle consultation</H2>
      <Callout tone="info">
        AC-1 — Panier seulement. Mort : combobox fournisseur unique, copy « un
        fournisseur + panier ».
      </Callout>
      <H2>Panier *</H2>
      <Text tone="secondary">Aucun article. Ajoutez au moins une ligne.</Text>
      <Row gap={8}>
        <Button variant="secondary">+ Ajouter un article</Button>
        <Button variant="primary" disabled>
          Créer
        </Button>
        <Button variant="secondary">Annuler</Button>
      </Row>
    </Stack>
  );
}

function CreatePanier() {
  return (
    <Stack gap={12}>
      <ChromeAchats />
      <H2>Nouvelle consultation</H2>
      <Text tone="secondary">Hors étude — panier d’articles catalogue</Text>
      <H2>Panier *</H2>
      <Table
        headers={["Code", "Désignation", ""]}
        rows={[
          ["ciment-cpj-45", "Ciment CPJ 45", "Retirer"],
          ["sable-de-dune", "Sable de dune", "Retirer"],
        ]}
      />
      <Row gap={8}>
        <Button variant="secondary">+ Ajouter un article</Button>
        <Button variant="primary">Créer</Button>
        <Button variant="secondary">Annuler</Button>
      </Row>
      <Text tone="secondary">
        Succès → fiche CS-… en Préparation, 0 destinataire (AC-3, AC-7).
      </Text>
    </Stack>
  );
}

function CreateErreur() {
  return (
    <Stack gap={12}>
      <ChromeAchats />
      <H2>Nouvelle consultation</H2>
      <H2>Panier *</H2>
      <Callout tone="danger">
        Ajoutez au moins un article au panier. — ou — Erreur API : formulaire
        conservé.
      </Callout>
      <Row gap={8}>
        <Button variant="secondary">+ Ajouter un article</Button>
        <Button variant="primary" disabled>
          Créer
        </Button>
      </Row>
    </Stack>
  );
}

function FichePrep() {
  return (
    <Stack gap={12}>
      <ChromeAchats />
      <H2>CS-2026-0012</H2>
      <Row gap={8} wrap>
        <Pill tone="neutral">Préparation</Pill>
        <Pill>Hors étude</Pill>
        <Pill>0/0 devis</Pill>
      </Row>
      <H2>Panier</H2>
      <Table
        headers={["Code", "Désignation"]}
        rows={[
          ["ciment-cpj-45", "Ciment CPJ 45"],
          ["sable-de-dune", "Sable de dune"],
        ]}
      />
      <Divider />
      <H2>Destinataires</H2>
      <Callout tone="info">
        AC-4 — Combobox lookup fournisseurs. Pas encore d’envoi : le panier
        reste éditable.
      </Callout>
      <TextInput placeholder="Taper ≥ 2 car. — rechercher un fournisseur…" />
      <Text tone="secondary">Aucun destinataire. Envoyer est désactivé.</Text>
      <Button variant="primary" disabled>
        Envoyer la consultation
      </Button>
    </Stack>
  );
}

function RefusContact() {
  return (
    <Stack gap={12}>
      <ChromeAchats />
      <H2>CS-2026-0012</H2>
      <Pill tone="neutral">Préparation</Pill>
      <H2>Ajouter un destinataire</H2>
      <TextInput placeholder="Béton Atlas (posé)" />
      <Callout tone="danger">
        Impossible d’ajouter ce fournisseur : aucun contact avec e-mail sur la
        fiche. Ajoutez un contact, puis réessayez.
      </Callout>
      <Button variant="secondary">Ouvrir la fiche fournisseur</Button>
      <Text tone="secondary">
        AC-5, AC-6 — PartnerContact.email seulement. Pas de champ e-mail ici.
        Pas de partners.email. Lien → /achats/fournisseurs/{"{id}"}.
      </Text>
    </Stack>
  );
}

function PreteEnvoyer() {
  return (
    <Stack gap={12}>
      <ChromeAchats />
      <H2>CS-2026-0012</H2>
      <Row gap={8} wrap>
        <Pill tone="neutral">Préparation</Pill>
        <Pill>0/2 devis</Pill>
      </Row>
      <H2>Destinataires</H2>
      <Table
        headers={["Fournisseur", "Contact", "E-mail", "Statut", ""]}
        rows={[
          ["Lafarge", "A. Benali", "achat@lafarge.example", "En attente", "—"],
          ["Sika", "M. Kadiri", "devis@sika.example", "En attente", "—"],
        ]}
      />
      <Row gap={8}>
        <TextInput placeholder="Ajouter un fournisseur…" />
        <Button variant="primary">Envoyer la consultation</Button>
      </Row>
      <Text tone="secondary">
        AC-8 — un mail par destinataire, à son contact. Pas encore au journal →
        PREPARATION jusqu’à l’envoi.
      </Text>
    </Stack>
  );
}

function ApresEnvoi() {
  return (
    <Stack gap={12}>
      <ChromeAchats />
      <H2>CS-2026-0012</H2>
      <Row gap={8} wrap>
        <Pill tone="info">En attente de réponses</Pill>
        <Pill>0/2 devis</Pill>
      </Row>
      <Callout tone="warning">
        AC-10 — Panier figé. Les articles ne peuvent plus être modifiés. Vous
        pouvez encore ajouter un destinataire.
      </Callout>
      <H2>Panier (figé)</H2>
      <Table
        headers={["Code", "Désignation"]}
        rows={[
          ["ciment-cpj-45", "Ciment CPJ 45"],
          ["sable-de-dune", "Sable de dune"],
        ]}
      />
      <H2>Journal d’envoi</H2>
      <Table
        headers={["Destinataire", "E-mail", "Date"]}
        rows={[
          ["Lafarge", "achat@lafarge.example", "28/08/2026 18:02"],
          ["Sika", "devis@sika.example", "28/08/2026 18:02"],
        ]}
      />
      <Text tone="secondary">
        AC-9 — preuve = journal via EmailService. Mode B : no-op Brevo OK.
      </Text>
      <Row gap={8}>
        <TextInput placeholder="Ajouter un fournisseur…" />
        <Button variant="primary" disabled>
          Envoyer la consultation
        </Button>
      </Row>
      <Text tone="secondary">
        CTA réactivé seulement s’il existe un destinataire absent du journal
        (renvoi aux nouveaux).
      </Text>
    </Stack>
  );
}

function SuiviZero() {
  return (
    <Stack gap={12}>
      <ChromeAchats />
      <H2>CS-2026-0012 — suivi</H2>
      <Row gap={8} wrap>
        <Pill tone="info">En attente de réponses</Pill>
        <Pill>0/2 devis</Pill>
      </Row>
      <Callout tone="info">
        AC-11, AC-12 — OUVERTE : envoyée, 0 devis. L’envoi n’est pas un statut
        destinataire.
      </Callout>
      <Table
        headers={["Fournisseur", "Contact", "Envoi", "Statut", "Devis"]}
        rows={[
          ["Lafarge", "A. Benali", "28/08 18:02", "En attente", "Importer"],
          ["Sika", "M. Kadiri", "28/08 18:02", "En attente", "Importer"],
        ]}
      />
    </Stack>
  );
}

function SuiviPartiel() {
  return (
    <Stack gap={12}>
      <ChromeAchats />
      <H2>CS-2026-0012 — suivi</H2>
      <Row gap={8} wrap>
        <Pill tone="warning">Partielle</Pill>
        <Pill>1/2 devis</Pill>
      </Row>
      <Table
        headers={["Fournisseur", "Contact", "Envoi", "Statut", "Devis"]}
        rows={[
          ["Lafarge", "A. Benali", "28/08 18:02", "Devis reçu", "Voir"],
          ["Sika", "M. Kadiri", "28/08 18:02", "En attente", "Importer"],
        ]}
      />
      <Text tone="secondary">
        AC-15 — 1 import confirmé sur Lafarge, Sika encore EN_ATTENTE →
        PARTIELLE.
      </Text>
    </Stack>
  );
}

function SuiviComplet() {
  return (
    <Stack gap={12}>
      <ChromeAchats />
      <H2>CS-2026-0012 — suivi</H2>
      <Row gap={8} wrap>
        <Pill tone="success">Complète</Pill>
        <Pill>2/2 devis</Pill>
      </Row>
      <Table
        headers={["Fournisseur", "Contact", "Envoi", "Statut", "Devis"]}
        rows={[
          ["Lafarge", "A. Benali", "28/08 18:02", "Devis reçu", "Voir"],
          ["Sika", "M. Kadiri", "28/08 18:02", "Devis reçu", "Voir"],
        ]}
      />
      <Text tone="secondary">
        Tous les destinataires ont un devis qui compte. Ajouter un 3e
        fournisseur ramènerait PARTIELLE.
      </Text>
    </Stack>
  );
}

function ImportDestinataire() {
  return (
    <Stack gap={12}>
      <ChromeAchats />
      <Row gap={8} wrap>
        <Pill>CS-2026-0012</Pill>
        <Pill>Lafarge · A. Benali</Pill>
        <Pill tone="warning">En attente</Pill>
      </Row>
      <Callout tone="success">
        AC-14 — Import magique sur CE destinataire. Plus d’import orphelin sur
        la fiche. Moteur 135 inchangé. Pas de saisie PU.
      </Callout>
      <H2>Déposer le devis — Lafarge</H2>
      <Text>devis-lafarge.pdf — Import magique…</Text>
      <H2>Extrait (revue)</H2>
      <Table
        headers={["Identité", "Libellé", "Qté", "Unité", "PU"]}
        rows={[
          ["ciment-cpj-45", "Ciment CPJ 45", "12", "t", "1 083,75"],
          ["sable-de-dune", "Sable de dune", "8", "m³", "210,00"],
        ]}
      />
      <Row gap={8}>
        <Button variant="primary">Confirmer l’extraction</Button>
        <Button variant="secondary">Rejouer l’import</Button>
      </Row>
      <Text tone="secondary">
        Confirmer → destinataire DEVIS_RECU. Sika encore EN_ATTENTE →
        consultation PARTIELLE.
      </Text>
    </Stack>
  );
}

function ListeOk() {
  return (
    <Stack gap={12}>
      <ChromeAchats />
      <Callout tone="info">
        AC-13 — nf-entity-listing conservé. Mort : colonne « le » fournisseur
        unique (casse AC-2 UX pro sur ce point).
      </Callout>
      <Row gap={8}>
        <TextInput placeholder="Rechercher…" />
        <Button variant="primary">+ Consultation</Button>
      </Row>
      <Table
        headers={["N°", "Destinataires", "Panier", "Avancement", "Lien"]}
        rows={[
          [
            "CS-2026-0012",
            "Lafarge, Sika (2)",
            "ciment, sable (2)",
            "1/2 · Partielle",
            "Hors étude",
          ],
          [
            "CS-2026-0013",
            "—",
            "peinture (1)",
            "0/0 · Préparation",
            "Hors étude",
          ],
          [
            "CS-2026-0009",
            "Holcim (1)",
            "acier (1)",
            "0/1 · En attente de réponses",
            "Liée",
          ],
        ]}
      />
      <Text tone="secondary">Clic ligne → fiche. CTA + → /new panier.</Text>
    </Stack>
  );
}
