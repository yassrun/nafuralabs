import type { ReactNode } from "react";
import {
  Button,
  Callout,
  Checkbox,
  Divider,
  H1,
  H2,
  Pill,
  Row,
  Spacer,
  Stack,
  Text,
  useCanvasState,
  useHostTheme,
} from "cursor/canvas";

/**
 * L12 — Versement bibliothèque à la validation (capitalisation)
 * Specs : 01-modele-cible.md Phase 3 · 02-phases.md ACs L12
 * Archive : etude-prix-unifiee/04-decomposition-bibliotheque.md T4.3
 *
 * Interdit auto-versement dans valider(). Corpus 84 = seed demo (hors UI).
 */
type ViewId =
  | "validee"
  | "proposer"
  | "collision"
  | "confirme"
  | "vide";

function Frame({ children, title }: { children: ReactNode; title: string }) {
  const t = useHostTheme();
  return (
    <div
      style={{
        border: `1px solid ${t.stroke.secondary}`,
        background: t.bg.editor,
        borderRadius: 8,
        overflow: "hidden",
        minHeight: 440,
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
          Étude · Bibliothèque · {title}
        </Text>
      </div>
      {children}
    </div>
  );
}

function ViewValidee({ go }: { go: (v: ViewId) => void }) {
  const t = useHostTheme();
  return (
    <Stack gap={0}>
      <div
        style={{
          padding: "10px 14px",
          borderBottom: `1px solid ${t.stroke.tertiary}`,
        }}
      >
        <Row gap={8} align="center">
          <Text weight="semibold">Synthèse · dossier VALIDEE</Text>
          <Pill size="sm" tone="success">
            VALIDEE
          </Pill>
        </Row>
      </div>
      <div style={{ padding: 16 }}>
        <Stack gap={12}>
          <Callout tone="info" title="Après validation — pas pendant">
            La validation N2 ne verse rien. Proposition explicite ici (ou juste
            après le toast « Validée »). Jamais dans la transaction
            valider().
          </Callout>

          <div
            style={{
              border: `1px solid ${t.stroke.secondary}`,
              borderRadius: 6,
              padding: 12,
              background: t.bg.elevated,
            }}
          >
            <Stack gap={8}>
              <Row gap={8} align="center" justify="space-between">
                <Stack gap={2}>
                  <Text weight="semibold">
                    4 articles décomposés → bibliothèque ?
                  </Text>
                  <Text size="small" tone="secondary">
                    Origine DECOMPOSE · rendements + PU datés · origine=ETUDE
                  </Text>
                </Stack>
                <Pill size="sm" tone="warning">
                  À traiter
                </Pill>
              </Row>
              <Row gap={8}>
                <Button variant="primary" onClick={() => go("proposer")}>
                  Proposer le versement
                </Button>
                <Button variant="ghost" onClick={() => go("vide")}>
                  Plus tard
                </Button>
              </Row>
            </Stack>
          </div>

          <Text size="small" tone="secondary">
            Même zone que le rattrapage L9 (synthèse étape 5) — panneau frère,
            visible seulement si statut VALIDEE et candidats restants.
          </Text>
        </Stack>
      </div>
    </Stack>
  );
}

function CandidatRow({
  code,
  designation,
  status,
  checked,
  onToggle,
  onCompare,
}: {
  code: string;
  designation: string;
  status: "nouveau" | "collision";
  checked: boolean;
  onToggle: () => void;
  onCompare?: () => void;
}) {
  const t = useHostTheme();
  return (
    <div
      style={{
        border: `1px solid ${t.stroke.tertiary}`,
        borderRadius: 6,
        padding: "10px 12px",
        background: t.bg.elevated,
      }}
    >
      <Row gap={10} align="center" justify="space-between">
        <Row gap={10} align="center">
          <Checkbox checked={checked} onChange={onToggle} />
          <Stack gap={2}>
            <Text weight="semibold">
              {code} — {designation}
            </Text>
            <Text size="small" tone="secondary">
              GROS_OEUVRE.MAC_ELEV · 3 composants · déboursé 186,40 DH
            </Text>
          </Stack>
        </Row>
        <Row gap={8} align="center">
          {status === "nouveau" ? (
            <Pill size="sm" tone="success">
              Nouveau
            </Pill>
          ) : (
            <>
              <Pill size="sm" tone="warning">
                Code existant
              </Pill>
              <Button variant="secondary" onClick={onCompare}>
                Comparer
              </Button>
            </>
          )}
        </Row>
      </Row>
    </div>
  );
}

function ViewProposer({ go }: { go: (v: ViewId) => void }) {
  const [c1, setC1] = useCanvasState("c1", true);
  const [c2, setC2] = useCanvasState("c2", true);
  const [c3, setC3] = useCanvasState("c3", false);
  const [c4, setC4] = useCanvasState("c4", true);

  return (
    <div style={{ padding: 16 }}>
      <Stack gap={12}>
        <Callout tone="neutral" title="Un écran, une liste, des cases">
          Cocher ce qu’on verse. Non coché = ignoré cette fois (reproposable).
          Pas d’écrasement silencieux.
        </Callout>

        <Text weight="semibold">Candidats (DECOMPOSE)</Text>

        <Stack gap={8}>
          <CandidatRow
            code="GROS_OEUVRE.MAC_ELEV.agglo-20"
            designation="Cloison agglo 20"
            status="nouveau"
            checked={c1}
            onToggle={() => setC1(!c1)}
          />
          <CandidatRow
            code="GROS_OEUVRE.MAC_ELEV.mortier"
            designation="Mortier bâtard"
            status="collision"
            checked={c2}
            onToggle={() => setC2(!c2)}
            onCompare={() => go("collision")}
          />
          <CandidatRow
            code="GROS_OEUVRE.BA_FOND.semelle"
            designation="Semelle filante"
            status="nouveau"
            checked={c3}
            onToggle={() => setC3(!c3)}
          />
          <CandidatRow
            code="GROS_OEUVRE.TER_GEN.deblais"
            designation="Déblais en masse"
            status="nouveau"
            checked={c4}
            onToggle={() => setC4(!c4)}
          />
        </Stack>

        <Divider />

        <Row gap={8} justify="space-between" align="center">
          <Text size="small" tone="secondary">
            3 cochés · 1 collision à trancher avant versement
          </Text>
          <Row gap={8}>
            <Button variant="ghost" onClick={() => go("validee")}>
              Annuler
            </Button>
            <Button variant="primary" onClick={() => go("confirme")}>
              Verser la sélection
            </Button>
          </Row>
        </Row>
      </Stack>
    </div>
  );
}

function ViewCollision({ back }: { back: () => void }) {
  const t = useHostTheme();
  const [decision, setDecision] = useCanvasState<
    "skip" | "nouveau-code" | "remplacer"
  >("decision", "skip");

  return (
    <div style={{ padding: 16 }}>
      <Stack gap={12}>
        <Callout tone="warning" title="Code déjà en bibliothèque">
          GROS_OEUVRE.MAC_ELEV.mortier — comparaison de rendements. Jamais
          d’écrasement sans choix explicite.
        </Callout>

        <Text weight="semibold">Mortier bâtard</Text>

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
              borderRadius: 6,
              padding: 12,
            }}
          >
            <Stack gap={8}>
              <Text size="small" weight="semibold">
                Bibliothèque (actuel)
              </Text>
              <Text size="small" tone="secondary">
                origine SAISIE · maj 2026-03-12
              </Text>
              <Divider />
              <Text size="small">Ciment CPJ — 350 kg/m³</Text>
              <Text size="small">Sable — 0,8 m³/m³</Text>
              <Text size="small">Eau — 180 L/m³</Text>
            </Stack>
          </div>
          <div
            style={{
              border: `1px solid ${t.stroke.primary}`,
              borderRadius: 6,
              padding: 12,
              background: t.bg.elevated,
            }}
          >
            <Stack gap={8}>
              <Text size="small" weight="semibold">
                Étude (candidat)
              </Text>
              <Text size="small" tone="secondary">
                origine ETUDE · dossier AFF-2026-041
              </Text>
              <Divider />
              <Text size="small">Ciment CPJ — 320 kg/m³ ←</Text>
              <Text size="small">Sable — 0,85 m³/m³ ←</Text>
              <Text size="small">Eau — 180 L/m³</Text>
            </Stack>
          </div>
        </div>

        <Text size="small" tone="secondary">
          Prix unitaires aussi copiés mais datés (derniereMaj) — un prix
          vieillit, un rendement non.
        </Text>

        <Divider />

        <Text weight="semibold">Décision requise</Text>
        <Stack gap={6}>
          <Row gap={8} align="center">
            <Button
              variant={decision === "skip" ? "primary" : "secondary"}
              onClick={() => setDecision("skip")}
            >
              Ignorer (garder biblio)
            </Button>
            <Button
              variant={decision === "nouveau-code" ? "primary" : "secondary"}
              onClick={() => setDecision("nouveau-code")}
            >
              Créer sous nouveau code
            </Button>
            <Button
              variant={decision === "remplacer" ? "primary" : "secondary"}
              onClick={() => setDecision("remplacer")}
            >
              Remplacer explicitement
            </Button>
          </Row>
          <Text size="small" tone="secondary">
            Pas de « nouvelle version » auto en L12 — table de versions =
            optionnel post-L12. Remplacer = confirmation consciente.
          </Text>
        </Stack>

        <Row gap={8}>
          <Button variant="ghost" onClick={back}>
            Retour liste
          </Button>
          <Button variant="primary" onClick={back}>
            Appliquer la décision
          </Button>
        </Row>
      </Stack>
    </div>
  );
}

