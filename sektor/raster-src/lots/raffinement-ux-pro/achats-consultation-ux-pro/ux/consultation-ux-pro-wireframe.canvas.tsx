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
 * Consultation Achats — UX pro (raffinement)
 * Itère le canvas métier `consultation/ux/consultation-achats-wireframe.canvas.tsx`
 * sur list / create / detail chrome. Overlay étude + flag = hors vues ici.
 */

type ViewId =
  | "liste"
  | "liste-vide"
  | "liste-erreur"
  | "create"
  | "create-picker"
  | "create-erreur"
  | "fiche"
  | "fiche-import"
  | "fiche-chargement";

const VIEWS: { id: ViewId; label: string }[] = [
  { id: "liste", label: "Liste OK" },
  { id: "liste-vide", label: "Liste vide" },
  { id: "liste-erreur", label: "Liste erreur" },
  { id: "create", label: "Créer" },
  { id: "create-picker", label: "Picker panier" },
  { id: "create-erreur", label: "Créer erreur" },
  { id: "fiche", label: "Fiche" },
  { id: "fiche-import", label: "Import magique" },
  { id: "fiche-chargement", label: "Fiche load" },
];

export default function ConsultationUxProWireframe() {
  const [view, setView] = useCanvasState<ViewId>("liste");

  return (
    <Stack gap={16} style={{ maxWidth: 960, padding: 24 }}>
      <H1>Consultation Achats — UX pro</H1>
      <Text tone="secondary">
        Entity listing / detail. Create = combobox fournisseur + panier
        multi-lignes via app-article-picker. Plus de textarea cle_stable.
        Import magique sur la fiche inchangé.
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

      {view === "liste" && <ListeOk />}
      {view === "liste-vide" && <ListeVide />}
      {view === "liste-erreur" && <ListeErreur />}
      {view === "create" && <CreateForm />}
      {view === "create-picker" && <CreatePicker />}
      {view === "create-erreur" && <CreateErreur />}
      {view === "fiche" && <FicheOk />}
      {view === "fiche-import" && <FicheImport />}
      {view === "fiche-chargement" && <FicheChargement />}

      <Spacer />
      <H2>Décisions UX</H2>
      <Text>
        Liste et fiche = même anatomie que DA / BC / AO (nf-entity-*). Create :
        fournisseur combobox (lookupKey fournisseurs), panier lignes + CTA
        « Ajouter un article » → picker partagé catalogue. Mort : textarea
        cle_stable, table HTML custom, pills hors anatomy. Vivant : import
        magique sur fiche (SEKTOR-135).
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

function ListeOk() {
  return (
    <Stack gap={12}>
      <ChromeAchats />
      <Callout tone="info">
        AC-1…AC-3 — nf-entity-listing. Plus de &lt;table&gt; custom.
      </Callout>
      <Row gap={8}>
        <TextInput placeholder="Rechercher…" />
        <Button variant="primary">+ Consultation</Button>
      </Row>
      <Table
        headers={["N°", "Fournisseur", "Panier", "Statut", "Lien"]}
        rows={[
          ["CS-2026-0004", "Lafarge", "ciment, sable (2)", "1 devis", "DE-0050"],
          ["CS-2026-0005", "Sika", "peinture (1)", "Demande", "Hors étude"],
        ]}
      />
      <Text tone="secondary">Clic ligne → fiche. Filtre liée / hors = anatomy filters.</Text>
    </Stack>
  );
}

function ListeVide() {
  return (
    <Stack gap={12}>
      <ChromeAchats />
      <H2>Aucune consultation</H2>
      <Text>
        Créer hors étude — le lien dossier reste vide. Overlay étude peut
        rattacher plus tard.
      </Text>
      <Button variant="primary">+ Consultation</Button>
    </Stack>
  );
}

function ListeErreur() {
  return (
    <Stack gap={12}>
      <ChromeAchats />
      <Callout tone="danger">
        Impossible de charger les consultations. Réessayer.
      </Callout>
      <Button variant="secondary">Réessayer</Button>
    </Stack>
  );
}

function CreateForm() {
  return (
    <Stack gap={12}>
      <ChromeAchats />
      <H2>Nouvelle consultation</H2>
      <Callout tone="warning">
        Mort : textarea « Panier (cle_stable, une par ligne) ». Cible : lignes
        + picker.
      </Callout>
      <Stack gap={6}>
        <Text>Fournisseur *</Text>
        <TextInput placeholder="Taper ≥ 2 car. — recherche serveur…" />
        <Text tone="secondary">Combobox lookupKey=fournisseurs · œil fiche</Text>
      </Stack>
      <Divider />
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
      <Text tone="secondary">Lien étude : aucun. La consultation vit dans Achats.</Text>
    </Stack>
  );
}

function CreatePicker() {
  return (
    <Stack gap={12}>
      <H2>Picker article (overlay)</H2>
      <Callout tone="info">
        AC-9 — app-article-picker partagé. Ouverture vide. Pas de dump. Pas de
        pied DPU qty+PU obligatoire (contexte choix article).
      </Callout>
      <TextInput placeholder="Code ou désignation (≥ 2 car.)…" />
      <Table
        headers={["Code", "Désignation", "Unité"]}
        rows={[
          ["ciment-cpj-45", "Ciment CPJ 45", "t"],
          ["ciment-cpj-55", "Ciment CPJ 55", "t"],
        ]}
      />
      <Row gap={8}>
        <Button variant="primary">Choisir</Button>
        <Button variant="secondary">Fermer</Button>
      </Row>
    </Stack>
  );
}

function CreateErreur() {
  return (
    <Stack gap={12}>
      <H2>Nouvelle consultation</H2>
      <TextInput placeholder="Lafarge (posé)" />
      <Callout tone="danger">
        Ajoutez au moins un article au panier. — ou — Erreur API : formulaire
        conservé.
      </Callout>
      <Text tone="secondary">Panier vide → pas de POST (AC-12).</Text>
      <Button variant="primary" disabled>
        Créer
      </Button>
    </Stack>
  );
}

function FicheOk() {
  return (
    <Stack gap={12}>
      <ChromeAchats />
      <Callout tone="info">
        AC-4…AC-6 — nf-entity-detail. Identité + panier en anatomy, pas pills
        orphelines.
      </Callout>
      <H2>CS-2026-0004</H2>
      <Row gap={8} wrap>
        <Pill>Lafarge</Pill>
        <Pill tone="warning">0 devis</Pill>
        <Pill>Hors étude</Pill>
      </Row>
      <H2>Panier</H2>
      <Table
        headers={["Code", "Désignation"]}
        rows={[
          ["ciment-cpj-45", "Ciment CPJ 45"],
          ["sable-de-dune", "Sable de dune"],
        ]}
      />
      <H2>Déposer le devis</H2>
      <Text tone="secondary">Import magique — voir vue « Import magique ».</Text>
      <Button variant="secondary">Retour à la liste</Button>
    </Stack>
  );
}

function FicheImport() {
  return (
    <Stack gap={12}>
      <Row gap={8}>
        <Pill>CS-2026-0004</Pill>
        <Pill>Lafarge</Pill>
        <Pill tone="warning">0 devis</Pill>
      </Row>
      <Callout tone="success">
        AC-5 — Conservé. On importe le fichier. Pas de saisie manuelle des prix.
        Pas de textarea cle_stable=prix.
      </Callout>
      <H2>Déposer le devis</H2>
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
    </Stack>
  );
}

function FicheChargement() {
  return (
    <Stack gap={12}>
      <ChromeAchats />
      <Text>Chargement de la consultation…</Text>
      <Text tone="secondary">Skeleton / message — pas de faux KPI ni pills vides.</Text>
    </Stack>
  );
}
