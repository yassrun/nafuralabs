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

/**
 * ERP-10 — Création étude / AO : CPS tôt → propositions → fallback manuel.
 * Sync Git : products/sektor-btp/docs/ux/wireframes/etude-create-cps-first-wireframe.canvas.tsx
 */

type ViewId =
  | "idle"
  | "extracting"
  | "review"
  | "partial"
  | "ready"
  | "decisions";

const VIEWS: Array<{ id: ViewId; label: string }> = [
  { id: "idle", label: "1 · Idle + dropzone" },
  { id: "extracting", label: "2 · Extraction" },
  { id: "review", label: "3 · Review champs" },
  { id: "partial", label: "4 · Échec partiel" },
  { id: "ready", label: "5 · Prêt à créer" },
  { id: "decisions", label: "6 · Décisions UX" },
];

function Frame({
  title,
  children,
  wizard,
}: {
  title: string;
  children: ReactNode;
  wizard?: string;
}) {
  const t = useHostTheme();
  return (
    <div
      style={{
        border: `1px solid ${t.stroke.secondary}`,
        borderRadius: 8,
        overflow: "hidden",
        background: t.bg.editor,
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
        <Row gap={8} align="center" justify="space-between">
          <Text size="small" weight="semibold">
            {title}
          </Text>
          {wizard ? (
            <Text size="small" tone="tertiary">
              {wizard}
            </Text>
          ) : null}
        </Row>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  required,
  state,
  hint,
  ia,
  confiance,
}: {
  label: string;
  value: string;
  required?: boolean;
  state?: "empty" | "manual" | "proposed" | "accepted" | "rejected";
  hint?: string;
  /** Champ issu d’une proposition CPS / IA */
  ia?: boolean;
  confiance?: number;
}) {
  const t = useHostTheme();
  const fromIa = ia || state === "proposed" || state === "accepted" || state === "rejected";
  const proposed = state === "proposed" || state === "accepted";
  const border =
    state === "proposed"
      ? t.accent.primary
      : state === "accepted"
        ? t.stroke.secondary
        : t.stroke.tertiary;
  return (
    <div
      style={{
        border: `1px solid ${border}`,
        borderRadius: 8,
        padding: "8px 10px",
        background: proposed ? t.fill.tertiary : t.bg.elevated,
        opacity: state === "rejected" ? 0.55 : 1,
      }}
    >
      <Row gap={6} align="center" justify="space-between">
        <Row gap={6} align="center">
          <Text size="small" tone="tertiary">
            {label}
            {required ? " *" : ""}
          </Text>
          {fromIa && state !== "manual" && state !== "empty" ? (
            <Pill size="sm" tone="info">
              {confiance != null ? `IA · ${Math.round(confiance * 100)}%` : "IA"}
            </Pill>
          ) : null}
          {state === "proposed" ? (
            <Pill size="sm" tone="warning">
              à trancher
            </Pill>
          ) : null}
          {state === "accepted" ? (
            <Pill size="sm" tone="success">
              accepté
            </Pill>
          ) : null}
          {state === "manual" ? (
            <Pill size="sm">manuel</Pill>
          ) : null}
          {state === "rejected" ? (
            <Pill size="sm" tone="neutral">
              ignoré
            </Pill>
          ) : null}
        </Row>
        {state === "proposed" ? (
          <Row gap={4}>
            <Button variant="primary">Accepter</Button>
            <Button>Ignorer</Button>
          </Row>
        ) : null}
      </Row>
      <Spacer size={4} />
      <Text size="small" weight="semibold">
        {value || "—"}
      </Text>
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

function Dropzone({
  mode,
}: {
  mode: "empty" | "file" | "busy" | "done" | "error";
}) {
  const t = useHostTheme();
  const label =
    mode === "empty"
      ? "Glisser le CPS (PDF) — optionnel"
      : mode === "busy"
        ? "Indexation CPS…"
        : mode === "error"
          ? "Extraction partielle / échec — continuer en manuel"
          : mode === "done"
            ? "CPS joint · propositions prêtes"
            : "CPS_marche.pdf";
  return (
    <div
      style={{
        border: `1px dashed ${
          mode === "error"
            ? t.stroke.primary
            : mode === "done" || mode === "busy"
              ? t.accent.primary
              : t.stroke.secondary
        }`,
        borderRadius: 8,
        padding: 14,
        background: t.fill.tertiary,
      }}
    >
      <Row gap={8} align="center" justify="space-between">
        <Stack gap={4}>
          <Text weight="semibold" size="small">
            Importer le CPS pour préremplir
          </Text>
          <Text size="small" tone="secondary">
            {label}
          </Text>
        </Stack>
        {mode === "empty" ? <Button>Parcourir</Button> : null}
        {mode === "busy" ? (
          <Pill size="sm" tone="info">
            en cours
          </Pill>
        ) : null}
        {mode === "done" ? (
          <Pill size="sm" tone="success">
            extrait
          </Pill>
        ) : null}
        {mode === "error" ? (
          <Pill size="sm" tone="warning">
            fallback
          </Pill>
        ) : null}
      </Row>
    </div>
  );
}

function FormShell({
  dropzone,
  children,
  canCreate,
}: {
  dropzone: ReactNode;
  children: ReactNode;
  canCreate: boolean;
}) {
  return (
    <Stack gap={14}>
      <Stack gap={4}>
        <Text weight="semibold">Nouvelle étude / appel d’offres</Text>
        <Text size="small" tone="secondary">
          AI-first : CPS optionnel en haut → propositions → correction manuelle.
          Gate = champs métier, pas succès IA.
        </Text>
      </Stack>
      {dropzone}
      {children}
      <Row gap={8} justify="end">
        <Button>Annuler</Button>
        <Button variant="primary" disabled={!canCreate}>
          Créer le dossier
        </Button>
      </Row>
    </Stack>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Stack gap={8}>
      <Text size="small" weight="semibold" tone="tertiary">
        {title}
      </Text>
      {children}
    </Stack>
  );
}

function ViewIdle() {
  return (
    <Frame title="/etudes/dossiers/new" wizard="sans CPS">
      <FormShell dropzone={<Dropzone mode="empty" />} canCreate={false}>
        <Section title="MARCHÉ">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            <Field label="Objet" value="" required state="empty" />
            <Field
              label="MOA (texte)"
              value=""
              required
              state="empty"
              hint="Pas de Partner ici — nom libre (CPS ou manuel)"
            />
            <Field
              label="Chargé d’étude"
              value="Cursor QA (auto si ingénieur)"
              required
              state="manual"
              hint="Hors CPS — rôle BTP_INGENIEUR"
            />
            <Field label="Date limite dépôt" value="" required state="empty" />
          </div>
        </Section>
        <Section title="APPEL D’OFFRES">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            <Field label="Référence" value="" state="empty" />
            <Field label="Type" value="Public" state="manual" />
            <Field label="Ville" value="" state="empty" />
            <Field label="Ouverture des plis" value="" state="empty" />
            <Field label="Délai exécution (j)" value="" state="empty" />
            <Field label="Estimation MOA HT" value="" state="empty" />
            <Field label="Caution provisoire" value="" state="empty" />
            <Field label="Caution définitive" value="" state="empty" />
          </div>
        </Section>
      </FormShell>
    </Frame>
  );
}

function ViewExtracting() {
  return (
    <Frame title="/etudes/dossiers/new" wizard="CPS en cours">
      <FormShell dropzone={<Dropzone mode="busy" />} canCreate={false}>
        <Callout tone="info" title="Indexation">
          Lecture sections CPS · proposition métadonnées marché / AO. Le
          formulaire reste éditable ; CTA désactivé tant que les * ne sont pas
          remplis.
        </Callout>
        <Section title="MARCHÉ">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            <Field label="Objet" value="…" required state="empty" />
            <Field label="MOA (texte)" value="" required state="empty" />
            <Field
              label="Chargé d’étude"
              value="Cursor QA"
              required
              state="manual"
            />
            <Field label="Date limite dépôt" value="" required state="empty" />
          </div>
        </Section>
      </FormShell>
    </Frame>
  );
}

function ViewReview() {
  return (
    <Frame title="/etudes/dossiers/new" wizard="propositions CPS">
      <FormShell dropzone={<Dropzone mode="done" />} canCreate={false}>
        <Callout tone="neutral" title="Review avant application">
          Chaque champ IA a Accepter / Ignorer + badge IA (confiance). Aucun
          écrasement silencieux. MOA = texte libre — pas de création Partner.
        </Callout>
        <Row gap={8} justify="end">
          <Button>Tout accepter</Button>
          <Button>Tout ignorer</Button>
        </Row>
        <Section title="MARCHÉ">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            <Field
              label="Objet"
              value="Construction d’un ensemble résidentiel – lot gros œuvre"
              required
              state="proposed"
              ia
              confiance={0.91}
            />
            <Field
              label="MOA (texte)"
              value="Commune de Casablanca"
              required
              state="proposed"
              ia
              confiance={0.78}
              hint="Texte CPS · Partner créé seulement si marché conclu"
            />
            <Field
              label="Chargé d’étude"
              value="Cursor QA"
              required
              state="manual"
            />
            <Field
              label="Date limite dépôt"
              value="2026-09-15"
              required
              state="proposed"
              ia
              confiance={0.84}
            />
          </div>
        </Section>
        <Section title="APPEL D’OFFRES">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            <Field
              label="Référence"
              value="AO-2026-014"
              state="proposed"
              ia
              confiance={0.88}
            />
            <Field
              label="Type"
              value="Public"
              state="proposed"
              ia
              confiance={0.72}
            />
            <Field
              label="Ville"
              value="Casablanca"
              state="proposed"
              ia
              confiance={0.93}
            />
            <Field
              label="Ouverture des plis"
              value="2026-09-22"
              state="proposed"
              ia
              confiance={0.81}
            />
            <Field
              label="Délai exécution (j)"
              value="540"
              state="proposed"
              ia
              confiance={0.76}
            />
            <Field
              label="Estimation MOA HT"
              value="12 450 000 MAD"
              state="proposed"
              ia
              confiance={0.69}
            />
            <Field
              label="Caution provisoire"
              value="1 %"
              state="proposed"
              ia
              confiance={0.74}
            />
            <Field
              label="Caution définitive"
              value="3 %"
              state="proposed"
              ia
              confiance={0.71}
            />
          </div>
        </Section>
      </FormShell>
    </Frame>
  );
}

function ViewPartial() {
  return (
    <Frame title="/etudes/dossiers/new" wizard="IA partielle">
      <FormShell dropzone={<Dropzone mode="error" />} canCreate={false}>
        <Callout tone="warning" title="Fallback manuel">
          Extraction partielle (ex. objet + ville seulement). Continuer : saisir
          le reste à la main. Création jamais bloquée par l’échec IA.
        </Callout>
        <Section title="MARCHÉ">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            <Field
              label="Objet"
              value="Construction d’un ensemble résidentiel – lot gros œuvre"
              required
              state="accepted"
              ia
              confiance={0.91}
            />
            <Field
              label="MOA (texte)"
              value=""
              required
              state="empty"
              hint="À saisir manuellement si IA n’a rien proposé"
            />
            <Field
              label="Chargé d’étude"
              value="Cursor QA"
              required
              state="manual"
            />
            <Field label="Date limite dépôt" value="" required state="empty" />
          </div>
        </Section>
        <Section title="APPEL D’OFFRES (partiel)">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            <Field label="Référence" value="" state="rejected" ia />
            <Field label="Type" value="Public" state="manual" />
            <Field
              label="Ville"
              value="Casablanca"
              state="accepted"
              ia
              confiance={0.93}
            />
            <Field label="Ouverture des plis" value="" state="empty" />
            <Field label="Délai exécution (j)" value="" state="empty" />
            <Field label="Estimation MOA HT" value="" state="empty" />
            <Field label="Caution provisoire" value="" state="empty" />
            <Field label="Caution définitive" value="" state="empty" />
          </div>
        </Section>
      </FormShell>
    </Frame>
  );
}

function ViewReady() {
  return (
    <Frame title="/etudes/dossiers/new" wizard="gates OK">
      <FormShell dropzone={<Dropzone mode="done" />} canCreate={true}>
        <Callout tone="success" title="Prêt">
          Gates : Objet · MOA (texte) · Chargé d’étude · Date limite. Pas de
          Partner requis. Après création → Pièces (BDP). Client Partner = plus
          tard, à la conclusion du marché.
        </Callout>
        <Section title="MARCHÉ">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            <Field
              label="Objet"
              value="Construction d’un ensemble résidentiel – lot gros œuvre"
              required
              state="accepted"
              ia
              confiance={0.91}
            />
            <Field
              label="MOA (texte)"
              value="Commune de Casablanca"
              required
              state="accepted"
              ia
              confiance={0.78}
              hint="clientId = null · lien Partner à la conclusion"
            />
            <Field
              label="Chargé d’étude"
              value="Cursor QA"
              required
              state="manual"
            />
            <Field
              label="Date limite dépôt"
              value="2026-09-15"
              required
              state="accepted"
              ia
              confiance={0.84}
            />
          </div>
        </Section>
        <Section title="APPEL D’OFFRES">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            <Field
              label="Référence"
              value="AO-2026-014"
              state="accepted"
              ia
              confiance={0.88}
            />
            <Field
              label="Type"
              value="Public"
              state="accepted"
              ia
              confiance={0.72}
            />
            <Field
              label="Ville"
              value="Casablanca"
              state="accepted"
              ia
              confiance={0.93}
            />
            <Field
              label="Ouverture des plis"
              value="2026-09-22"
              state="accepted"
              ia
              confiance={0.81}
            />
            <Field
              label="Délai exécution (j)"
              value="540"
              state="accepted"
              ia
              confiance={0.76}
            />
            <Field
              label="Estimation MOA HT"
              value="12 450 000 MAD"
              state="accepted"
              ia
              confiance={0.69}
            />
            <Field
              label="Caution provisoire"
              value="1 %"
              state="accepted"
              ia
              confiance={0.74}
            />
            <Field
              label="Caution définitive"
              value="3 %"
              state="accepted"
              ia
              confiance={0.71}
            />
          </div>
        </Section>
      </FormShell>
    </Frame>
  );
}

function ViewDecisions() {
  const t = useHostTheme();
  const rows: Array<{ d: string; choice: string; why: string }> = [
    {
      d: "Ordre",
      choice: "CPS optionnel en haut du create",
      why: "AI-first sans bloquer ; manuel toujours possible",
    },
    {
      d: "Champs IA",
      choice: "Chaque champ : badge IA + Accepter / Ignorer",
      why: "Pas d’écrasement silencieux ; confiance visible",
    },
    {
      d: "MOA / Client",
      choice: "Texte libre prérempli (pas Partner)",
      why: "Créer le client Partner seulement si marché conclu",
    },
    {
      d: "Chargé d’étude",
      choice: "Hors CPS",
      why: "Rôle BTP_INGENIEUR (ERP-09)",
    },
    {
      d: "Gate créer",
      choice: "Objet · MOA texte · Chargé · Date limite",
      why: "clientId optionnel à ce stade",
    },
    {
      d: "CPS après create",
      choice: "Rattacher le fichier déjà uploadé",
      why: "Évite re-dépôt ; BDP à l’étape Pièces",
    },
  ];
  return (
    <Frame title="Décisions UX — ERP-10">
      <Stack gap={12}>
        <Callout tone="success" title="Décision Client / MOA (proposée)">
          À l’étude : champ texte « MOA » (CPS ou manuel). Pas de select Partner
          obligatoire. Quand le marché est conclu → flux dédié créer / lier le
          client Partner (prérempli depuis le texte MOA).
        </Callout>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}
        >
          <div
            style={{
              border: `1px solid ${t.stroke.tertiary}`,
              borderRadius: 8,
              padding: 12,
              opacity: 0.65,
            }}
          >
            <Text size="small" tone="tertiary" weight="semibold">
              Alternative écartée
            </Text>
            <Spacer size={6} />
            <Text size="small" weight="semibold">
              Partner dès create
            </Text>
            <Spacer size={4} />
            <Text size="small" tone="secondary">
              Match / créer client avant même de savoir si on gagne — pollue le
              référentiel, freine le démarrage.
            </Text>
          </div>
          <div
            style={{
              border: `1px solid ${t.accent.primary}`,
              borderRadius: 8,
              padding: 12,
              background: t.fill.tertiary,
            }}
          >
            <Text size="small" tone="tertiary" weight="semibold">
              Choix retenu
            </Text>
            <Spacer size={6} />
            <Text size="small" weight="semibold">
              Texte MOA → Partner à conclusion
            </Text>
            <Spacer size={4} />
            <Text size="small" tone="secondary">
              clientNom obligatoire · clientId nullable jusqu’au marché gagné /
              devis contractuel / chantier.
            </Text>
          </div>
        </div>
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
              gridTemplateColumns: "120px 1.2fr 1.4fr",
              gap: 8,
              padding: "8px 12px",
              background: t.fill.tertiary,
            }}
          >
            {["Décision", "Choix", "Pourquoi"].map((h) => (
              <span key={h}>
                <Text size="small" tone="tertiary" weight="semibold">
                  {h}
                </Text>
              </span>
            ))}
          </div>
          {rows.map((r) => (
            <div
              key={r.d}
              style={{
                display: "grid",
                gridTemplateColumns: "120px 1.2fr 1.4fr",
                gap: 8,
                padding: "9px 12px",
                borderTop: `1px solid ${t.stroke.tertiary}`,
              }}
            >
              <Text size="small" weight="semibold">
                {r.d}
              </Text>
              <Text size="small">{r.choice}</Text>
              <Text size="small" tone="secondary">
                {r.why}
              </Text>
            </div>
          ))}
        </div>
        <Divider />
        <H3>Impact technique (si validé)</H3>
        <Text size="small" tone="secondary">
          Aujourd’hui create exige clientId Partner (@NotBlank). À assouplir :
          clientNom requis, clientId optionnel ; gate devis/chantier exige le
          lien Partner.
        </Text>
        <Divider />
        <H3>Hors scope v1</H3>
        <Text size="small" tone="secondary">
          Extraction BDP sur create · checklist pièces · écran « créer client à
          conclusion » (ticket suivant).
        </Text>
      </Stack>
    </Frame>
  );
}

export default function EtudeCreateCpsFirstWireframe() {
  const [view, setView] = useCanvasState<ViewId>("view", "idle");
  const t = useHostTheme();

  return (
    <Stack gap={20}>
      <Stack gap={6}>
        <H1>Création étude — CPS first</H1>
        <Text tone="secondary">
          ERP-10 · wireframe parcours create · AI-first + fallback manuel
        </Text>
      </Stack>

      <Row gap={6} wrap>
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

      {view === "idle" ? <ViewIdle /> : null}
      {view === "extracting" ? <ViewExtracting /> : null}
      {view === "review" ? <ViewReview /> : null}
      {view === "partial" ? <ViewPartial /> : null}
      {view === "ready" ? <ViewReady /> : null}
      {view === "decisions" ? <ViewDecisions /> : null}

      <div
        style={{
          borderTop: `1px solid ${t.stroke.tertiary}`,
          paddingTop: 12,
        }}
      >
        <H2>Réf.</H2>
        <Spacer size={6} />
        <Text size="small" tone="tertiary">
          Task ERP-10 · propose existant post-create (pieces-marche) · à
          remonter ici · sync repo
          products/sektor-btp/docs/ux/wireframes/etude-create-cps-first-wireframe.canvas.tsx
        </Text>
      </div>
    </Stack>
  );
}