function ViewConfirme({ go }: { go: (v: ViewId) => void }) {
  return (
    <div style={{ padding: 16 }}>
      <Stack gap={12}>
        <Callout tone="success" title="Versement effectué">
          2 ouvrages créés · 1 collision ignorée · 1 non coché laissé de côté.
          source_etude_id + origine=ETUDE tracés.
        </Callout>

        <Stack gap={6}>
          <Text size="small">
            ✓ GROS_OEUVRE.MAC_ELEV.agglo-20 — créé
          </Text>
          <Text size="small">
            ✓ GROS_OEUVRE.TER_GEN.deblais — créé
          </Text>
          <Text size="small" tone="secondary">
            · mortier — ignoré (biblio conservée)
          </Text>
          <Text size="small" tone="secondary">
            · semelle — non sélectionné
          </Text>
        </Stack>

        <Row gap={8}>
          <Button variant="primary" onClick={() => go("vide")}>
            Terminer
          </Button>
          <Button variant="secondary" onClick={() => go("proposer")}>
            Revoir les restants
          </Button>
        </Row>
      </Stack>
    </div>
  );
}

function ViewVide() {
  return (
    <div style={{ padding: 16 }}>
      <Stack gap={12}>
        <Callout tone="success" title="Rien à verser">
          Aucun article DECOMPOSE restant, ou proposition déjà traitée /
          reportée. Le panneau se masque.
        </Callout>
        <Text size="small" tone="secondary">
          Corpus demo 84 ouvrages : seed tenant (hors cet écran) — L12 back.
        </Text>
      </Stack>
    </div>
  );
}

