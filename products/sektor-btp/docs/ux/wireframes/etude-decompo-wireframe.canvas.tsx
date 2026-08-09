import type { ReactNode } from "react";
import {
  Button,
  Callout,
  Divider,
  H1,
  H2,
  H3,
  Pill,
  Row,
  Spacer,
  Stack,
  Text,
  useCanvasState,
  useHostTheme,
} from "cursor/canvas";

type ViewId = "tree" | "modal";
type ChiffrageMode = "decompo" | "fourni";

const TREE_ROWS: Array<{
  id: string;
  indent: number;
  kind: "lot" | "sous" | "art";
  code: string;
  label: string;
  status?: "ok" | "warn" | "empty";
  selected?: boolean;
}> = [
  { id: "l1", indent: 0, kind: "lot", code: "01", label: "Gros œuvre" },
  { id: "s1", indent: 1, kind: "sous", code: "01.01", label: "Béton armé" },
  {
    id: "a1",
    indent: 2,
    kind: "art",
    code: "01.01.10",
    label: "Béton B25 semelles",
    status: "ok",
  },
  {
    id: "a2",
    indent: 2,
    kind: "art",
    code: "01.01.20",
    label: "Ferraillage HA FeE500",
    status: "warn",
    selected: true,
  },
  {
    id: "a3",
    indent: 2,
    kind: "art",
    code: "01.01.30",
    label: "Coffrage semelles",
    status: "empty",
  },
  { id: "s2", indent: 1, kind: "sous", code: "01.02", label: "Maçonnerie" },
  {
    id: "a4",
    indent: 2,
    kind: "art",
    code: "01.02.10",
    label: "Mur parpaing 20 cm",
    status: "empty",
  },
];

const COMPO_HEADERS = ["Type", "Désignation", "Source", "Qté", "PU", "Total"];
const COMPO_ROWS = [
  ["MAT", "Acier HA FeE500", "Consulté", "1,05", "9,80", "10,29"],
  ["MO", "Ferrailleur", "Estimé", "0,12", "180", "21,60"],
  ["MAT", "Ligatures", "IA ✎", "0,04", "12,00", "0,48"],
];
const TOTALS = [
  ["Coût revient", "32,37"],
  ["FG %", "10"],
  ["Marge %", "17,5"],
  ["PU vente HT", "41,85"],
];

function FrameShell({ children, title }: { children: ReactNode; title: string }) {
  const t = useHostTheme();
  return (
    <div
      style={{
        border: `1px solid ${t.stroke.secondary}`,
        background: t.bg.editor,
        borderRadius: 8,
        overflow: "hidden",
        position: "relative",
        minHeight: 520,
      }}
    >
      <div
        style={{
          padding: "10px 14px",
          borderBottom: `1px solid ${t.stroke.tertiary}`,
          background: t.bg.chrome,
        }}
      >
        <Row gap={8} align="center">
          <Text size="small" weight="semibold">
            Étude · Étape 3 — Chiffrage
          </Text>
          <Text size="small" tone="tertiary">
            {title}
          </Text>
        </Row>
      </div>
      {children}
    </div>
  );
}

function CouvertureBar() {
  const t = useHostTheme();
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        borderBottom: `1px solid ${t.stroke.tertiary}`,
        background: t.fill.tertiary,
        flexWrap: "wrap",
      }}
    >
      <Row gap={8} align="center">
        <Text size="small" weight="semibold">
          12 / 28
        </Text>
        <Text size="small" tone="secondary">
          composants consultés
        </Text>
        <Pill tone="warning" size="sm">
          16 à vérifier
        </Pill>
      </Row>
      <Text size="small" tone="tertiary">
        ☐ Afficher les alertes
      </Text>
    </div>
  );
}

function StatusDot({ status }: { status: "ok" | "warn" | "empty" }) {
  const label =
    status === "ok" ? "Décomposé" : status === "warn" ? "Incomplet" : "À faire";
  const tone =
    status === "ok" ? "success" : status === "warn" ? "warning" : "neutral";
  return (
    <Pill tone={tone} size="sm">
      {label}
    </Pill>
  );
}

