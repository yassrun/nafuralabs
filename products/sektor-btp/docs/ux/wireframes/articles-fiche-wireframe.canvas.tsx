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

type ViewId = "liste" | "fiche-create" | "fiche-matiere" | "fiche-mo" | "familles";

const LIST_ROWS: Array<{
  code: string;
  name: string;
  nature: string;
  famille: string;
  stockable: boolean;
  selected?: boolean;
}> = [
  {
    code: "CIM-325",
    name: "Ciment CPJ 32,5 R",
    nature: "MATIERE",
    famille: "Liants / Ciment",
    stockable: true,
    selected: true,
  },
  {
    code: "SBL-01",
    name: "Sable 0/4",
    nature: "MATIERE",
    famille: "Granulats / Sable",
    stockable: true,
  },
  {
    code: "MO-OQ",
    name: "Ouvrier qualifié",
    nature: "MAIN_DOEUVRE",
    famille: "Main d'œuvre / Qualifiée",
    stockable: false,
  },
  {
    code: "LOC-PEL",
    name: "Pelle 20 T — location",
    nature: "LOCATION",
    famille: "Engins / Terrassement",
    stockable: false,
  },
];

const NATURE_HINTS: Record<string, string> = {
  MATIERE: "Stockable · valorisé · DPU matière",
  MAIN_DOEUVRE: "Non stockable · UoM H · DPU MO",
  LOCATION: "Non stockable · UoM H · budget location",
};

const NAV: Array<{ id: ViewId; label: string }> = [
  { id: "liste", label: "Liste" },
  { id: "fiche-create", label: "Création" },
  { id: "fiche-matiere", label: "Fiche matière" },
  { id: "fiche-mo", label: "Fiche MO" },
  { id: "familles", label: "Familles" },
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
        minHeight: 480,
        position: "relative",
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
            Inventaire · Catalogue
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

function Field({
  label,
  value,
  hint,
  required,
  readonly,
  wide,
}: {
  label: string;
  value: string;
  hint?: string;
  required?: boolean;
  readonly?: boolean;
  wide?: boolean;
}) {
  const t = useHostTheme();
  return (
    <div style={{ flex: wide ? "1 1 100%" : "1 1 45%", minWidth: 160 }}>
      <Text size="small" tone="secondary">
        {label}
        {required ? " *" : ""}
      </Text>
      <div
        style={{
          marginTop: 4,
          padding: "8px 10px",
          border: `1px solid ${t.stroke.tertiary}`,
          borderRadius: 6,
          background: readonly ? t.bg.chrome : t.bg.editor,
          opacity: readonly ? 0.85 : 1,
        }}
      >
        <Text size="small">{value || "—"}</Text>
      </div>
      {hint ? (
        <Text size="small" tone="tertiary">
          {hint}
        </Text>
      ) : null}
    </div>
  );
}

function ListeView({ onOpen }: { onOpen: () => void }) {
  const t = useHostTheme();
  return (
    <FrameShell title="Articles — liste">
      <div style={{ padding: 14 }}>
        <Row gap={8} align="center" justify="space-between" wrap>
          <Row gap={8} align="center" wrap>
            <Pill tone="neutral" size="sm">
              Filtre nature
            </Pill>
            <Pill tone="neutral" size="sm">
              Filtre famille
            </Pill>
            <Pill tone="neutral" size="sm">
              Stockable oui/non
            </Pill>
          </Row>
          <Button onClick={onOpen}>+ Nouvel article</Button>
        </Row>
        <Spacer size={12} />
        <div
          style={{
            border: `1px solid ${t.stroke.tertiary}`,
            borderRadius: 6,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 0,
              padding: "8px 12px",
              background: t.bg.chrome,
              borderBottom: `1px solid ${t.stroke.tertiary}`,
            }}
          >
            {["Code", "Désignation", "Nature", "Famille", "Stock"].map((h) => (
              <div key={h} style={{ flex: 1 }}>
                <Text size="small" weight="semibold" tone="secondary">
                  {h}
                </Text>
              </div>
            ))}
          </div>
          {LIST_ROWS.map((r) => (
            <div
              key={r.code}
              role="button"
              tabIndex={0}
              onClick={onOpen}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 12px",
                borderBottom: `1px solid ${t.stroke.tertiary}`,
                background: r.selected ? t.bg.chrome : undefined,
                cursor: "pointer",
              }}
            >
              <div style={{ flex: 1 }}>
                <Text size="small">{r.code}</Text>
              </div>
              <div style={{ flex: 1 }}>
                <Text size="small">{r.name}</Text>
              </div>
              <div style={{ flex: 1 }}>
                <Pill size="sm" tone={r.stockable ? "info" : "neutral"}>
                  {r.nature}
                </Pill>
              </div>
              <div style={{ flex: 1 }}>
                <Text size="small" tone="secondary">
                  {r.famille}
                </Text>
              </div>
              <div style={{ flex: 1 }}>
                <Text size="small">{r.stockable ? "oui" : "non"}</Text>
              </div>
            </div>
          ))}
        </div>
        <Spacer size={10} />
        <Text size="small" tone="tertiary">
          État vide (0 résultat) : message + CTA « Nouvel article » / « Import CSV »
        </Text>
      </div>
    </FrameShell>
  );
}

