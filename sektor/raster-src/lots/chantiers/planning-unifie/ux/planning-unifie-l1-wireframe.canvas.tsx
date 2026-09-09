import {
  Button,
  Callout,
  Divider,
  H1,
  H2,
  Pill,
  Row,
  Stack,
  Table,
  Text,
  useCanvasState,
  useHostTheme,
} from "cursor/canvas";

type ViewId =
  | "empty"
  | "loading"
  | "error"
  | "filtered"
  | "forbidden"
  | "execution"
  | "create"
  | "calendar"
  | "saved";

const VIEWS: { id: ViewId; label: string }[] = [
  { id: "empty", label: "Vide" },
  { id: "loading", label: "Chargement" },
  { id: "error", label: "Erreur API" },
  { id: "filtered", label: "Filtres vides" },
  { id: "forbidden", label: "Acces refuse" },
  { id: "execution", label: "Execution" },
  { id: "create", label: "Creer" },
  { id: "calendar", label: "Calendrier" },
  { id: "saved", label: "Vues" },
];

export default function PlanningUnifieL1Wireframe() {
  const t = useHostTheme();
  const [view, setView] = useCanvasState<ViewId>("view", "execution");

  return (
    <Stack gap={16} style={{ padding: 20, maxWidth: 1120 }}>
      <H1>Planning unifie — fondations L1</H1>
      <Text tone="secondary">
        Route existante /chantiers/planning?chantier=. Un planning commun, pas
        six ecrans. Palier 1 se facture sans une seule activite.
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

      {view === "empty" && <EmptyState />}
      {view === "loading" && <LoadingState t={t} />}
      {view === "error" && <ErrorState />}
      {view === "filtered" && <FilteredState />}
      {view === "forbidden" && <ForbiddenState />}
      {view === "execution" && <ExecutionState t={t} />}
      {view === "create" && <CreateState t={t} />}
      {view === "calendar" && <CalendarState />}
      {view === "saved" && <SavedViewsState />}

      <Divider />
      <H2>Decisions UX L1</H2>
      <Text>
        CTA vide = Construire le planning (Activite / Jalon / Phase), jamais
        « creez via l API ». Erreur API ≠ liste vide. Filtres sans resultat ≠
        chantier sans planning. Calendrier depuis le contexte, pas une sixieme
        barre. Vue sauvegardee = presentation, pas un second planning. Colonnes
        debut, fin, duree, predecesseurs visibles sans drawer. Fallback manuel :
        formulaire du drawer et du calendrier — pas d assistant IA.
      </Text>
      <Text tone="tertiary" size="small">
        Hors L1 : Ma semaine, Client, Financier, Ressources, Synthese, simulation,
        chemin critique. Maquette HTML atelier = discussion, pas SSOT.
      </Text>
    </Stack>
  );
}

function EmptyState() {
  return (
    <Frame title="CH-2026-014 · Planning">
      <Stack gap={12} style={{ padding: 28, alignItems: "flex-start" }}>
        <Text weight="semibold">Construire le planning</Text>
        <Text tone="secondary">
          Le chantier se facture deja. Ici on pose phases, activites et jalons
          sur le calendrier du chantier.
        </Text>
        <Row gap={8}>
          <Button variant="primary">Nouvelle activite</Button>
          <Button variant="secondary">Jalon</Button>
          <Button variant="secondary">Phase</Button>
        </Row>
        <Text size="small" tone="tertiary">
          Calendrier facultatif au premier geste — un defaut IANA Africa/Casablanca
          se cree a la premiere ecriture, jamais a la conversion.
        </Text>
      </Stack>
    </Frame>
  );
}

function LoadingState({ t }: { t: ReturnType<typeof useHostTheme> }) {
  return (
    <Frame title="CH-2026-014 · Planning">
      <Stack gap={10} style={{ padding: 20 }}>
        <Text size="small" tone="secondary">
          Chargement du planning — aucune ecriture tant que les donnees ne sont
          pas connues.
        </Text>
        {[220, 180, 260].map((w) => (
          <div
            key={w}
            style={{
              height: 18,
              width: w,
              borderRadius: 4,
              background: t.fill.tertiary,
            }}
          />
        ))}
      </Stack>
    </Frame>
  );
}

