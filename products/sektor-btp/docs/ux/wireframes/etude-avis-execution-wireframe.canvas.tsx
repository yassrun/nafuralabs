import type { ReactNode } from "react";
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
  Text,
  TextInput,
  TextArea,
  useCanvasState,
  useHostTheme,
} from "cursor/canvas";

/** L8 — avis d'exécution (05-ux.md écran 5). */
type ViewId = "poser" | "ouvert" | "ecarter" | "etape5" | "readonly";

function Frame({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  const t = useHostTheme();
  return (
    <div
      style={{
        border: `1px solid ${t.stroke.secondary}`,
        background: t.bg.editor,
        borderRadius: 8,
        overflow: "hidden",
        minHeight: 420,
      }}
    >
      <div
        style={{
          padding: "10px 14px",
          borderBottom: `1px solid ${t.stroke.tertiary}`,
          background: t.bg.chrome,
        }}
      >
        <Text size="small" weight="semibold">
          Étude · Avis d&apos;exécution · {title}
        </Text>
      </div>
      {children}
    </div>
  );
}

function PosteChrome() {
  const t = useHostTheme();
  return (
    <div
      style={{
        padding: "10px 14px",
        borderBottom: `1px solid ${t.stroke.tertiary}`,
      }}
    >
      <Row gap={8} align="center" wrap>
        <Text weight="semibold">3.2 Enduit extérieur</Text>
        <Pill size="sm" tone="neutral">
          Article 3.2.1
        </Pill>
        <Text size="small" tone="tertiary">
          1 240 m² · PU 53,16 DH
        </Text>
      </Row>
    </div>
  );
}

function ViewPoser({
  niveau,
  setNiveau,
}: {
  niveau: "REALISABLE" | "DIFFICILE" | "IRREALISABLE";
  setNiveau: (n: "REALISABLE" | "DIFFICILE" | "IRREALISABLE") => void;
}) {
  const t = useHostTheme();
  const needsComment = niveau !== "REALISABLE";
  return (
    <Stack gap={0}>
      <PosteChrome />
      <div style={{ padding: 16 }}>
        <Stack gap={12}>
          <Callout tone="info" title="Rôle conducteur (etude.avis)">
            Aucun champ de chiffrage éditable. Vous proposez un écart — le
            chiffreur applique ou non.
          </Callout>

          <Text size="small" tone="secondary">
            Niveau
          </Text>
          <Row gap={6} wrap>
            {(
              [
                { id: "REALISABLE" as const, label: "Réalisable" },
                { id: "DIFFICILE" as const, label: "Difficile" },
                { id: "IRREALISABLE" as const, label: "Irréalisable" },
              ] as const
            ).map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setNiveau(o.id)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: `1px solid ${
                    niveau === o.id ? t.accent.primary : t.stroke.secondary
                  }`,
                  background: t.bg.elevated,
                  color: t.text.primary,
                  cursor: "pointer",
                  fontWeight: niveau === o.id ? 600 : 400,
                  fontSize: 13,
                }}
              >
                {o.label}
              </button>
            ))}
          </Row>

          <TextArea
            placeholder={
              needsComment
                ? "Commentaire obligatoire (réserve)…"
                : "Commentaire optionnel…"
            }
            rows={3}
            defaultValue={
              needsComment
                ? "Façade à 12 m, il faut un échafaudage roulant et deux jours de montage. Pas vu dans la décompo."
                : ""
            }
          />

          <Row gap={8} align="center">
            <Text size="small">Écart proposé</Text>
            <TextInput defaultValue="+ 4,00" style={{ width: 88 }} />
            <Text size="small" tone="tertiary">
              DH/m²
            </Text>
          </Row>

          {needsComment ? (
            <Callout tone="warning" title="Règle">
              DIFFICILE / IRREALISABLE sans commentaire → refusé.
            </Callout>
          ) : null}

          <Row gap={8}>
            <Button variant="primary">Envoyer l&apos;avis</Button>
            <Button variant="secondary">Annuler</Button>
          </Row>
        </Stack>
      </div>
    </Stack>
  );
}

