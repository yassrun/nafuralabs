import {
  Button,
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

type ViewId = "dg" | "dt" | "conducteur" | "chef" | "chef-equipe";

const VIEWS: { id: ViewId; label: string }[] = [
  { id: "dg", label: "DG / Owner" },
  { id: "dt", label: "Directeur travaux" },
  { id: "conducteur", label: "Conducteur" },
  { id: "chef", label: "Chef de chantier" },
  { id: "chef-equipe", label: "Chef d equipe" },
];

type Member = {
  nom: string;
  role: string;
  canRemove: boolean;
};

const TEAM: Member[] = [
  { nom: "Karim El Fassi", role: "Directeur travaux", canRemove: false },
  { nom: "Sara Bennani", role: "Conducteur de travaux", canRemove: false },
  { nom: "Youssef Amrani", role: "Chef de chantier", canRemove: false },
  { nom: "Mehdi Lahlou", role: "Chef d equipe", canRemove: false },
  { nom: "Nadia Tazi", role: "Pointeur", canRemove: false },
];

function withRemoves(canRemoveRoles: string[]): Member[] {
  return TEAM.map((m) => ({
    ...m,
    canRemove: canRemoveRoles.includes(m.role),
  }));
}

const VIEW: Record<
  ViewId,
  { grade: string; roles: string[]; members: Member[]; hint: string }
> = {
  dg: {
    grade: "Direction — tous chantiers",
    roles: [
      "Directeur travaux",
      "Conducteur",
      "Chef de chantier",
      "Ingenieur",
      "Magasinier",
      "Chef d equipe",
      "Pointeur",
    ],
    members: withRemoves([
      "Directeur travaux",
      "Conducteur de travaux",
      "Chef de chantier",
      "Chef d equipe",
      "Pointeur",
    ]),
    hint: "Le DG nomme le DT et, par cascade, toute l equipe.",
  },
  dt: {
    grade: "DT — chantiers ou il est affecte",
    roles: [
      "Conducteur",
      "Chef de chantier",
      "Ingenieur",
      "Magasinier",
      "Chef d equipe",
      "Pointeur",
    ],
    members: withRemoves([
      "Conducteur de travaux",
      "Chef de chantier",
      "Chef d equipe",
      "Pointeur",
    ]),
    hint: "Pas de Directeur travaux dans la liste. Retirer un pair DT est refuse.",
  },
  conducteur: {
    grade: "Conducteur — ses chantiers",
    roles: [
      "Chef de chantier",
      "Ingenieur",
      "Magasinier",
      "Chef d equipe",
      "Pointeur",
    ],
    members: withRemoves(["Chef de chantier", "Chef d equipe", "Pointeur"]),
    hint: "Complete l equipe operationnelle. Ne nomme ni DT ni autre conducteur.",
  },
  chef: {
    grade: "Chef de chantier — son chantier",
    roles: ["Chef d equipe", "Pointeur"],
    members: withRemoves(["Chef d equipe", "Pointeur"]),
    hint: "Organise le terrain. Pas de chef de chantier, conducteur ou DT.",
  },
  "chef-equipe": {
    grade: "Chef d equipe — aucun commandement RH",
    roles: [],
    members: withRemoves([]),
    hint: "Lit l equipe. Repartit les taches ailleurs (planning). Pas d affectation RH.",
  },
};

export default function EquipeAutoriteWireframe() {
  const [view, setView] = useCanvasState<ViewId>("view", "dt");
  const current = VIEW[view];

  return (
    <Stack gap={16} style={{ padding: 20, maxWidth: 960 }}>
      <H1>Onglet Equipe — autorite de nomination</H1>
      <Text tone="secondary">
        Une comparaison de grade, pas une matrice IAM. IAM ouvre la porte ;
        le domaine decide qui on peut nommer sur ce chantier.
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

      <Callout tone="info" title={current.grade}>
        {current.hint}
      </Callout>

      <H2>CH-2026-014 · Equipe</H2>
      <Row gap={8} align="center" justify="space-between">
        <Text weight="semibold">Membres actifs</Text>
        {current.roles.length > 0 ? (
          <Button variant="primary">Ajouter</Button>
        ) : (
          <Pill tone="neutral" size="sm">
            Pas d ajout
          </Pill>
        )}
      </Row>

      {current.roles.length > 0 && (
        <Stack gap={6}>
          <Text tone="secondary">Roles proposés dans le formulaire</Text>
          <Row gap={6} wrap>
            {current.roles.map((role) => (
              <Pill key={role} tone="info" size="sm">
                {role}
              </Pill>
            ))}
          </Row>
        </Stack>
      )}

      <Table
        headers={["Employe", "Role", "Action"]}
        rows={current.members.map((m) => [
          m.nom,
          m.role,
          m.canRemove ? "Retirer" : "—",
        ])}
        rowTone={current.members.map((m) =>
          m.canRemove ? "success" : undefined,
        )}
        striped
      />

      {current.roles.length === 0 && (
        <Callout tone="warning" title="Chef d equipe">
          Empty state distinct si l equipe est vide : lecture seule, pas
          « Affectez des employes ». La repartition des ouvriers n est pas
          cet ecran.
        </Callout>
      )}

      <Text tone="tertiary" size="small">
        Source : 00-PLAN equipe-autorite · grade(acteur) &gt; grade(cible)
      </Text>
      <Text tone="tertiary" size="small">
        Fallback manuel : si l API refuse (403), toast « Vous ne pouvez pas
        nommer ce role sur ce chantier ». Pas de contournement UI.
      </Text>
    </Stack>
  );
}