function ErrorState() {
  return (
    <Stack gap={12}>
      <Callout tone="danger" title="Le planning n a pas pu etre charge">
        Panne reseau ou API. Ce n est pas un chantier sans activite. Reessayer
        conserve le chantier et les filtres.
      </Callout>
      <Frame title="CH-2026-014 · Planning · filtres : Travaux, sept. 2026">
        <Stack gap={12} style={{ padding: 24, alignItems: "flex-start" }}>
          <Text weight="semibold">Impossible d afficher les activites</Text>
          <Text tone="secondary">
            Pas de tableau a zero ligne. Pas de badge « 0 activite ».
          </Text>
          <Button variant="primary">Reessayer</Button>
        </Stack>
      </Frame>
    </Stack>
  );
}

function FilteredState() {
  return (
    <Frame title="CH-2026-014 · Planning">
      <Stack gap={12} style={{ padding: 20, alignItems: "flex-start" }}>
        <Row gap={8}>
          <Pill tone="info" size="sm">
            Nature : Travaux
          </Pill>
          <Pill tone="info" size="sm">
            Zone : Bat B
          </Pill>
        </Row>
        <Text weight="semibold">Aucun resultat pour ces filtres</Text>
        <Text tone="secondary">
          Les activites existent toujours. On n invite pas a recreer le planning.
        </Text>
        <Button variant="secondary">Effacer les filtres</Button>
      </Stack>
    </Frame>
  );
}

function ForbiddenState() {
  return (
    <Stack gap={12}>
      <Callout tone="warning" title="Acces refuse">
        Ce chantier n est pas dans votre perimetre. Aucun libelle, date ou
        identifiant d activite n est montre.
      </Callout>
      <Frame title="Planning">
        <Stack gap={10} style={{ padding: 24, alignItems: "flex-start" }}>
          <Text>Retourner a un chantier autorise.</Text>
          <Button variant="primary">Ouvrir mes chantiers</Button>
        </Stack>
      </Frame>
    </Stack>
  );
}

function ExecutionState({ t }: { t: ReturnType<typeof useHostTheme> }) {
  return (
    <Stack gap={10}>
      <Row gap={8} wrap>
        <Pill tone="neutral" size="sm">
          Vue : Execution
        </Pill>
        <Pill tone="neutral" size="sm">
          Calendrier v1 · Africa/Casablanca
        </Pill>
        <Text size="small" tone="secondary">
          Pas de nav Synthese / Semaine / Client / Finance dans L1
        </Text>
      </Row>
      <Frame title="CH-2026-014 · Planning">
        <Row
          gap={8}
          style={{
            padding: 10,
            borderBottom: `1px solid ${t.stroke.tertiary}`,
          }}
        >
          <Button variant="primary">Nouveau</Button>
          <Button variant="secondary">Calendrier</Button>
          <Button variant="secondary">Enregistrer la vue</Button>
          <Pill size="sm">Convention 1 j = 8 h</Pill>
        </Row>
        <Table
          headers={[
            "Activite / code",
            "Forme",
            "Debut",
            "Fin",
            "Duree",
            "Predecesseurs",
          ]}
          rows={[
            [
              "PH-01 Installation",
              "Phase",
              "08/09/2026",
              "12/09/2026",
              "derivee",
              "—",
            ],
            [
              "A-12 Coffrage R+1",
              "Activite",
              "08/09/2026",
              "11/09/2026",
              "24 h",
              "A-10 · FD",
            ],
            [
              "A-13 Coulage dalle",
              "Activite",
              "12/09/2026",
              "12/09/2026",
              "8 h",
              "A-12 · FD +1 j",
            ],
            [
              "J-04 Reception BET",
              "Jalon",
              "15/09/2026",
              "15/09/2026",
              "0",
              "A-13 · FD",
            ],
          ]}
          striped
        />
        <div style={{ padding: 10 }}>
          <Text size="small" tone="tertiary">
            Chronologie a droite (Gantt existant). Jalon = losange, duree zero.
            Phase repliable. Annee toujours visible. Glisser une barre n ecrit
            pas tant que L2 simulation n existe pas — le drawer reste le
            fallback.
          </Text>
        </div>
      </Frame>
    </Stack>
  );
}