function ViewOuvert() {
  const t = useHostTheme();
  return (
    <Stack gap={0}>
      <PosteChrome />
      <div style={{ padding: 16 }}>
        <Stack gap={12}>
          <div
            style={{
              border: `1px solid ${t.stroke.secondary}`,
              borderRadius: 8,
              padding: 14,
              background: t.bg.elevated,
            }}
          >
            <Stack gap={8}>
              <Row gap={8} align="center" wrap>
                <Pill size="sm" tone="warning">
                  OUVERT
                </Pill>
                <Text size="small" weight="semibold">
                  K. Alaoui · conducteur
                </Text>
                <Text size="small" tone="tertiary">
                  il y a 2 j
                </Text>
              </Row>
              <Text weight="semibold">Difficile à ce prix</Text>
              <Text size="small">
                « Façade à 12 m, il faut un échafaudage roulant et deux jours de
                montage. Pas vu dans la décompo. »
              </Text>
              <Text size="small" tone="secondary">
                Propose : + 4,00 DH/m²
              </Text>
              <Divider />
              <Row gap={8} wrap>
                <Button variant="primary">Prendre en compte</Button>
                <Button variant="secondary">Écarter — motif obligatoire</Button>
              </Row>
              <Text size="small" tone="tertiary">
                Prendre en compte n&apos;exige rien (le chiffreur a déjà corrigé
                ou accepte l&apos;écart). Écarter ouvre le motif.
              </Text>
            </Stack>
          </div>

          <Callout tone="info" title="Historique">
            Un avis traité reste visible — jamais masqué. Matière pour la
            corrélation chantier (phase 7).
          </Callout>
        </Stack>
      </div>
    </Stack>
  );
}

function ViewEcarter() {
  return (
    <Stack gap={0}>
      <PosteChrome />
      <div style={{ padding: 16 }}>
        <Stack gap={12}>
          <Callout tone="warning" title="Écarter l&apos;avis">
            Motif obligatoire. Sans motif → refusé.
          </Callout>
          <TextArea
            rows={3}
            defaultValue="Échafaudage déjà inclus dans le poste 3.1 — pas de surcoût."
          />
          <Row gap={8}>
            <Button variant="primary">Confirmer l&apos;écart</Button>
            <Button variant="secondary">Annuler</Button>
          </Row>
        </Stack>
      </div>
    </Stack>
  );
}

function ViewEtape5() {
  const t = useHostTheme();
  return (
    <div style={{ padding: 16 }}>
      <Stack gap={14}>
        <Text weight="semibold">DE-0142 · Étape 5 — avant soumission</Text>
        <Callout tone="warning" title="Avis d&apos;exécution">
          1 ouvert · 3 écartés · soumission autorisée (non bloquant) · [ Détail ]
        </Callout>
        <div
          style={{
            border: `1px solid ${t.stroke.secondary}`,
            borderRadius: 8,
            padding: 12,
          }}
        >
          <Stack gap={6}>
            <Text size="small" weight="semibold">
              Liste (filtre écartés)
            </Text>
            <Text size="small">
              3.2.1 Enduit — DIFFICILE · écarté · « déjà dans 3.1 »
            </Text>
            <Text size="small">
              4.1.0 Peinture — IRREALISABLE · écarté · « hors périmètre »
            </Text>
            <Text size="small">
              5.0.2 Divers — DIFFICILE · écarté · « absorbé FG »
            </Text>
          </Stack>
        </div>
        <Text size="small" tone="tertiary">
          Gate étape 5 remonte OUVERT + ECARTE — visible, jamais grisé silencieux.
        </Text>
      </Stack>
    </div>
  );
}

function ViewReadonly() {
  const t = useHostTheme();
  return (
    <Stack gap={0}>
      <PosteChrome />
      <div style={{ padding: 16 }}>
        <Stack gap={10}>
          <Pill size="sm" tone="info">
            Lecture seule · étude validée
          </Pill>
          <div
            style={{
              border: `1px solid ${t.stroke.secondary}`,
              borderRadius: 8,
              padding: 12,
            }}
          >
            <Text size="small" weight="semibold">
              Difficile · PRIS_EN_COMPTE · K. Alaoui
            </Text>
            <Text size="small">
              Propose +4,00 — pris en compte le 08/08/2026 par I. Chiffreur
            </Text>
          </div>
          <Text size="small" tone="tertiary">
            AC : avis reste attaché au poste après validation, lisible depuis le
            chantier (prérequis phase 7).
          </Text>
        </Stack>
      </div>
    </Stack>
  );
}

