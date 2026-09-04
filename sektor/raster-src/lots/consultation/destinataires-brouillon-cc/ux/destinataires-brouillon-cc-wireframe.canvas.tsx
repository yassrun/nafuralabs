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
 * Consultation — brouillon destinataires + N contacts (CC).
 * SSOT Raster : lots/consultation/destinataires-brouillon-cc/ux/
 * Remplace le write-through inline. Save = pattern fiche.
 */

type ViewId = "liste" | "sans-contact" | "brouillon" | "fiche-contacts" | "fiche-contrats";

const VIEWS: { id: ViewId; label: string }[] = [
  { id: "liste", label: "Liste de contacts" },
  { id: "sans-contact", label: "Aucun contact" },
  { id: "brouillon", label: "Brouillon avant save" },
  { id: "fiche-contacts", label: "Onglet Contacts" },
  { id: "fiche-contrats", label: "Onglet Contrats" },
];

export default function DestinatairesBrouillonCcWireframe() {
  const [view, setView] = useCanvasState<ViewId>(
    "destinataires-brouillon-cc-view",
    "liste",
  );

  return (
    <Stack gap={16} style={{ maxWidth: 960, padding: 24 }}>
      <H1>Consultation — destinataires comme un CC</H1>
      <Text tone="secondary">
        Ajouter ne parle pas au serveur. Les e-mails viennent des contacts du
        fournisseur. Plusieurs contacts = To + CC. Créer un contact se fait sur
        la fiche.
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

      {view === "liste" && <ListeContacts />}
      {view === "sans-contact" && <SansContact />}
      {view === "brouillon" && <Brouillon />}
      {view === "fiche-contacts" && <FicheContacts />}
      {view === "fiche-contrats" && <FicheContrats />}

      <Spacer />
      <H2>Décisions UX (gel 04/09 brouillon)</H2>
      <Text>
        1. Ajouter = ligne locale. 2. Enregistrer persiste la liste. 3. Cases
        contacts, pas un e-mail libre. 4. Lien « Ajouter un contact » → onglet
        Contacts. 5. Contrats fournisseur = onglet Contrats, pas mélangé avec
        les personnes. 6. 1er contact = To, suivants = CC. 7. Envoyer seulement
        après save.
      </Text>
    </Stack>
  );
}

function Chrome() {
  return (
    <Row gap={8} wrap>
      <Pill>Achats</Pill>
      <Pill tone="info">Consultations</Pill>
      <Pill>CS-2026-0138</Pill>
      <Pill tone="neutral">Préparation</Pill>
    </Row>
  );
}

function ListeContacts() {
  return (
    <Stack gap={12}>
      <Chrome />
      <H2>Destinataires</H2>
      <Table
        headers={["Fournisseur", "Statut", "Devis"]}
        rows={[
          [
            "Holcim\n  À  A. Benali — achat@holcim.example\n  Cc B. Kadiri — devis@holcim.example",
            "En attente",
            "Import magique",
          ],
        ]}
      />
      <TextInput placeholder="Taper ≥ 2 car. — rechercher un fournisseur…" />
      <Callout tone="info">
        AC-3 — Liste des contacts e-mail. Cocher plusieurs = CC.
      </Callout>
      <Text>☑ A. Benali — achat@holcim.example (To)</Text>
      <Text>☑ B. Kadiri — devis@holcim.example (Cc)</Text>
      <Row gap={8}>
        <Button variant="secondary">Ajouter</Button>
        <Button variant="primary">Enregistrer</Button>
        <Button variant="secondary">Ajouter un contact</Button>
      </Row>
    </Stack>
  );
}

function SansContact() {
  return (
    <Stack gap={12}>
      <Chrome />
      <H2>Ajouter un destinataire</H2>
      <TextInput placeholder="Béton Atlas (posé)" />
      <Callout tone="danger">
        AC-4 — Aucun contact e-mail sur la fiche. Pas de saisie ici.
      </Callout>
      <Row gap={8}>
        <Button variant="primary" disabled>
          Ajouter
        </Button>
        <Button variant="secondary">Ajouter un contact</Button>
      </Row>
    </Stack>
  );
}

function Brouillon() {
  return (
    <Stack gap={12}>
      <Chrome />
      <H2>Destinataires (non enregistré)</H2>
      <Table
        headers={["Fournisseur", "Contacts", "Statut"]}
        rows={[["Sika", "M. Kadiri — devis@sika.example", "Brouillon"]]}
      />
      <Callout tone="warning">
        AC-1 / AC-8 — Ligne locale. Envoyer reste inactif tant que ce n’est pas
        enregistré.
      </Callout>
      <Row gap={8}>
        <Button variant="primary">Enregistrer</Button>
        <Button variant="secondary" disabled>
          Envoyer la consultation
        </Button>
      </Row>
    </Stack>
  );
}

function FicheContacts() {
  return (
    <Stack gap={12}>
      <Row gap={8} wrap>
        <Pill>Achats</Pill>
        <Pill tone="info">Fournisseurs</Pill>
        <Pill>FRN-0142 — Béton Atlas</Pill>
      </Row>
      <H2>Fiche fournisseur — onglet Contacts</H2>
      <Row gap={8} wrap>
        <Pill>Informations</Pill>
        <Pill tone="info">Contacts</Pill>
        <Pill>Contrats</Pill>
        <Pill>Attestations</Pill>
        <Pill>Catalogue</Pill>
      </Row>
      <Callout tone="info">
        AC-5 — Personnes ici. Lien consultation :
        /achats/fournisseurs/{"{id}"}?tab=contacts. Les contrats sont l’onglet
        voisin, pas cette liste.
      </Callout>
      <Table
        headers={["Nom", "E-mail", "Principal"]}
        rows={[
          ["Karim Haddad", "achat@beton.ma", "Oui"],
          ["Sara Kadiri", "devis@beton.ma", "Non"],
        ]}
      />
      <Text tone="secondary">
        Personnes du fournisseur. Un seul principal = destinataire « À ».
      </Text>
      <TextInput placeholder="Nom" />
      <TextInput placeholder="e-mail@fournisseur.ma" />
      <Button variant="primary">Enregistrer le contact</Button>
    </Stack>
  );
}

function FicheContrats() {
  return (
    <Stack gap={12}>
      <Row gap={8} wrap>
        <Pill>Achats</Pill>
        <Pill tone="info">Fournisseurs</Pill>
        <Pill>FRN-0142 — Béton Atlas</Pill>
      </Row>
      <H2>Fiche fournisseur — onglet Contrats</H2>
      <Row gap={8} wrap>
        <Pill>Informations</Pill>
        <Pill>Contacts</Pill>
        <Pill tone="info">Contrats</Pill>
        <Pill>Attestations</Pill>
        <Pill>Catalogue</Pill>
      </Row>
      <Callout tone="info">
        Contrats fournisseur de ce partenaire. Pas les personnes. Nouveau
        contrat préremplit le fournisseur.
      </Callout>
      <Row gap={8}>
        <Button variant="primary">Nouveau contrat</Button>
      </Row>
      <Table
        headers={["N°", "Type", "Début", "Fin", "Plafond HT", "Statut"]}
        rows={[
          ["CT-2026-014", "Cadre", "01/01/2026", "31/12/2026", "1 200 000 MAD", "En cours"],
          ["CT-2025-088", "Ponctuel", "15/03/2025", "15/09/2025", "80 000 MAD", "Échu"],
        ]}
      />
    </Stack>
  );
}
