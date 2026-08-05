import type { ReactNode } from "react";
import {
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

type ViewId = "brouillon" | "emis" | "perdu" | "version" | "fallback";

const VIEWS: Array<{ id: ViewId; label: string }> = [
  { id: "brouillon", label: "1 · Brouillon" },
  { id: "emis", label: "2 · Émis (lock)" },
  { id: "perdu", label: "3 · Perdu (motif)" },
  { id: "version", label: "4 · Nouvelle version" },
  { id: "fallback", label: "5 · Fallback manuel" },
];

function FrameShell({ children, title, badge }: { children: ReactNode; title: string; badge: string }) {
  const t = useHostTheme();
  return (
    <div
      style={{
        border: `1px solid ${t.stroke.secondary}`,
        background: t.bg.editor,
        borderRadius: 8,
        overflow: "hidden",
        minHeight: 480,
      }}
    >
      <div
        style={{
          padding: "10px 14px",
          borderBottom: `1px solid ${t.stroke.tertiary}`,
          background: t.bg.chrome,
        }}
      >
        <Row gap={8} align="center" justify="space-between">
          <Row gap={8} align="center">
            <Text size="small" weight="semibold">
              Études · Devis — {title}
            </Text>
            <Pill size="sm" active>
              {badge}
            </Pill>
          </Row>
          <Text size="small" tone="tertiary">
            DV-2026-00xx V1
          </Text>
        </Row>
      </div>
      {children}
    </div>
  );
}

function FieldRow({
  label,
  control,
  locked,
}: {
  label: string;
  control: string;
  locked?: boolean;
}) {
  const t = useHostTheme();
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "140px 1fr",
        gap: 8,
        padding: "6px 0",
        borderBottom: `1px solid ${t.stroke.tertiary}`,
        opacity: locked ? 0.7 : 1,
      }}
    >
      <Text size="small" tone="secondary">
        {label}
      </Text>
      <Text size="small" weight={locked ? "normal" : "semibold"}>
        {control}
        {locked ? "  · lecture seule" : ""}
      </Text>
    </div>
  );
}

function ActionBar({ actions, primary }: { actions: string[]; primary?: string }) {
  const t = useHostTheme();
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        padding: "10px 14px",
        borderTop: `1px solid ${t.stroke.tertiary}`,
        background: t.bg.chrome,
      }}
    >
      {actions.map((a) => (
        <Pill key={a} size="sm" active={a === primary}>
          {a}
        </Pill>
      ))}
    </div>
  );
}

function HeaderForm({ locked, ville, contact }: { locked?: boolean; ville: string; contact: string }) {
  return (
    <div style={{ padding: "12px 14px" }}>
      <Text size="small" weight="semibold">
        En-tête
      </Text>
      <Spacer height={6} />
      <FieldRow label="Client" control="ZENIT-MOA — Agence Zenit" locked={locked} />
      <FieldRow label="Contact client" control={`▼ ${contact}`} locked={locked} />
      <FieldRow label="Ville" control={`▼ ${ville}`} locked={locked} />
      <FieldRow label="Objet" control="Zenit — AOO A049…" locked={locked} />
      <FieldRow label="Issu de" control="DE-0001 · DPGF-2026-001" locked />
      <FieldRow label="Conditions paiement" control="▼ Selon marché / CCAG-T" locked={locked} />
    </div>
  );
}

function LinesHint({ locked }: { locked?: boolean }) {
  const t = useHostTheme();
  return (
    <div style={{ padding: "8px 14px 14px" }}>
      <div
        style={{
          border: `1px dashed ${t.stroke.secondary}`,
          borderRadius: 6,
          padding: 12,
          background: t.bg.chrome,
        }}
      >
        <Text size="small" weight="semibold">
          Lignes DPGF {locked ? "(figées)" : "(éditables)"}
        </Text>
        <Text size="small" tone="secondary">
          {locked
            ? "Pas de + Chapitre / delete. Totaux affichés, pas de Save."
            : "Édition autorisée · Save sticky footer."}
        </Text>
      </div>
    </div>
  );
}

function ViewBrouillon() {
  return (
    <FrameShell title="Brouillon éditable" badge="BROUILLON">
      <HeaderForm ville="Rabat (déduit AOC)" contact="M. Alami — principal" />
      <LinesHint />
      <ActionBar
        actions={["Enregistrer", "Émettre", "Annuler", "Imprimer"]}
        primary="Émettre"
      />
    </FrameShell>
  );
}