function Decisions() {
  return (
    <Stack gap={8}>
      <H2>Décisions UX à valider (L8)</H2>
      <Text>
        <Text as="span" weight="semibold">
          1. Trois niveaux seulement{" "}
        </Text>
        : Réalisable / Difficile / Irréalisable. Commentaire obligatoire si ≠
        Réalisable.
      </Text>
      <Text>
        <Text as="span" weight="semibold">
          2. Auteur avis = etude.avis{" "}
        </Text>
        — zéro champ chiffrage. Propose écart optionnel (DH/m²).
      </Text>
      <Text>
        <Text as="span" weight="semibold">
          3. Traitement chiffreur{" "}
        </Text>
        : Prendre en compte (sans motif) | Écarter (motif obligatoire).
      </Text>
      <Text>
        <Text as="span" weight="semibold">
          4. Historique permanent{" "}
        </Text>
        — avis traité jamais masqué ; visible post-validation.
      </Text>
      <Text>
        <Text as="span" weight="semibold">
          5. Étape 5 non bloquante{" "}
        </Text>
        — compteur OUVERT + ECARTE ; soumission possible ; alerte visible.
      </Text>
      <Text>
        <Text as="span" weight="semibold">
          6. Emplacement{" "}
        </Text>
        : bloc dans le drawer poste (sous plancher) + bandeau stub L6 câblé +
        liste dans synthèse validation.
      </Text>
      <Text>
        <Text as="span" weight="semibold">
          7. Hors L8{" "}
        </Text>
        : avis sur composant_dpu (2ᵉ temps) ; corrélation chantier (phase 7) ;
        réécriture circuit approbation (L4 déjà fait).
      </Text>
      <Text>
        <Text as="span" weight="semibold">
          8. Changelog{" "}
        </Text>
        : `015_l8_avis_execution.sql` — pas de touch `013_l4_*`.
      </Text>
    </Stack>
  );
}

export default function EtudeAvisExecutionWireframe() {
  const [view, setView] = useCanvasState<ViewId>("l8-wf-view", "ouvert");
  const [niveau, setNiveau] = useCanvasState<
    "REALISABLE" | "DIFFICILE" | "IRREALISABLE"
  >("l8-wf-niveau", "DIFFICILE");

  return (
    <Stack gap={20} style={{ padding: 24, maxWidth: 920 }}>
      <Stack gap={6}>
        <H1>Wireframe L8 — Avis d&apos;exécution</H1>
        <Text tone="secondary">
          Normatif : 05-ux.md écran 5 + modèle avis_execution. Valider avant
          code (back table + API + front).
        </Text>
      </Stack>

      <Row gap={8} wrap>
        <Button
          variant={view === "poser" ? "primary" : "secondary"}
          onClick={() => setView("poser")}
        >
          1 · Poser (conducteur)
        </Button>
        <Button
          variant={view === "ouvert" ? "primary" : "secondary"}
          onClick={() => setView("ouvert")}
        >
          2 · Traiter (ouvert)
        </Button>
        <Button
          variant={view === "ecarter" ? "primary" : "secondary"}
          onClick={() => setView("ecarter")}
        >
          3 · Écarter + motif
        </Button>
        <Button
          variant={view === "etape5" ? "primary" : "secondary"}
          onClick={() => setView("etape5")}
        >
          4 · Compteur étape 5
        </Button>
        <Button
          variant={view === "readonly" ? "primary" : "secondary"}
          onClick={() => setView("readonly")}
        >
          5 · Post-validation
        </Button>
      </Row>

      <Callout tone="info" title="Cycle de vie">
        Conducteur pose (OUVERT) → chiffreur Prendre en compte | Écarter →
        historique permanent. Soumission non bloquée par avis ouverts/écartés.
      </Callout>

      <Frame
        title={
          view === "poser"
            ? "formulaire auteur"
            : view === "ouvert"
              ? "carte OUVERT + actions"
              : view === "ecarter"
                ? "motif obligatoire"
                : view === "etape5"
                  ? "dossier validation"
                  : "lecture seule"
        }
      >
        {view === "poser" ? (
          <ViewPoser niveau={niveau} setNiveau={setNiveau} />
        ) : null}
        {view === "ouvert" ? <ViewOuvert /> : null}
        {view === "ecarter" ? <ViewEcarter /> : null}
        {view === "etape5" ? <ViewEtape5 /> : null}
        {view === "readonly" ? <ViewReadonly /> : null}
      </Frame>

      <Decisions />
    </Stack>
  );
}