function TreePane({ dimmed }: { dimmed?: boolean }) {
  const t = useHostTheme();
  return (
    <div
      style={{
        opacity: dimmed ? 0.35 : 1,
        pointerEvents: dimmed ? "none" : "auto",
      }}
    >
      <CouvertureBar />
      <div style={{ padding: "10px 14px" }}>
        <div
          style={{
            border: `1px solid ${t.stroke.tertiary}`,
            borderRadius: 6,
            padding: "8px 10px",
            marginBottom: 10,
            color: t.text.tertiary,
            fontSize: 12,
          }}
        >
          Rechercher un poste…
        </div>
        <Stack gap={2}>
          {TREE_ROWS.map((row) => {
            const isArt = row.kind === "art";
            return (
              <div
                key={row.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "88px 1fr auto",
                  gap: 8,
                  alignItems: "center",
                  padding: "7px 10px",
                  paddingLeft: 10 + row.indent * 16,
                  borderRadius: 6,
                  background: row.selected ? t.fill.secondary : "transparent",
                  border: row.selected
                    ? `1px solid ${t.accent.primary}`
                    : "1px solid transparent",
                }}
              >
                <Text
                  size="small"
                  tone={isArt ? "secondary" : "tertiary"}
                  weight={row.kind === "lot" ? "semibold" : "normal"}
                >
                  {row.code}
                </Text>
                <Text
                  size="small"
                  weight={row.kind === "lot" ? "semibold" : "normal"}
                >
                  {row.label}
                </Text>
                {isArt ? <StatusDot status={row.status ?? "empty"} /> : <span />}
              </div>
            );
          })}
        </Stack>
      </div>
    </div>
  );
}