function StickyFooter({
  canSave,
  onSave,
}: {
  canSave: boolean;
  onSave: () => void;
}) {
  const t = useHostTheme();
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        padding: "10px 14px",
        borderTop: `1px solid ${t.stroke.tertiary}`,
        background: t.bg.chrome,
        display: "flex",
        justifyContent: "flex-end",
        gap: 8,
      }}
    >
      <Button variant="secondary">Annuler</Button>
      <Button disabled={!canSave} onClick={onSave}>
        Enregistrer
      </Button>
    </div>
  );
}

function FicheView({
  mode,
  onSave,
}: {
  mode: "create" | "matiere" | "mo";
  onSave: () => void;
}) {
  const isMo = mode === "mo";
  const isCreate = mode === "create";
  const nature = isMo ? "MAIN_DOEUVRE" : isCreate ? "" : "MATIERE";
  const dirty = isCreate || mode === "matiere";
  const canSave = !isCreate || Boolean(nature);

  return (
    <FrameShell
      title={
        isCreate
          ? "Article — création"
          : isMo
            ? "Article — MAIN_DOEUVRE"
            : "Article — MATIERE (dirty)"
      }
    >
      <div style={{ padding: 14, paddingBottom: 72 }}>
        <Row gap={8} align="center" justify="space-between" wrap>
          <Stack gap={4}>
            <Text weight="semibold">
              {isCreate
                ? "Nouvel article"
                : isMo
                  ? "MO-OQ · Ouvrier qualifié"
                  : "CIM-325 · Ciment CPJ 32,5 R"}
            </Text>
            <Row gap={6} align="center">
              {dirty ? (
                <Pill size="sm" tone="warning">
                  Non enregistré
                </Pill>
              ) : (
                <Pill size="sm" tone="success">
                  Enregistré
                </Pill>
              )}
              {nature ? (
                <Pill size="sm" tone="info">
                  {nature}
                </Pill>
              ) : (
                <Pill size="sm" tone="warning">
                  Nature requise
                </Pill>
              )}
            </Row>
          </Stack>
          <Row gap={8}>
            <Button variant="secondary">Import IA</Button>
            <Button variant="secondary">Saisie manuelle</Button>
          </Row>
        </Row>

        <Spacer size={12} />
        <Callout tone="info" title="Deux axes disjoints">
          Nature = comportement système (enum figé). Famille = classement d’appro
          (arbre libre). Lots d’usage = où on l’emploie (0..N) — pas une 2ᵉ famille.
        </Callout>
        <Spacer size={12} />

        <H3>Identité</H3>
        <Spacer size={8} />
        <Row gap={12} wrap>
          <Field
            label="Code"
            value={isCreate ? "" : isMo ? "MO-OQ" : "CIM-325"}
            required
            readonly={!isCreate}
          />
          <Field
            label="Désignation"
            value={
              isCreate ? "" : isMo ? "Ouvrier qualifié" : "Ciment CPJ 32,5 R"
            }
            required
          />
          <Field
            label="Description"
            value={isCreate ? "" : "Conforme CPS type"}
            wide
          />
        </Row>

        <Spacer size={16} />
        <H3>Classification</H3>
        <Spacer size={8} />
        <Row gap={12} wrap>
          <Field
            label="Nature"
            value={nature || "(choisir)"}
            required
            hint={nature ? NATURE_HINTS[nature] : "Pilote stock / DPU / budget"}
          />
          <Field
            label="Famille d’appro"
            value={
              isCreate
                ? ""
                : isMo
                  ? "Main d'œuvre → Qualifiée"
                  : "Liants → Ciment"
            }
            required
            hint="Arbre 2 niveaux — zéro comportement"
          />
          <Field
            label="Lots d’usage"
            value={isMo ? "—" : "Gros œuvre, VRD"}
            hint="Optionnel · multi · hors famille"
            wide
          />
        </Row>

        <Spacer size={16} />
        <H3>Unité & prix</H3>
        <Spacer size={8} />
        <Row gap={12} wrap>
          <Field
            label="Unité"
            value={isMo ? "H" : isCreate ? "" : "T"}
            required
            hint={isMo ? "Défaut nature MO = H" : undefined}
          />
          <Field
            label="Prix unitaire HT"
            value={isMo ? "45,00" : isCreate ? "" : "1 250,00"}
          />
          <Field
            label="Poste budget"
            value={isMo ? "MO" : "MATERIAUX"}
            readonly
            hint="Dérivé de la nature · dérogation explicite seulement"
          />
          <Field
            label="Stockable"
            value={isMo ? "Non" : "Oui"}
            readonly
            hint="Flag nature — non éditable"
          />
        </Row>

        {!isMo && !isCreate ? (
          <>
            <Spacer size={16} />
            <Callout tone="warning" title="Gate enregistrement">
              Nature + famille + UoM + code uniques (tenant) requis. Changer la
              nature d’un article déjà mouvementé → refus (ART-R07).
            </Callout>
          </>
        ) : null}

        <StickyFooter canSave={canSave} onSave={onSave} />
      </div>
    </FrameShell>
  );
}