export default function EtudeVersementBiblioWireframe() {
  const [view, setView] = useCanvasState<ViewId>("view", "validee");

  return (
    <Stack gap={20} style={{ padding: 20, maxWidth: 920 }}>
      <Stack gap={6}>
        <H1>L12 — Versement bibliothèque</H1>
        <Text tone="secondary">
          Wireframe epic referentiel-catalogue-sektor · à valider avant code
        </Text>
      </Stack>

      <Row gap={6} wrap>
        {(
          [
            { id: "validee" as const, label: "1. Après VALIDEE" },
            { id: "proposer" as const, label: "2. Liste à cocher" },
            { id: "collision" as const, label: "3. Collision rendements" },
            { id: "confirme" as const, label: "4. Confirmé" },
            { id: "vide" as const, label: "5. Vide / masqué" },
          ] as const
        ).map((tab) => (
          <Pill
            key={tab.id}
            size="sm"
            active={view === tab.id}
            onClick={() => setView(tab.id)}
          >
            {tab.label}
          </Pill>
        ))}
      </Row>

      <Frame
        title={
          view === "validee"
            ? "Synthèse post-validation"
            : view === "proposer"
              ? "Proposer le versement"
              : view === "collision"
                ? "Comparer rendements"
                : view === "confirme"
                  ? "Résultat"
                  : "Panneau masqué"
        }
      >
        {view === "validee" && <ViewValidee go={setView} />}
        {view === "proposer" && <ViewProposer go={setView} />}
        {view === "collision" && (
          <ViewCollision back={() => setView("proposer")} />
        )}
        {view === "confirme" && <ViewConfirme go={setView} />}
        {view === "vide" && <ViewVide />}
      </Frame>

      <Divider />

      <H2>Décisions UX (à valider)</H2>
      <Stack gap={8}>
        <Text>
          1. Proposition après VALIDEE seulement — jamais auto dans
          valider(). Panneau synthèse (frère du rattrapage L9).
        </Text>
        <Text>
          2. Liste à cocher des articles DECOMPOSE ; non coché = reporté,
          reproposable.
        </Text>
        <Text>
          3. Collision code existant → comparaison rendements côte à côte ;
          décision obligatoire : Ignorer / Nouveau code / Remplacer
          explicite.
        </Text>
        <Text>
          4. Capitalise rendements + PU datés ; origine=ETUDE ;
          source_etude_id tracé. Codes ADR PR2
          {"{lot}.{famille}.{slug}"}.
        </Text>
        <Text>
          5. Hors UI : seed corpus 84 sur tenant demo (totaux
          rejoués). Pas de table versions en L12.
        </Text>
        <Text>
          6. Hors lot : catalogue Sektor (L14), rapprochement auto (L15),
          Instancier biblio→étude (déjà partiel).
        </Text>
      </Stack>

      <Spacer />
      <Text size="small" tone="secondary">
        Valider « tel quel » pour débloquer l’impl L12.
      </Text>
    </Stack>
  );
}