function ViewEmis() {
  return (
    <FrameShell title="Émis — consultation" badge="ÉMIS">
      <Callout tone="info" title="Document figé">
        Après émission : en-tête + lignes lecture seule. Seules les transitions métier restent.
      </Callout>
      <HeaderForm locked ville="Rabat" contact="M. Alami — principal" />
      <LinesHint locked />
      <ActionBar
        actions={[
          "Marquer en négociation",
          "Approuver",
          "Marquer perdu",
          "Annuler",
          "Nouvelle version",
          "Imprimer",
        ]}
        primary="Approuver"
      />
    </FrameShell>
  );
}

function ViewPerdu() {
  const t = useHostTheme();
  return (
    <FrameShell title="Marquer perdu" badge="MOTIF">
      <div style={{ padding: 14 }}>
        <H3>Confirmer perte</H3>
        <Text size="small" tone="secondary">
          Motif obligatoire (concurrent, budget, délai…).
        </Text>
        <Spacer height={10} />
        <div
          style={{
            border: `1px solid ${t.stroke.secondary}`,
            borderRadius: 6,
            padding: 10,
            minHeight: 72,
            background: t.bg.chrome,
          }}
        >
          <Text size="small" tone="tertiary">
            Motif de perte…
          </Text>
        </div>
        <Spacer height={12} />
        <Row gap={8}>
          <Pill size="sm">Retour</Pill>
          <Pill size="sm" active>
            Confirmer perte → PERDU
          </Pill>
        </Row>
      </div>
    </FrameShell>
  );
}

function ViewVersion() {
  return (
    <FrameShell title="Nouvelle version" badge="V2 BROUILLON">
      <Callout tone="warning" title="Versioning">
        Crée V2 en BROUILLON (éditable). V1 reste EMIS/historique. Lien « Issu de » conservé.
      </Callout>
      <HeaderForm ville="Rabat" contact="M. Alami — principal" />
      <LinesHint />
      <ActionBar actions={["Enregistrer", "Émettre V2", "Historique V1"]} primary="Enregistrer" />
    </FrameShell>
  );
}

function ViewFallback() {
  return (
    <FrameShell title="Fallback manuel" badge="DONNÉES MANQUANTES">
      <Callout tone="warning" title="Déduction incomplète">
        Pas de contact / adresse partenaire. Ville AOC absente. L’utilisateur choisit à la main
        (référentiels) — pas de blocage à l’émission si règles métier le permettent.
      </Callout>
      <HeaderForm ville="▼ (choisir ville)" contact="▼ Aucun contact — saisir / créer" />
      <LinesHint />
      <ActionBar actions={["Ouvrir fiche client", "Enregistrer", "Émettre"]} primary="Enregistrer" />
    </FrameShell>
  );
}

export default function DevisDetailWireframe() {
  const [view, setView] = useCanvasState<ViewId>("view", "brouillon");

  return (
    <Stack gap={16} style={{ padding: 20, maxWidth: 960 }}>
      <Stack gap={4}>
        <H1>Wireframe — Fiche devis</H1>
        <Text tone="secondary" size="small">
          Gate UX avant P0/P1/P2 · décisions figées par plan QA devis
        </Text>
      </Stack>

      <Row gap={8} style={{ flexWrap: "wrap" }}>
        {VIEWS.map((v) => (
          <Pill key={v.id} active={view === v.id} onClick={() => setView(v.id)}>
            {v.label}
          </Pill>
        ))}
      </Row>

      {view === "brouillon" && <ViewBrouillon />}
      {view === "emis" && <ViewEmis />}
      {view === "perdu" && <ViewPerdu />}
      {view === "version" && <ViewVersion />}
      {view === "fallback" && <ViewFallback />}

      <Divider />

      <H2>Décisions UX (figées)</H2>
      <Stack gap={6}>
        <Text size="small">
          1. Modifiable uniquement en BROUILLON (et nouvelle version). EMIS+ = view + transitions.
        </Text>
        <Text size="small">
          2. Ville = select geo-ma ; déduite AOC → adresse partner ; sinon choix manuel.
        </Text>
        <Text size="small">
          3. Contact = select PartnerContact du client ; id stocké + libellé denorm pour print.
        </Text>
        <Text size="small">
          4. CTA primaire : BROUILLON→Émettre ; EMIS→Approuver ; PERDU→motif obligatoire.
        </Text>
        <Text size="small">
          5. Bandeau « Issu de DE-… / DPGF-… » toujours visible (readonly).
        </Text>
        <Text size="small">
          6. Delete / Duplicate / Save absents hors BROUILLON. Nouvelle version = seul retour édition.
        </Text>
      </Stack>

      <Text size="small" tone="tertiary">
        Sync Git : products/sektor-btp/docs/ux/wireframes/devis-detail-wireframe.canvas.tsx
      </Text>
    </Stack>
  );
}
