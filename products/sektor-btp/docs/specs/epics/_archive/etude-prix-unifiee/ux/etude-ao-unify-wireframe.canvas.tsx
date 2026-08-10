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

type ViewId =
  | "nav"
  | "listing"
  | "create"
  | "pieces-ia"
  | "pieces-manuel"
  | "gate";

const VIEWS: Array<{ id: ViewId; label: string }> = [
  { id: "nav", label: "1 · Nav" },
  { id: "listing", label: "2 · Listing" },
  { id: "create", label: "3 · Création" },
  { id: "pieces-ia", label: "4 · Pièces + CPS IA" },
  { id: "pieces-manuel", label: "5 · Fallback manuel" },
  { id: "gate", label: "6 · Gate continuer" },
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
  hint,
  suggested,
  required,
}: {
  label: string;
  value: string;
  hint?: string;
  suggested?: boolean;
  required?: boolean;
}) {
  const t = useHostTheme();
  return (
    <div
      style={{
        border: `1px solid ${suggested ? t.accent.primary : t.stroke.tertiary}`,
        borderRadius: 8,
        padding: "8px 10px",
        background: suggested ? t.fill.tertiary : t.bg.elevated,
      }}
    >
      <Row gap={6} align="center">
        <Text size="small" tone="tertiary">
          {label}
          {required ? " *" : ""}
        </Text>
        {suggested ? (
          <Pill size="sm" tone="info">
            proposé CPS
          </Pill>
        ) : null}
      </Row>
      <Spacer size={4} />
      <Text size="small" weight="semibold">
        {value}
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

function SlotCard({
  badge,
  title,
  state,
  required,
  source,
}: {
  badge: string;
  title: string;
  state: "empty" | "filled" | "missing";
  required?: boolean;
  source?: string;
}) {
  const t = useHostTheme();
  const border =
    state === "missing"
      ? t.stroke.primary
      : state === "filled"
        ? t.stroke.secondary
        : t.stroke.tertiary;
  return (
    <div
      style={{
        border: `1px solid ${border}`,
        borderRadius: 8,
        padding: 12,
        background: state === "filled" ? t.fill.tertiary : t.bg.elevated,
        minHeight: 96,
      }}
    >
      <Row gap={6} align="center">
        <Pill size="sm" active={required}>
          {badge}
        </Pill>
        {required ? (
          <Text size="small" tone="tertiary">
            Obligatoire
          </Text>
        ) : (
          <Text size="small" tone="tertiary">
            Optionnel
          </Text>
        )}
        {source ? (
          <Pill size="sm" tone="info">
            {source}
          </Pill>
        ) : null}
      </Row>
      <Spacer size={6} />
      <Text weight="semibold">{title}</Text>
      <Spacer size={6} />
      <Text size="small" tone="secondary">
        {state === "filled"
          ? "fichier.pdf — joint"
          : state === "missing"
            ? "À joindre"
            : "Glisser-déposer / parcourir"}
      </Text>
    </div>
  );
}

function ViewNav() {
  const t = useHostTheme();
  return (
    <Frame title="Études — navigation">
      <Stack gap={16}>
        <H3>Avant (aujourd’hui)</H3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <div
            style={{
              border: `1px solid ${t.stroke.secondary}`,
              borderRadius: 8,
              padding: 12,
            }}
          >
            <Text weight="semibold">Chiffrage</Text>
            <Spacer size={6} />
            <Text size="small">· Dossiers d’étude</Text>
            <Text size="small" tone="tertiary">
              · Bibliothèque / métrés / devis
            </Text>
          </div>
          <div
            style={{
              border: `1px solid ${t.stroke.secondary}`,
              borderRadius: 8,
              padding: 12,
            }}
          >
            <Text weight="semibold">Soumissions</Text>
            <Spacer size={6} />
            <Text size="small">· Appels d’offres clients</Text>
            <Text size="small" tone="tertiary">
              Fiche AO séparée
            </Text>
          </div>
        </div>

        <Divider />

        <H3>Après (cible)</H3>
        <div
          style={{
            border: `1px solid ${t.accent.primary}`,
            borderRadius: 8,
            padding: 12,
            background: t.fill.tertiary,
          }}
        >
          <Text weight="semibold">Études & soumissions</Text>
          <Spacer size={6} />
          <Text size="small">· Études / AO — une seule entrée</Text>
          <Text size="small" tone="tertiary">
            · Bibliothèque / métrés / devis (inchangés)
          </Text>
          <Spacer size={8} />
          <Text size="small" tone="secondary">
            AOC legacy → redirect vers listing unifié / dossier lié
          </Text>
        </div>
      </Stack>
    </Frame>
  );
}

function ViewListing() {
  const t = useHostTheme();
  const rows = [
    ["DE-0042", "Résidence Atlas — GO", "Public", "Chiffrage", "12j"],
    ["DE-0041", "Réhab. école Al Massira", "Public", "Pièces", "3j"],
    ["DE-0040", "Villa privée Targa", "Privé", "Validé", "—"],
  ];
  return (
    <Frame title="Listing unifié — Études / AO">
      <Stack gap={12}>
        <Row gap={8} align="center" justify="space-between">
          <Text weight="semibold">Études / appels d’offres</Text>
          <Button variant="primary">+ Nouvelle étude</Button>
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
              gridTemplateColumns: "88px 1.6fr 72px 88px 56px",
              gap: 8,
              padding: "8px 12px",
              background: t.fill.tertiary,
            }}
          >
            {["N°", "Objet", "Type", "Étape", "Délai"].map((h) => (
              <span key={h}>
                <Text size="small" tone="tertiary" weight="semibold">
                  {h}
                </Text>
              </span>
            ))}
          </div>
          {rows.map((r) => (
            <div
              key={r[0]}
              style={{
                display: "grid",
                gridTemplateColumns: "88px 1.6fr 72px 88px 56px",
                gap: 8,
                padding: "9px 12px",
                borderTop: `1px solid ${t.stroke.tertiary}`,
              }}
            >
              {r.map((c, i) => (
                <span key={`${r[0]}-${i}`}>
                  <Text size="small" truncate={i === 1}>
                    {c}
                  </Text>
                </span>
              ))}
            </div>
          ))}
        </div>
        <Callout tone="neutral" title="S4 (parallèle)">
          Colonne Objet en ellipsis fixe — statut / étape toujours visibles.
        </Callout>
      </Stack>
    </Frame>
  );
}

