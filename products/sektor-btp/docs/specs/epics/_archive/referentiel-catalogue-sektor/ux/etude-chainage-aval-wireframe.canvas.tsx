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
  useCanvasState,
  useHostTheme,
} from "cursor/canvas";

/**
 * L13 — Chaînage aval : devis → issue → chantier+marché+budget
 * Specs : 02-phases.md Phase 7 · archive 07-chainage-aval.md
 *
 * Interdit : chantier sans dossier ; FG/marge dans budget ; budget zéro silencieux.
 */
type ViewId =
  | "devis"
  | "remise"
  | "issue"
  | "convertir"
  | "budget"
  | "fil"
  | "entree-b";

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
          Étude · Aval · {title}
        </Text>
      </div>
      {children}
    </div>
  );
}

function ViewDevis({ go }: { go: (v: ViewId) => void }) {
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
          <Text weight="semibold">AFF-2026-041 · VALIDEE</Text>
          <Pill size="sm" tone="success">
            VALIDEE
          </Pill>
        </Row>
      </div>
      <div style={{ padding: 16 }}>
        <Stack gap={12}>
          <Callout tone="info" title="T7.1 — Générer le devis">
            Lignes ARTICLE du DPGF → devis. Remise commerciale possible sans
            toucher au chiffrage / déboursé.
          </Callout>

          <div
            style={{
              border: `1px solid ${t.stroke.secondary}`,
              borderRadius: 6,
              padding: 12,
              background: t.bg.elevated,
            }}
          >
            <Stack gap={6}>
              <Row justify="space-between">
                <Text size="small">Total HT chiffrage</Text>
                <Text weight="semibold">1 240 000 DH</Text>
              </Row>
              <Row justify="space-between">
                <Text size="small">Marge moyenne dossier</Text>
                <Text size="small">7 %</Text>
              </Row>
              <Divider />
              <Row justify="space-between">
                <Text size="small">Articles</Text>
                <Text size="small">42 lignes</Text>
              </Row>
            </Stack>
          </div>

          <Row gap={8}>
            <Button variant="primary" onClick={() => go("remise")}>
              Générer le devis
            </Button>
            <Button variant="ghost">Annuler</Button>
          </Row>
        </Stack>
      </div>
    </Stack>
  );
}

function ViewRemise({ go }: { go: (v: ViewId) => void }) {
  const t = useHostTheme();
  const [remise, setRemise] = useCanvasState("remise", "5");
  const remiseNum = Number(remise) || 0;
  const marge = 7;
  const bloque = remiseNum > marge;

  return (
    <div style={{ padding: 16 }}>
      <Stack gap={12}>
        <Text weight="semibold">Devis DEV-2026-088 · brouillon</Text>
        <Callout tone="neutral" title="Remise commerciale">
          N’altère pas le chiffrage étude. Affiche la marge résiduelle.
        </Callout>

        <Row gap={12} align="center">
          <Text size="small">Remise globale %</Text>
          <TextInput
            value={remise}
            onChange={(v: string) => setRemise(v)}
          />
        </Row>

        <div
          style={{
            border: `1px solid ${t.stroke.secondary}`,
            borderRadius: 6,
            padding: 12,
          }}
        >
          <Stack gap={4}>
            <Row justify="space-between">
              <Text size="small">HT avant remise</Text>
              <Text size="small">1 240 000</Text>
            </Row>
            <Row justify="space-between">
              <Text size="small">HT après remise</Text>
              <Text weight="semibold">
                {(1240000 * (1 - remiseNum / 100)).toLocaleString("fr-MA")} DH
              </Text>
            </Row>
            <Row justify="space-between">
              <Text size="small">Marge résiduelle</Text>
              <Text size="small">{(marge - remiseNum).toFixed(1)} %</Text>
            </Row>
          </Stack>
        </div>

        {bloque ? (
          <Callout tone="danger" title="Remise &gt; marge — bloquant">
            Remise {remiseNum} % &gt; marge {marge} %. Corriger ou confirmer
            exception (hors L13 défaut = bloquant).
          </Callout>
        ) : (
          <Callout tone="success" title="Marge OK">
            Marge résiduelle positive — envoi possible.
          </Callout>
        )}

        <Row gap={8}>
          <Button
            variant="primary"
            disabled={bloque}
            onClick={() => go("issue")}
          >
            Confirmer → DEVIS_GENERE
          </Button>
          <Button variant="ghost" onClick={() => go("devis")}>
            Retour
          </Button>
        </Row>
      </Stack>
    </div>
  );
}