function ModeToggle({
  mode,
  onChange,
}: {
  mode: ChiffrageMode;
  onChange: (mode: ChiffrageMode) => void;
}) {
  const t = useHostTheme();
  return (
    <div
      style={{
        display: "inline-flex",
        border: `1px solid ${t.stroke.secondary}`,
        borderRadius: 8,
        overflow: "hidden",
        background: t.fill.tertiary,
      }}
    >
      {(
        [
          ["decompo", "Décomposé"],
          ["fourni", "Prix fourni"],
        ] as const
      ).map(([id, label]) => {
        const active = mode === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            style={{
              border: "none",
              padding: "6px 12px",
              cursor: "pointer",
              background: active ? t.accent.primary : "transparent",
              color: active ? t.text.onAccent : t.text.secondary,
              fontSize: 12,
              fontWeight: active ? 600 : 400,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function ModalChrome({
  children,
  onClose,
  dirty,
  mode,
  onModeChange,
}: {
  children: ReactNode;
  onClose: () => void;
  dirty?: boolean;
  mode: ChiffrageMode;
  onModeChange: (mode: ChiffrageMode) => void;
}) {
  const t = useHostTheme();
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "stretch",
        justifyContent: "flex-end",
        background: "color-mix(in srgb, black 28%, transparent)",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "min(720px, 100%)",
          background: t.bg.elevated,
          border: `1px solid ${t.stroke.primary}`,
          borderRadius: 10,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "12px 16px",
            borderBottom: `1px solid ${t.stroke.tertiary}`,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <Stack gap={4} style={{ minWidth: 0 }}>
              <Row gap={8} align="center">
                <Text size="small" tone="tertiary">
                  01.01.20
                </Text>
                {dirty ? (
                  <Pill size="sm" tone="warning">
                    Non enregistré
                  </Pill>
                ) : (
                  <Pill size="sm" tone="success">
                    Enregistré
                  </Pill>
                )}
              </Row>
              <Text weight="semibold">Ferraillage HA FeE500</Text>
              <Text size="small" tone="secondary">
                kg · Qté 1 240
              </Text>
            </Stack>
            <Button variant="ghost" onClick={onClose}>
              ✕
            </Button>
          </div>
          <Row gap={8} align="center" justify="space-between">
            <ModeToggle mode={mode} onChange={onModeChange} />
            <Text size="small" tone="tertiary">
              Défaut = Décomposé · switch instantané
            </Text>
          </Row>
        </div>
        <div style={{ padding: 16, overflow: "auto", flex: 1 }}>{children}</div>
        <div
          style={{
            padding: "12px 16px",
            borderTop: `1px solid ${t.stroke.tertiary}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            background: t.bg.chrome,
          }}
        >
          <Text size="small" tone="tertiary">
            {dirty ? "Modifications non enregistrées" : "Tout est à jour"}
          </Text>
          <Button variant="primary" disabled={!dirty} onClick={onClose}>
            Enregistrer et fermer
          </Button>
        </div>
      </div>
    </div>
  );
}

function FieldBox({ label, value, hint }: { label: string; value: string; hint?: string }) {
  const t = useHostTheme();
  return (
    <div
      style={{
        border: `1px solid ${t.stroke.secondary}`,
        borderRadius: 8,
        padding: "10px 12px",
        background: t.bg.editor,
      }}
    >
      <Text size="small" tone="tertiary">
        {label}
      </Text>
      <Spacer size={4} />
      <Text weight="semibold">{value}</Text>
      {hint ? (
        <>
          <Spacer size={4} />
          <Text size="small" tone="tertiary">
            {hint}
          </Text>
        </>
      ) : null}
    </div>
  );
}

function ModalFourniBody() {
  const t = useHostTheme();
  return (
    <Stack gap={16}>
      <Stack gap={4}>
        <H3>Prix fourni</H3>
        <Text size="small" tone="secondary">
          PU de vente fixé. FG et marge variables (S3) — recalcul visible.
        </Text>
      </Stack>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr 0.8fr",
          gap: 10,
        }}
      >
        <FieldBox label="Prix unitaire vente HT" value="42,00 MAD" hint="saisie libre" />
        <FieldBox label="FG %" value="10,0" hint="éditable" />
        <FieldBox label="Marge %" value="17,5" hint="éditable" />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 10,
          padding: 12,
          border: `1px solid ${t.stroke.tertiary}`,
          borderRadius: 8,
          background: t.fill.tertiary,
        }}
      >
        <div>
          <Stack gap={2}>
            <Text size="small" tone="tertiary">
              Coût de revient (dérivé)
            </Text>
            <Text weight="semibold">32,47 MAD</Text>
          </Stack>
        </div>
        <div>
          <Stack gap={2}>
            <Text size="small" tone="tertiary">
              Marge unitaire
            </Text>
            <Text weight="semibold">5,67 MAD</Text>
          </Stack>
        </div>
        <div>
          <Stack gap={2}>
            <Text size="small" tone="tertiary">
              Total poste HT
            </Text>
            <Text weight="semibold">52 080 MAD</Text>
          </Stack>
        </div>
      </div>

      <Callout tone="neutral" title="Brouillon décomposition">
        3 composants en brouillon — bascule le toggle sur Décomposé pour les
        réactiver sans perdre la saisie.
      </Callout>

      <Divider />

      <Stack gap={8}>
        <Row gap={8} align="center" justify="space-between">
          <H3>Descriptif technique</H3>
          <Button variant="secondary">Voir CPS (IA)</Button>
        </Row>
        <div
          style={{
            border: `1px solid ${t.stroke.tertiary}`,
            borderRadius: 6,
            padding: 10,
            minHeight: 56,
            color: t.text.secondary,
            fontSize: 12,
          }}
        >
          Fourniture et mise en œuvre d’aciers HA FeE500 selon CCTP art. 4.2…
        </div>
      </Stack>

      <CommentThreadPreview />
    </Stack>
  );
}

function ModalDecompoBody() {
  const t = useHostTheme();
  return (
    <Stack gap={16}>
      <Row gap={8} align="center" justify="space-between">
        <H3>Décomposition</H3>
        <Row gap={8}>
          <Button variant="secondary">Extraire composants (IA)</Button>
          <Button variant="primary">+ Composant</Button>
        </Row>
      </Row>

      <div
        style={{
          border: `1px solid ${t.stroke.tertiary}`,
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "64px 1.4fr 88px 64px 72px 80px",
            gap: 8,
            padding: "8px 12px",
            background: t.fill.tertiary,
            borderBottom: `1px solid ${t.stroke.tertiary}`,
          }}
        >
          {COMPO_HEADERS.map((h) => (
            <span key={h}>
              <Text size="small" tone="tertiary" weight="semibold">
                {h}
              </Text>
            </span>
          ))}
        </div>
        {COMPO_ROWS.map((cells, i) => (
          <div
            key={cells[1]}
            style={{
              display: "grid",
              gridTemplateColumns: "64px 1.4fr 88px 64px 72px 80px",
              gap: 8,
              padding: "9px 12px",
              borderBottom:
                i < COMPO_ROWS.length - 1
                  ? `1px solid ${t.stroke.tertiary}`
                  : undefined,
            }}
          >
            {cells.map((c, j) => (
              <span key={`${cells[1]}-${j}`}>
                <Text size="small" tone={j === 0 ? "secondary" : "primary"}>
                  {c}
                </Text>
              </span>
            ))}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
          padding: 12,
          border: `1px solid ${t.stroke.tertiary}`,
          borderRadius: 8,
          background: t.fill.tertiary,
        }}
      >
        {TOTALS.map(([k, v]) => (
          <div key={k}>
            <Stack gap={2}>
              <Text size="small" tone="tertiary">
                {k}
              </Text>
              <Text weight="semibold">{v}</Text>
            </Stack>
          </div>
        ))}
      </div>

      <Divider />

      <Stack gap={8}>
        <Row gap={8} align="center" justify="space-between">
          <H3>Descriptif technique</H3>
          <Button variant="secondary">Voir CPS (IA)</Button>
        </Row>
        <div
          style={{
            border: `1px solid ${t.stroke.tertiary}`,
            borderRadius: 6,
            padding: 10,
            minHeight: 56,
            color: t.text.secondary,
            fontSize: 12,
          }}
        >
          Fourniture et mise en œuvre d’aciers HA FeE500 selon CCTP art. 4.2…
        </div>
      </Stack>

      <CommentThreadPreview />
    </Stack>
  );
}

function CommentThreadPreview({ empty }: { empty?: boolean }) {
  const t = useHostTheme();
  return (
    <Stack gap={8}>
      <H3>Commentaires équipe</H3>
      {empty ? (
        <Text size="small" tone="tertiary">
          Aucun commentaire — premier message ci-dessous.
        </Text>
      ) : (
        <Stack gap={8}>
          <div
            style={{
              border: `1px solid ${t.stroke.tertiary}`,
              borderRadius: 8,
              padding: 10,
            }}
          >
            <Row gap={8} align="center">
              <Text size="small" weight="semibold">
                Sara B.
              </Text>
              <Text size="small" tone="tertiary">
                hier 16:42
              </Text>
            </Row>
            <Spacer size={4} />
            <Text size="small">
              Vérifier le prix acier avec la dernière consultation SNTP.
            </Text>
          </div>
          <div
            style={{
              border: `1px solid ${t.stroke.tertiary}`,
              borderRadius: 8,
              padding: 10,
            }}
          >
            <Row gap={8} align="center">
              <Text size="small" weight="semibold">
                Youssef K.
              </Text>
              <Text size="small" tone="tertiary">
                aujourd’hui 09:11
              </Text>
            </Row>
            <Spacer size={4} />
            <Text size="small">OK — j’ai passé la ligne en Consulté.</Text>
          </div>
        </Stack>
      )}
      <div
        style={{
          border: `1px solid ${t.stroke.secondary}`,
          borderRadius: 6,
          padding: "8px 10px",
          color: t.text.tertiary,
          fontSize: 12,
        }}
      >
        Écrire un commentaire… [Envoyer]
      </div>
    </Stack>
  );
}

function GridNotes() {
  return (
    <Stack gap={12}>
      <H2>Décisions UX figées dans ce wireframe</H2>
      <Stack gap={8}>
        <Text>
          <Text as="span" weight="semibold">
            Tree = surface principale.{" "}
          </Text>
          Couverture + recherche + statuts articles. Pas de panel collé à droite.
        </Text>
        <Text>
          <Text as="span" weight="semibold">
            Ouverture chiffrage = double-clic ARTICLE.{" "}
          </Text>
          Simple clic = navigation / expand seule — évite les ouvertures
          accidentelles.
        </Text>
        <Text>
          <Text as="span" weight="semibold">
            Pas d’écran « choix mode ».{" "}
          </Text>
          Défaut = Décomposé. Toggle header Décomposé | Prix fourni.
        </Text>
        <Text>
          <Text as="span" weight="semibold">
            Modal = drawer large (~720px){" "}
          </Text>
          ancré à droite. Header = identité + toggle + ✕ abandon ; footer sticky
          = un seul CTA « Enregistrer et fermer ». Tree / PU rafraîchis seulement
          après fermeture réussie (pas pendant la saisie).
        </Text>
        <Text>
          <Text as="span" weight="semibold">
            Prix fourni ={" "}
          </Text>
          PU + FG% + marge% éditables, totaux dérivés. Brouillon décompo
          conservé.
        </Text>
        <Text>
          <Text as="span" weight="semibold">
            Descriptif ≠ commentaires.{" "}
          </Text>
          Bloc technique CPS séparé du fil équipe (S2).
        </Text>
        <Text>
          <Text as="span" weight="semibold">
            AI-first / manuel.{" "}
          </Text>
          Extraire / Voir CPS optionnels ; + Composant toujours là.
        </Text>
        <Text>
          <Text as="span" weight="semibold">
            Copie isolée.{" "}
          </Text>
          Le drawer travaille sur une copie du poste. Tree intacte pendant la
          saisie / à l’abandon. « Enregistrer et fermer » commit la copie →
          patch PU/total sur la tree.
        </Text>
        <Text>
          <Text as="span" weight="semibold">
            Dirty local.{" "}
          </Text>
          Changer d’article = fermer (confirm si dirty) puis ouvrir l’autre.
          Switch mode = instantané ; confirm seulement si dirty.
        </Text>
      </Stack>
    </Stack>
  );
}

export default function EtudeDecompoWireframe() {
  const [view, setView] = useCanvasState<ViewId>("etude-wf-view-v2", "tree");
  const [mode, setMode] = useCanvasState<ChiffrageMode>(
    "etude-wf-mode-v2",
    "decompo",
  );

  return (
    <Stack gap={20} style={{ padding: 24, maxWidth: 980 }}>
      <Stack gap={6}>
        <H1>Wireframe — Chiffrage étude</H1>
        <Text tone="secondary">
          Tree plein écran → double-clic article → modal (défaut Décomposé, toggle
          mode). Remplace le master-slave actuel. Simple clic = navigation seule.
        </Text>
      </Stack>

      <Row gap={8} align="center" wrap>
        <Button
          variant={view === "tree" ? "primary" : "secondary"}
          onClick={() => setView("tree")}
        >
          1 · Tree
        </Button>
        <Button
          variant={view === "modal" ? "primary" : "secondary"}
          onClick={() => {
            setMode("decompo");
            setView("modal");
          }}
        >
          2 · Modal (défaut décomposé)
        </Button>
      </Row>

      <Callout tone="info" title="Cycle de vie modal">
        Open → mode Décomposé par défaut → toggle header pour Prix fourni →
        Enregistrer et fermer (footer) → destroy + refresh tree. ✕ = abandon
        (confirm si dirty). Plus d’étape « choix mode ».
      </Callout>

      <FrameShell
        title={
          view === "tree"
            ? "arbre seul — double-clic article ouvre la modal"
            : `arbre en fond · modal · mode ${mode === "decompo" ? "Décomposé" : "Prix fourni"}`
        }
      >
        <TreePane dimmed={view !== "tree"} />
        {view === "modal" ? (
          <ModalChrome
            onClose={() => setView("tree")}
            dirty={mode === "fourni"}
            mode={mode}
            onModeChange={setMode}
          >
            {mode === "fourni" ? <ModalFourniBody /> : <ModalDecompoBody />}
          </ModalChrome>
        ) : null}
      </FrameShell>

      <Divider />
      <GridNotes />
    </Stack>
  );
}