function ViewCreate() {
  return (
    <Frame title="Création — un seul formulaire (AO + dossier)">
      <Stack gap={14}>
        <Text size="small" tone="secondary">
          Remplace « Nouveau dossier » (objet+client) et la fiche AOC séparée.
          Crée un DossierEtude (+ lien AOC soft si besoin).
        </Text>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}
        >
          <Field label="Objet" value="Construction résidence — lot GO" required />
          <Field label="Client / MOA" value="Office National …" required />
          <Field label="Réf. officielle" value="AO-2026-0142" />
          <Field label="Type" value="Public" />
          <Field label="Ville" value="Marrakech" />
          <Field label="Date limite dépôt" value="2026-09-18" required />
          <Field label="Ouverture des plis" value="2026-09-22" />
          <Field label="Délai exécution (j)" value="540" />
          <Field label="Estimation MOA HT" value="12 400 000 MAD" />
          <Field label="Caution provisoire" value="248 000 MAD" />
        </div>

        <Row gap={8} justify="end">
          <Button variant="secondary">Annuler</Button>
          <Button variant="primary">Créer et ouvrir les pièces</Button>
        </Row>

        <Callout tone="info" title="Après create">
          Redirect → dossier wizard étape 1 (Pièces). Pas de 2e écran AOC.
        </Callout>
      </Stack>
    </Frame>
  );
}

function ViewPiecesIa() {
  return (
    <Frame
      title="Étape 1 — Pièces du marché"
      wizard="Wizard · 1 Pièces → 2 Bordereau → 3 Chiffrage → 4 Synthèse"
    >
      <Stack gap={14}>
        <Callout tone="info" title="AI-first">
          Déposer le CPS tôt → IA propose métadonnées + checklist PJ. Apply /
          discard. Manuel toujours dispo.
        </Callout>

        <H3>Slots cœur</H3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}
        >
          <SlotCard badge="BDP" title="Bordereau des prix" state="filled" required />
          <SlotCard badge="CPS" title="Cahier des clauses" state="filled" required source="indexé" />
        </div>

        <H3>Propositions CPS (review)</H3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}
        >
          <Field
            label="Objet"
            value="Travaux de gros œuvre — Résidence Atlas"
            suggested
          />
          <Field label="Date limite" value="18/09/2026" suggested />
          <Field label="Type marché" value="Public — ouvert" suggested />
          <Field label="MOA" value="Office …" suggested />
        </div>
        <Row gap={8}>
          <Button variant="primary">Appliquer les propositions</Button>
          <Button variant="secondary">Ignorer</Button>
        </Row>

        <H3>Checklist pièces attendues (proposée)</H3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 10,
          }}
        >
          <SlotCard badge="RC" title="Règlement de consultation" state="missing" required source="IA" />
          <SlotCard badge="AE" title="Acte d’engagement" state="empty" required source="IA" />
          <SlotCard badge="PLAN" title="Plans" state="empty" source="IA" />
          <SlotCard badge="CPT" title="CPT" state="empty" source="IA" />
          <SlotCard badge="CAUT" title="Caution provisoire" state="missing" required source="IA" />
          <SlotCard badge="+" title="Ajouter une pièce" state="empty" />
        </div>

        <Row gap={8} justify="space-between" align="center">
          <Text size="small" tone="tertiary">
            Gate : 2 obligatoires manquantes (RC, Caution)
          </Text>
          <Button variant="primary" disabled>
            Continuer → Bordereau
          </Button>
        </Row>
      </Stack>
    </Frame>
  );
}

