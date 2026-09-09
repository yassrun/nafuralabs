import {
  Callout,
  H1,
  H2,
  Pill,
  Row,
  Stack,
  Table,
  Text,
  useCanvasState,
} from "cursor/canvas";

type ViewId = "nav" | "postes" | "fiche";

export default function ReferentielsPosteDepartementWireframe() {
  const [view, setView] = useCanvasState<ViewId>("view", "fiche");

  return (
    <Stack gap={16} style={{ padding: 20, maxWidth: 920 }}>
      <H1>RH — postes et départements</H1>
      <Text tone="secondary">
        Référentiels du module RH. Le rôle IAM n&apos;apparait pas ici. Le rôle
        chantier se nomme ailleurs, onglet Équipe.
      </Text>

      <Row gap={8}>
        <Pill
          tone={view === "nav" ? "info" : "neutral"}
          size="sm"
          onClick={() => setView("nav")}
        >
          Nav RH
        </Pill>
        <Pill
          tone={view === "postes" ? "info" : "neutral"}
          size="sm"
          onClick={() => setView("postes")}
        >
          Listing Postes
        </Pill>
        <Pill
          tone={view === "fiche" ? "info" : "neutral"}
          size="sm"
          onClick={() => setView("fiche")}
        >
          Fiche employé
        </Pill>
      </Row>

      {view === "nav" && (
        <Stack gap={8}>
          <H2>Sidebar Ressources humaines</H2>
          <Table
            headers={["Item", "Route"]}
            rows={[
              ["Employés", "/rh/employes"],
              ["Postes", "/rh/postes"],
              ["Départements", "/rh/departements"],
              ["Pointage…", "/rh/pointage"],
            ]}
            striped
          />
        </Stack>
      )}

      {view === "postes" && (
        <Stack gap={8}>
          <H2>Postes</H2>
          <Table
            headers={["Code", "Libellé", "Actif"]}
            rows={[
              ["CONDUCTEUR", "Conducteur de travaux", "oui"],
              ["CHEF-CHANTIER", "Chef de chantier", "oui"],
              ["MACON", "Maçon", "oui"],
            ]}
            striped
          />
          <Text tone="tertiary" size="small">
            Même écran pour Départements (QA, Gros œuvre, Siège).
          </Text>
        </Stack>
      )}

      {view === "fiche" && (
        <Stack gap={8}>
          <H2>Contrat — fiche employé</H2>
          <Callout tone="info" title="Combobox, pas de texte libre">
            Poste et département : taper ≥ 2 caractères. Œil = listing RH.
            Le compte IAM (userId) reste un lien optionnel, hors de ces champs.
          </Callout>
          <Table
            headers={["Champ", "Contrôle"]}
            rows={[
              ["Poste *", "combobox rhPostes"],
              ["Département", "combobox rhDepartements"],
              ["Catégorie", "enum Ouvrier / Cadre…"],
              ["Type de contrat", "enum CDI / CDD…"],
            ]}
            striped
          />
        </Stack>
      )}
    </Stack>
  );
}
