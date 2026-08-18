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
  TextInput,
  useCanvasState,
} from "cursor/canvas";

/**
 * Socle Raster — chrome. SSOT: raster/pact/socle/ux/socle-wireframe.canvas.tsx
 *
 * Décisions UX
 * - Nav = Toi · En cours · Inbox · Backlog · Done agent — plus de vue Sprint
 * - Capture sticky globale (pas par projet)
 * - Pas d’auth, pas de BDD
 * - Détail à droite ; CTA agent + fallback fichier/CLI
 */

type ViewId = "toi" | "encours" | "inbox" | "backlog" | "done-agent";

export default function SocleWireframe() {
  const [view, setView] = useCanvasState<ViewId>("socle-view", "toi");

  return (
    <Stack gap={16} style={{ maxWidth: 880 }}>
      <H1>Raster — socle</H1>
      <Text tone="secondary">
        Chrome seulement. Le contrat tickets = BC work.
      </Text>
      <Row gap={8}>
        <TextInput placeholder="Capturer une ligne…" />
        <Button>ok</Button>
      </Row>
      <Row gap={8}>
        {(["toi", "encours", "inbox", "backlog", "done-agent"] as ViewId[]).map(
          (id) => (
            <Button
              key={id}
              variant={view === id ? "primary" : "secondary"}
              onClick={() => setView(id)}
            >
              {id}
            </Button>
          )
        )}
      </Row>
      <Divider />
      <H2>
        Vue {view} · panneau détail
      </H2>
      <Row gap={12}>
        <Stack gap={8} style={{ flex: 1 }}>
          <Text>Liste / arbre (contenu = BC work)</Text>
          <Pill>filtre projet : backlog + done-agent seulement</Pill>
        </Stack>
        <Stack gap={8} style={{ width: 240 }}>
          <Text weight="semibold">Détail</Text>
          <Text tone="secondary" size="small">
            Sélection à droite. Hats : pas de bouton Sprint.
          </Text>
        </Stack>
      </Row>
      <Callout tone="neutral" title="Fallback manuel">
        Capture = éditer raster/inbox.md. Regen = node raster/t.mjs index.
      </Callout>
    </Stack>
  );
}