function ViewIssue({ go }: { go: (v: ViewId) => void }) {
  const t = useHostTheme();
  const [issue, setIssue] = useCanvasState<"gagne" | "perdu">("issue", "gagne");

  return (
    <div style={{ padding: 16 }}>
      <Stack gap={12}>
        <Row gap={8} align="center">
          <Text weight="semibold">Issue commerciale</Text>
          <Pill size="sm" tone="info">
            DEVIS_GENERE
          </Pill>
        </Row>

        <Row gap={8}>
          <Button
            variant={issue === "gagne" ? "primary" : "secondary"}
            onClick={() => setIssue("gagne")}
          >
            Gagné
          </Button>
          <Button
            variant={issue === "perdu" ? "primary" : "secondary"}
            onClick={() => setIssue("perdu")}
          >
            Perdu
          </Button>
        </Row>

        {issue === "gagne" ? (
          <Stack gap={8}>
            <Text size="small">Date attribution</Text>
            <TextInput value="2026-08-15" />
            <Text size="small">Réf. marché client</Text>
            <TextInput value="AO-2026-112" />
            <Text size="small">Montant attribué HT</Text>
            <TextInput value="1 178 000" />
            <Button variant="primary" onClick={() => go("convertir")}>
              Marquer gagné → créer marché & chantier
            </Button>
          </Stack>
        ) : (
          <Stack gap={8}>
            <Text size="small">Motif structuré</Text>
            <div
              style={{
                border: `1px solid ${t.stroke.secondary}`,
                borderRadius: 6,
                padding: 8,
              }}
            >
              <Stack gap={4}>
                <Text size="small">○ Prix trop élevé</Text>
                <Text size="small">○ Délai</Text>
                <Text size="small">○ Technique</Text>
                <Text size="small">○ Administratif</Text>
                <Text size="small">○ Sans suite</Text>
              </Stack>
            </div>
            <Text size="small">Concurrent retenu (opt.)</Text>
            <TextInput value="" />
            <Button variant="secondary">Enregistrer PERDU</Button>
          </Stack>
        )}
      </Stack>
    </div>
  );
}

function ViewConvertir({ go }: { go: (v: ViewId) => void }) {
  const t = useHostTheme();
  return (
    <div style={{ padding: 16 }}>
      <Stack gap={12}>
        <Callout tone="warning" title="Création atomique (Q3)">
          Un seul écran « Créer le marché et son chantier ». Échec = rien créé.
          Ordre SQL : chantier puis marché (FK) — invisible utilisateur.
        </Callout>

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
            <Stack gap={6}>
              <Text weight="semibold">Marché</Text>
              <Text size="small">Réf. AO-2026-112</Text>
              <Text size="small">Client · Ville Casa</Text>
              <Text size="small">Montant 1 178 000 HT</Text>
            </Stack>
          </div>
          <div
            style={{
              border: `1px solid ${t.stroke.secondary}`,
              borderRadius: 6,
              padding: 12,
            }}
          >
            <Stack gap={6}>
              <Text weight="semibold">Chantier</Text>
              <Text size="small">Code CH-2026-041</Text>
              <Text size="small">Libellé · Enduits Villa X</Text>
              <Text size="small">Lots projetés depuis DPGF</Text>
            </Stack>
          </div>
        </div>

        <Text size="small" tone="secondary">
          Guichet unique : pas de création chantier hors dossier. Projection
          LOT→ChantierLot · ARTICLE→PosteBudgetaire.
        </Text>

        <Row gap={8}>
          <Button variant="primary" onClick={() => go("budget")}>
            Créer marché + chantier + budget
          </Button>
          <Button variant="ghost" onClick={() => go("issue")}>
            Retour
          </Button>
        </Row>
      </Stack>
    </div>
  );
}

function ViewBudget({ go }: { go: (v: ViewId) => void }) {
  const t = useHostTheme();
  return (
    <div style={{ padding: 16 }}>
      <Stack gap={12}>
        <Callout tone="info" title="Budget = déboursé uniquement">
          Σ budget = Σ (cout_unitaire × quantité). Jamais cout_revient ni
          prix_unitaire. FG / marge restent hors exécution.
        </Callout>

        <Text weight="semibold">Ventilation prévisionnelle</Text>

        <div
          style={{
            border: `1px solid ${t.stroke.secondary}`,
            borderRadius: 6,
            overflow: "hidden",
          }}
        >
          {[
            ["MATERIAUX", "DECOMPOSE", "420 000"],
            ["MAIN_OEUVRE", "DECOMPOSE", "310 000"],
            ["MATERIEL", "DECOMPOSE", "95 000"],
            ["SOUS_TRAITANCE", "FORFAIT + ST", "180 000"],
            ["NON_VENTILE", "ESTIME", "48 000"],
            ["NON_VENTILE ⚠", "coût déduit — non fiable", "12 000"],
          ].map(([rub, src, mt]) => (
            <div
              key={rub}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 12px",
                borderBottom: `1px solid ${t.stroke.tertiary}`,
              }}
            >
              <Stack gap={2}>
                <Text size="small" weight="semibold">
                  {rub}
                </Text>
                <Text size="small" tone="secondary">
                  {src}
                </Text>
              </Stack>
              <Text size="small">{mt} DH</Text>
            </div>
          ))}
        </div>

        <Row justify="space-between">
          <Text weight="semibold">Total prévisionnel</Text>
          <Text weight="semibold">1 065 000 DH</Text>
        </Row>
        <Text size="small" tone="secondary">
          Contrôle croisé : = Σ cout_unitaire × qté articles (hors vente).
        </Text>

        <Row gap={8}>
          <Button variant="primary" onClick={() => go("fil")}>
            Voir fil d’Ariane
          </Button>
          <Button variant="ghost" onClick={() => go("convertir")}>
            Retour
          </Button>
        </Row>
      </Stack>
    </div>
  );
}