function ViewPiecesManuel() {
  return (
    <Frame
      title="Étape 1 — Fallback 100 % manuel"
      wizard="CPS KO / timeout / discard IA"
    >
      <Stack gap={14}>
        <Callout tone="warning" title="L’IA n’a pas bloqué">
          Extraction échouée ou ignorée. Même écran : BDP+CPS mini + Ajouter
          pièce manuelle + marquer obligatoire.
        </Callout>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}
        >
          <SlotCard badge="BDP" title="Bordereau des prix" state="filled" required />
          <SlotCard badge="CPS" title="Cahier des clauses" state="empty" required />
        </div>

        <H3>Pièces ajoutées à la main</H3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 10,
          }}
        >
          <SlotCard badge="RC" title="Règlement" state="filled" required source="manuel" />
          <SlotCard badge="AE" title="Acte d’engagement" state="empty" required source="manuel" />
          <SlotCard badge="+" title="Ajouter une pièce" state="empty" />
        </div>

        <Text size="small" tone="secondary">
          User peut retirer une proposition IA, changer obligatoire ↔
          optionnel, éditer métadonnées sans attendre l’index CPS.
        </Text>
      </Stack>
    </Frame>
  );
}

function ViewGate() {
  const t = useHostTheme();
  return (
    <Frame title="Gate « Continuer » — règle métier">
      <Stack gap={14}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <div
            style={{
              border: `1px solid ${t.stroke.secondary}`,
              borderRadius: 8,
              padding: 12,
            }}
          >
            <Pill size="sm" tone="warning">
              Bloqué
            </Pill>
            <Spacer size={8} />
            <Text weight="semibold">Pièces incomplètes</Text>
            <Spacer size={6} />
            <Text size="small" tone="secondary">
              Manquent : RC, Caution. Continuer désactivé + liste cliquable.
            </Text>
            <Spacer size={10} />
            <Button variant="primary" disabled>
              Continuer
            </Button>
          </div>
          <div
            style={{
              border: `1px solid ${t.accent.primary}`,
              borderRadius: 8,
              padding: 12,
              background: t.fill.tertiary,
            }}
          >
            <Pill size="sm" tone="success">
              OK
            </Pill>
            <Spacer size={8} />
            <Text weight="semibold">Toutes les obligatoires jointes</Text>
            <Spacer size={6} />
            <Text size="small" tone="secondary">
              Gate = données jointes, pas « IA a réussi ». Suite = bordereau
              (existant, non wireframé).
            </Text>
            <Spacer size={10} />
            <Button variant="primary">Continuer → Bordereau</Button>
          </div>
        </div>

        <Callout tone="neutral" title="Hors wireframe (déjà livré)">
          Étapes 2 Bordereau · 3 Chiffrage (drawer S1) · 4 Synthèse — on ne les
          redessine pas.
        </Callout>
      </Stack>
    </Frame>
  );
}

function Decisions() {
  return (
    <Stack gap={10}>
      <H2>Décisions UX figées (S5a / S5b)</H2>
      <Text>
        <Text as="span" weight="semibold">
          Un menu.{" "}
        </Text>
        Listing + create unifiés ; AOC en redirect legacy.
      </Text>
      <Text>
        <Text as="span" weight="semibold">
          Create = AO + dossier.{" "}
        </Text>
        Objet, client/MOA, réf, type, dates, cautions — puis étape Pièces.
      </Text>
      <Text>
        <Text as="span" weight="semibold">
          CPS early.{" "}
        </Text>
        Propose métadonnées + checklist ; apply/discard ; jamais écrasement
        silencieux.
      </Text>
      <Text>
        <Text as="span" weight="semibold">
          Gate = PJ jointes.{" "}
        </Text>
        IA ou manuel. Fallback 100 % manuel si CPS KO.
      </Text>
      <Text>
        <Text as="span" weight="semibold">
          Pas de wireframe étude.{" "}
        </Text>
        Bordereau / chiffrage / synthèse déjà en place.
      </Text>
    </Stack>
  );
}

export default function EtudeAoUnifyWireframe() {
  const [view, setView] = useCanvasState<ViewId>("s5-ao-etude-view", "nav");

  return (
    <Stack gap={20} style={{ padding: 24, maxWidth: 980 }}>
      <Stack gap={6}>
        <H1>Wireframe S5 — Unifier AO + étude</H1>
        <Text tone="secondary">
          Parcours du formulaire jusqu’aux pièces marché. Étude (bordereau /
          chiffrage) hors scope — déjà livrée.
        </Text>
      </Stack>

      <Row gap={8} align="center" wrap>
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

      {view === "nav" ? <ViewNav /> : null}
      {view === "listing" ? <ViewListing /> : null}
      {view === "create" ? <ViewCreate /> : null}
      {view === "pieces-ia" ? <ViewPiecesIa /> : null}
      {view === "pieces-manuel" ? <ViewPiecesManuel /> : null}
      {view === "gate" ? <ViewGate /> : null}

      <Divider />
      <Decisions />
    </Stack>
  );
}