function FamillesView() {
  const t = useHostTheme();
  const roots = [
    { code: "LIANTS", label: "Liants", kids: ["Ciment", "Chaux / plâtre"] },
    { code: "GRANULATS", label: "Granulats", kids: ["Sable", "Gravier"] },
    {
      code: "MAIN_DOEUVRE_FAM",
      label: "Main d'œuvre",
      kids: ["Encadrement", "Qualifiée", "Manoeuvre"],
    },
  ];
  return (
    <FrameShell title="Configuration — Familles d’appro">
      <div style={{ padding: 14 }}>
        <Row gap={8} justify="space-between" align="center">
          <Text weight="semibold">Arbre familles (2 niveaux max)</Text>
          <Button>+ Famille</Button>
        </Row>
        <Spacer size={12} />
        <Callout tone="neutral" title="Hors scope de cet écran">
          Pas de natures ici (enum API lecture seule). Pas de « types d’articles ».
          Lots d’ouvrage ≠ familles.
        </Callout>
        <Spacer size={12} />
        {roots.map((r) => (
          <div
            key={r.code}
            style={{
              marginBottom: 10,
              padding: 10,
              border: `1px solid ${t.stroke.tertiary}`,
              borderRadius: 6,
            }}
          >
            <Text weight="semibold">{r.label}</Text>
            <Spacer size={6} />
            {r.kids.map((k) => (
              <div key={k} style={{ paddingLeft: 16 }}>
                <Text size="small" tone="secondary">
                  └ {k}
                </Text>
              </div>
            ))}
          </div>
        ))}
      </div>
    </FrameShell>
  );
}

export default function ArticlesFicheWireframe() {
  const [view, setView] = useCanvasState<ViewId>("view", "liste");

  return (
    <Stack gap={20} style={{ padding: 24, maxWidth: 960 }}>
      <Stack gap={6}>
        <H1>Articles — wireframe contrat (V1)</H1>
        <Text tone="secondary">
          Flux mince : créer / classer un article (nature + famille + lots
          d’usage). AI-first import avec fallback manuel. Statut produit :
          non-contracté jusqu’à validation explicite.
        </Text>
      </Stack>

      <Row gap={8} wrap>
        {NAV.map((item) => (
          <span key={item.id}>
            <Button
              variant={view === item.id ? "primary" : "secondary"}
              onClick={() => setView(item.id)}
            >
              {item.label}
            </Button>
          </span>
        ))}
      </Row>

      {view === "liste" ? (
        <ListeView onOpen={() => setView("fiche-matiere")} />
      ) : null}
      {view === "fiche-create" ? (
        <FicheView mode="create" onSave={() => setView("liste")} />
      ) : null}
      {view === "fiche-matiere" ? (
        <FicheView mode="matiere" onSave={() => setView("liste")} />
      ) : null}
      {view === "fiche-mo" ? (
        <FicheView mode="mo" onSave={() => setView("liste")} />
      ) : null}
      {view === "familles" ? <FamillesView /> : null}

      <Divider />
      <H2>Décisions UX (à valider)</H2>
      <Stack gap={8}>
        <Text>
          1. Nature en premier sur la fiche — les flags (stockable, UoM défaut,
          poste budget) se dérivent immédiatement.
        </Text>
        <Text>
          2. Poste budget en lecture seule par défaut ; dérogation = action
          explicite (pas un champ libre silencieux).
        </Text>
        <Text>
          3. CTA long formulaire en footer sticky (Enregistrer) — dirty visible.
        </Text>
        <Text>
          4. Import IA propose nature/famille ; l’utilisateur confirme ou bascule
          saisie manuelle — jamais IA-only.
        </Text>
        <Text>
          5. Écran « Types d’articles » retiré du nav (nature = enum, pas table
          tenant).
        </Text>
        <Text>
          6. Liste : colonnes Nature + Famille + badge stockable dérivé — filtre
          sur les trois.
        </Text>
      </Stack>

      <Callout tone="warning" title="Gate produit">
        Ce canvas n’est pas validé. Après OK humain → sync Git + kind:spec done
        + lots tasks. Code existant (ERP-18…) = historique, pas preuve de
        contrat.
      </Callout>
    </Stack>
  );
}