function ViewFil() {
  const t = useHostTheme();
  return (
    <div style={{ padding: 16 }}>
      <Stack gap={12}>
        <Text weight="semibold">Traçabilité bidirectionnelle</Text>
        <div
          style={{
            border: `1px solid ${t.stroke.secondary}`,
            borderRadius: 6,
            padding: 12,
            background: t.bg.elevated,
          }}
        >
          <Stack gap={6}>
            <Text size="small">Étude AFF-2026-041</Text>
            <Text size="small" tone="secondary">
              ↓
            </Text>
            <Text size="small">Devis DEV-2026-088</Text>
            <Text size="small" tone="secondary">
              ↓
            </Text>
            <Text size="small">Marché AO-2026-112 · Chantier CH-2026-041</Text>
            <Text size="small" tone="secondary">
              ↓
            </Text>
            <Text size="small">
              Budget ligne MATERIAUX → composant ciment · gel catalogue Lafarge
              12/06/2026
            </Text>
          </Stack>
        </div>
        <Callout tone="neutral" title="Depuis le chantier">
          Remonter à l’étude / devis / prix source figé. Avis DIFFICILE ↔ écart
          moyen (corrélation L8).
        </Callout>
      </Stack>
    </div>
  );
}

function ViewEntreeB({ go }: { go: (v: ViewId) => void }) {
  return (
    <div style={{ padding: 16 }}>
      <Stack gap={12}>
        <Callout tone="warning" title="Entrée B — marché déjà attribué">
          origine = MARCHE_EXISTANT. Même guichet : dossier → étape finale →
          convertir. Pas d’échappatoire « chantier direct ».
        </Callout>
        <Text size="small">
          Étapes 3–5 (CPS / chiffrage détaillé) optionnelles ; montants
          saisis nécessaires pour budget.
        </Text>
        <Button variant="primary" onClick={() => go("convertir")}>
          Aller à convertir
        </Button>
      </Stack>
    </div>
  );
}

export default function EtudeChainageAvalWireframe() {
  const [view, setView] = useCanvasState<ViewId>("view", "devis");

  return (
    <Stack gap={20} style={{ padding: 20, maxWidth: 920 }}>
      <Stack gap={6}>
        <H1>L13 — Chaînage aval</H1>
        <Text tone="secondary">
          Wireframe epic referentiel-catalogue-sektor · à valider avant code
        </Text>
      </Stack>

      <Row gap={6} wrap>
        {(
          [
            { id: "devis" as const, label: "1. Générer devis" },
            { id: "remise" as const, label: "2. Remise / marge" },
            { id: "issue" as const, label: "3. Issue commerciale" },
            { id: "convertir" as const, label: "4. Marché + chantier" },
            { id: "budget" as const, label: "5. Budget ventilé" },
            { id: "fil" as const, label: "6. Fil d’Ariane" },
            { id: "entree-b" as const, label: "7. Entrée B" },
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
          view === "devis"
            ? "VALIDEE → devis"
            : view === "remise"
              ? "Remise commerciale"
              : view === "issue"
                ? "Gagné / Perdu"
                : view === "convertir"
                  ? "Conversion atomique"
                  : view === "budget"
                    ? "Budget prévisionnel"
                    : view === "fil"
                      ? "Traçabilité"
                      : "Marché existant"
        }
      >
        {view === "devis" && <ViewDevis go={setView} />}
        {view === "remise" && <ViewRemise go={setView} />}
        {view === "issue" && <ViewIssue go={setView} />}
        {view === "convertir" && <ViewConvertir go={setView} />}
        {view === "budget" && <ViewBudget go={setView} />}
        {view === "fil" && <ViewFil />}
        {view === "entree-b" && <ViewEntreeB go={setView} />}
      </Frame>

      <Divider />

      <H2>Décisions UX (à valider)</H2>
      <Stack gap={8}>
        <Text>
          1. Devis depuis VALIDEE ; remise commerciale sans toucher chiffrage ;
          remise &gt; marge = bloquant.
        </Text>
        <Text>
          2. Issue : Gagné (date, réf, montant) / Perdu (motif structuré).
        </Text>
        <Text>
          3. Un écran atomique marché+chantier ; guichet unique via dossier ;
          pas de chantier ex nihilo.
        </Text>
        <Text>
          4. Budget = déboursé (cout_unitaire × qté) ; FORFAIT→ST ;
          ESTIME/déduit→NON_VENTILE (déduit = non fiable).
        </Text>
        <Text>
          5. Fil d’Ariane étude ↔ devis ↔ marché/chantier ↔ prix gel ;
          corrélation avis/écarts.
        </Text>
        <Text>
          6. Entrée B (MARCHE_EXISTANT) même convert — pas d’échappatoire.
        </Text>
      </Stack>

      <Spacer />
      <Text size="small" tone="secondary">
        Validé « tel quel » — L13 livré.
      </Text>
    </Stack>
  );
}