function CreateState({ t }: { t: ReturnType<typeof useHostTheme> }) {
  return (
    <Row gap={12} align="start">
      <div style={{ flex: 1 }}>
        <Frame title="Gantt (fond)">
          <Text tone="secondary" style={{ padding: 16 }}>
            L ecran reste /chantiers/planning. Le drawer porte la saisie.
          </Text>
        </Frame>
      </div>
      <DrawerShell title="Nouvelle ligne" t={t}>
        <Text size="small" tone="secondary">
          Forme — jamais un jalon d un jour
        </Text>
        <Row gap={6}>
          <Pill tone="info" size="sm">
            Activite
          </Pill>
          <Pill tone="neutral" size="sm">
            Jalon
          </Pill>
          <Pill tone="neutral" size="sm">
            Phase
          </Pill>
        </Row>
        <Field label="Intitule" value="Coffrage R+1" t={t} />
        <Field label="Nature" value="Travaux" t={t} />
        <Field label="Debut" value="08/09/2026" t={t} />
        <Field label="Duree" value="24 h  (3 j × 8 h)" t={t} />
        <Text size="small" tone="tertiary">
          Fin calculee par le calendrier chantier. Dates contraintes = L2.
        </Text>
        <Row gap={8}>
          <Button variant="primary">Enregistrer</Button>
          <Button variant="secondary">Annuler</Button>
        </Row>
      </DrawerShell>
    </Row>
  );
}

function CalendarState() {
  return (
    <Stack gap={10}>
      <Callout tone="info" title="Calendrier du chantier">
        Fuseau Africa/Casablanca. Semaine type + exceptions. Modifier ne reecrit
        pas le realise. A04 provisoire : pas de calendrier par activite en L1.
      </Callout>
      <Frame title="Calendrier v1 · effet 01/09/2026">
        <Table
          headers={["Jour", "Creneaux", "Note"]}
          rows={[
            ["Lun–Ven", "08:00–12:00 · 14:00–18:00", "8 h"],
            ["Samedi", "08:00–12:00", "ouvert"],
            ["Dimanche", "ferme", "—"],
            ["21/09/2026", "ferme", "exception"],
          ]}
          striped
        />
        <div style={{ padding: 12 }}>
          <Row gap={8}>
            <Button variant="primary">Enregistrer</Button>
            <Button variant="secondary">Annuler</Button>
          </Row>
          <Text size="small" tone="tertiary" style={{ marginTop: 8 }}>
            Chef : proposer si le droit d administrer manque. Conducteur / DT :
            appliquer. Pas de simulation d impact (L2).
          </Text>
        </div>
      </Frame>
    </Stack>
  );
}

function SavedViewsState() {
  return (
    <Stack gap={10}>
      <Callout tone="neutral" title="Vue = presentation">
        Nom, filtres, colonnes, regroupement, tri, echelle. Reevaluer les
        permissions a chaque ouverture. Une vue ne donne aucun acces.
      </Callout>
      <Frame title="Vues sauvegardees">
        <Table
          headers={["Nom", "Portee", "Contenu"]}
          rows={[
            [
              "Travaux R+1",
              "Perso",
              "nature=Travaux · colonnes duree+pred · echelle semaine",
            ],
            ["Tout le chantier", "Perso", "aucun filtre · echelle mois"],
          ]}
          striped
        />
        <div style={{ padding: 12 }}>
          <Row gap={8}>
            <Button variant="primary">Enregistrer sous…</Button>
            <Button variant="secondary">Appliquer Travaux R+1</Button>
          </Row>
        </div>
      </Frame>
    </Stack>
  );
}

function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  const t = useHostTheme();
  return (
    <div
      style={{
        border: `1px solid ${t.stroke.secondary}`,
        background: t.bg.editor,
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "8px 12px",
          borderBottom: `1px solid ${t.stroke.tertiary}`,
          background: t.bg.chrome,
        }}
      >
        <Text size="small" weight="semibold">
          {title}
        </Text>
      </div>
      {children}
    </div>
  );
}

function DrawerShell({
  title,
  children,
  t,
}: {
  title: string;
  children: React.ReactNode;
  t: ReturnType<typeof useHostTheme>;
}) {
  return (
    <div
      style={{
        width: 320,
        flexShrink: 0,
        border: `1px solid ${t.stroke.secondary}`,
        background: t.bg.elevated,
        borderRadius: 8,
        padding: 14,
      }}
    >
      <Stack gap={10}>
        <Text weight="semibold">{title}</Text>
        {children}
      </Stack>
    </div>
  );
}

function Field({
  label,
  value,
  t,
}: {
  label: string;
  value: string;
  t: ReturnType<typeof useHostTheme>;
}) {
  return (
    <div>
      <Text size="small" tone="secondary">
        {label}
      </Text>
      <div
        style={{
          marginTop: 4,
          padding: "6px 8px",
          border: `1px solid ${t.stroke.tertiary}`,
          borderRadius: 6,
        }}
      >
        <Text size="small">{value}</Text>
      </div>
    </div>
  );
}
