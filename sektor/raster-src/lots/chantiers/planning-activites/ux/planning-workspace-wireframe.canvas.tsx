import {
  Button,
  Callout,
  Divider,
  H1,
  H2,
  Pill,
  Row,
  Stack,
  Text,
  useCanvasState,
  useHostTheme,
} from "cursor/canvas";

type ViewId = "empty" | "gantt" | "create" | "link";

export default function PlanningWorkspaceWireframe() {
  const t = useHostTheme();
  const [view, setView] = useCanvasState<ViewId>("view", "gantt");

  return (
    <Stack gap={16} style={{ padding: 20, maxWidth: 1100 }}>
      <H1>Planning chantier — workspace conducteur</H1>
      <Text tone="secondary">
        Qualité étude : Gantt + drawer. Pas de lots dans le calendrier. AC-13 → AC-19.
      </Text>
      <Row gap={8}>
        {(
          [
            ["empty", "Vide"],
            ["gantt", "Gantt"],
            ["create", "Créer"],
            ["link", "Rattacher"],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            variant={view === id ? "primary" : "secondary"}
            onClick={() => setView(id)}
          >
            {label}
          </Button>
        ))}
      </Row>
      <Callout tone="warning" title="Aujourd'hui (178)">
        Empty state « créez via l'API ». Drawer lecture UUID. Pas de picker lot/poste, pas de qté faite.
      </Callout>

      {view === "empty" && (
        <Frame title="CH-2026-001 · Planning">
          <Stack gap={12} style={{ padding: 24, alignItems: "flex-start" }}>
            <Text weight="semibold">Aucune activité</Text>
            <Text tone="secondary">
              Le chantier se facture déjà sans planning. Ici on planifie le terrain — coffrage, coulage, repli.
            </Text>
            <Button variant="primary">Nouvelle activité</Button>
          </Stack>
        </Frame>
      )}

      {view === "gantt" && (
        <Frame title="CH-2026-001 · Planning">
          <Row gap={8} style={{ padding: 10, borderBottom: `1px solid ${t.stroke.tertiary}` }}>
            <Button variant="primary">Nouvelle activité</Button>
            <Pill size="sm">3 activités</Pill>
            <Text tone="secondary" size="small">
              Lots hors Gantt — ils restent dans l&apos;arbre
            </Text>
          </Row>
          <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", minHeight: 280 }}>
            <div style={{ borderRight: `1px solid ${t.stroke.tertiary}`, padding: 10 }}>
              <Text size="small" tone="secondary">
                Activité
              </Text>
              <Bar label="Installation" />
              <Bar label="Coffrage R+1" selected />
              <Bar label="Coulage dalle N3" indent />
            </div>
            <div style={{ padding: 10, position: "relative" }}>
              <Text size="small" tone="secondary">
                sept. 2026
              </Text>
              <div
                style={{
                  marginTop: 28,
                  height: 18,
                  width: "28%",
                  background: t.fill.tertiary,
                  borderRadius: 4,
                }}
              />
              <div
                style={{
                  marginTop: 14,
                  height: 18,
                  width: "42%",
                  marginLeft: "18%",
                  background: t.accent.primary,
                  borderRadius: 4,
                }}
              />
              <div
                style={{
                  marginTop: 14,
                  height: 18,
                  width: "22%",
                  marginLeft: "48%",
                  background: t.fill.secondary,
                  borderRadius: 4,
                }}
              />
            </div>
          </div>
        </Frame>
      )}

      {view === "create" && (
        <Row gap={12} align="start">
          <div style={{ flex: 1 }}>
            <Frame title="Gantt (fond)">
              <Text tone="secondary" style={{ padding: 16 }}>
                Barres en arrière-plan. Le drawer porte la saisie.
              </Text>
            </Frame>
          </div>
          <DrawerShell title="Nouvelle activité">
            <Field label="Libellé" value="Coffrage R+1" />
            <Field label="Début" value="2026-09-08" />
            <Field label="Fin" value="2026-09-19" />
            <Field label="Sous" value="(aucune — racine)" muted />
            <Field label="Zone" value="(aucune — facultatif)" muted />
            <Text size="small" tone="secondary">
              Rattacher au bordereau : après enregistrement, même drawer.
            </Text>
            <Row gap={8}>
              <Button variant="primary">Enregistrer</Button>
              <Button variant="secondary">Annuler</Button>
            </Row>
          </DrawerShell>
        </Row>
      )}

      {view === "link" && (
        <Row gap={12} align="start">
          <div style={{ flex: 1 }}>
            <Frame title="Coffrage R+1 sélectionné">
              <Text tone="secondary" style={{ padding: 16 }}>
                Pas une barre « 1.1 Béton armé ». Le poste est lié, pas dessiné.
              </Text>
            </Frame>
          </div>
          <DrawerShell title="Coffrage R+1">
            <Field label="Zone" value="Bât A · R+1" />
            <H2>Travaux liés</H2>
            <Text size="small">1.1 Béton armé · 50 m³ / 100 m³ restants 50</Text>
            <Field label="Ajouter un poste" value="Choisir dans l'arbre…" muted />
            <Field label="Quantité prévue" value="50 m³" />
            <Callout tone="danger" title="Si 60 m³ de plus">
              Reste 50 m³ sur le poste — pas de 4xx brute.
            </Callout>
            <H2>Avancement</H2>
            <Field label="Quantité faite" value="12 m³" />
            <Field label="Date" value="2026-09-12" />
            <Button variant="primary">Enregistrer</Button>
          </DrawerShell>
        </Row>
      )}

      <Divider />
      <H2>Décisions UX</H2>
      <Text>CTA + empty = créer. Drawer = éditer / rattacher / avancer. Lots jamais en barre. Manuel, pas d&apos;IA. Phases PDF ≠ ce Gantt.</Text>
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

function DrawerShell({ title, children }: { title: string; children: React.ReactNode }) {
  const t = useHostTheme();
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

function Field({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  const t = useHostTheme();
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
          color: muted ? t.text.tertiary : t.text.primary,
        }}
      >
        <Text size="small">{value}</Text>
      </div>
    </div>
  );
}

function Bar({ label, selected, indent }: { label: string; selected?: boolean; indent?: boolean }) {
  const t = useHostTheme();
  return (
    <div
      style={{
        marginTop: 8,
        marginLeft: indent ? 12 : 0,
        padding: "6px 8px",
        borderRadius: 4,
        background: selected ? t.fill.secondary : "transparent",
        color: t.text.primary,
      }}
    >
      <Text size="small">{label}</Text>
    </div>
  );
}
