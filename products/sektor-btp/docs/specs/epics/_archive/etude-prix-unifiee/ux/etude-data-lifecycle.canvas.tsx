import {
  Callout,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Grid,
  H1,
  H2,
  H3,
  Pill,
  Row,
  Spacer,
  Stack,
  Stat,
  Table,
  Text,
  Button,
  useCanvasState,
  useHostTheme,
} from "cursor/canvas";

type StageId =
  | "create"
  | "upload"
  | "extract"
  | "validate"
  | "chiffrage"
  | "gates"
  | "devis"
  | "chantier";

const STAGES: Array<{
  id: StageId;
  n: number;
  title: string;
  short: string;
  mutates: string;
  status: string;
}> = [
  {
    id: "create",
    n: 0,
    title: "Création dossier",
    short: "Orchestrateur vide",
    mutates: "DossierEtude",
    status: "BROUILLON",
  },
  {
    id: "upload",
    n: 1,
    title: "Upload pièces",
    short: "BDP + CPS",
    mutates: "DossierDocument, Cps*",
    status: "BROUILLON",
  },
  {
    id: "extract",
    n: 2,
    title: "Extraction BDP",
    short: "Draft JSON",
    mutates: "DocumentExtractionJob.resultJson",
    status: "BROUILLON",
  },
  {
    id: "validate",
    n: 3,
    title: "Validation → tree",
    short: "Lignes relationnelles",
    mutates: "Dpgf + DpgfNoeud",
    status: "BROUILLON → EN_ETUDE",
  },
  {
    id: "chiffrage",
    n: 4,
    title: "Chiffrage postes",
    short: "FOURNI / DECOMPOSE",
    mutates: "DpgfNoeud, PrixDpu, ComposantDpu",
    status: "EN_ETUDE",
  },
  {
    id: "gates",
    n: 5,
    title: "Agrégation & gates",
    short: "Totaux + verrous",
    mutates: "Dpgf totals, status",
    status: "EN_VALIDATION → VALIDEE",
  },
  {
    id: "devis",
    n: 6,
    title: "Génération devis",
    short: "Projection commerciale",
    mutates: "Devis + DevisLigne",
    status: "DEVIS_GENERE",
  },
  {
    id: "chantier",
    n: 7,
    title: "Chantier",
    short: "Aval (lot 7)",
    mutates: "ChantierLot / PosteBudgetaire",
    status: "CONVERTIE (cible)",
  },
];

/** Exemple canonique : 2 lots × 1 sous-lot × 1 poste */
const EXAMPLE_NODES = [
  {
    id: "l1",
    parent: null,
    type: "LOT",
    code: "01",
    libelle: "Gros œuvre",
    qte: null as number | null,
    unite: null as string | null,
  },
  {
    id: "s1",
    parent: "l1",
    type: "SOUS_LOT",
    code: "01.01",
    libelle: "Béton armé",
    qte: null,
    unite: null,
  },
  {
    id: "a1",
    parent: "s1",
    type: "ARTICLE",
    code: "01.01.10",
    libelle: "Béton B25 semelles",
    qte: 45,
    unite: "m³",
  },
  {
    id: "l2",
    parent: null,
    type: "LOT",
    code: "02",
    libelle: "Second œuvre",
    qte: null,
    unite: null,
  },
  {
    id: "s2",
    parent: "l2",
    type: "SOUS_LOT",
    code: "02.01",
    libelle: "Cloisons",
    qte: null,
    unite: null,
  },
  {
    id: "a2",
    parent: "s2",
    type: "ARTICLE",
    code: "02.01.10",
    libelle: "Cloison BA13",
    qte: 120,
    unite: "m²",
  },
] as const;

const DRAFT_JSON = `{
  "arbre": [
    { "type": "LOT", "code": "01", "libelle": "Gros œuvre",
      "enfants": [
        { "type": "SOUS_LOT", "code": "01.01", "libelle": "Béton armé",
          "enfants": [
            { "type": "ARTICLE", "code": "01.01.10",
              "libelle": "Béton B25 semelles",
              "quantite": 45, "unite": "m³" }
          ]}]},
    { "type": "LOT", "code": "02", "libelle": "Second œuvre",
      "enfants": [
        { "type": "SOUS_LOT", "code": "02.01", "libelle": "Cloisons",
          "enfants": [
            { "type": "ARTICLE", "code": "02.01.10",
              "libelle": "Cloison BA13",
              "quantite": 120, "unite": "m²" }
          ]}]}
  ],
  "articleCount": 2,
  "outcome": "REVIEW_REQUIRED"
}`;

function indentFor(parent: string | null): number {
  if (!parent) return 0;
  if (parent === "l1" || parent === "l2") return 1;
  return 2;
}

function typeTone(type: string): "neutral" | "info" | "success" {
  if (type === "LOT") return "info";
  if (type === "SOUS_LOT") return "neutral";
  return "success";
}

export default function EtudeDataLifecycleCanvas() {
  const t = useHostTheme();
  const [stage, setStage] = useCanvasState<StageId>("stage", "create");
  const idx = STAGES.findIndex((s) => s.id === stage);
  const current = STAGES[idx]!;

  const go = (id: StageId) => setStage(id);
  const prev = () => {
    if (idx > 0) setStage(STAGES[idx - 1]!.id);
  };
  const next = () => {
    if (idx < STAGES.length - 1) setStage(STAGES[idx + 1]!.id);
  };

  return (
    <Stack gap={20} style={{ padding: 20, maxWidth: 1100 }}>
      <Stack gap={6}>
        <H1>Cycle de vie données — Étude / chiffrage</H1>
        <Text tone="secondary">
          Exemple fixe : 2 lots → 1 sous-lot chacun → 1 poste (ARTICLE). Source de
          vérité live = lignes relationnelles (`parent_id`) ; JSON = brouillon /
          snapshot seulement.
        </Text>
      </Stack>

      <Row gap={8} wrap>
        {STAGES.map((s) => (
          <span key={s.id}>
            <Button
              variant={s.id === stage ? "primary" : "secondary"}
              onClick={() => go(s.id)}
            >
              {s.n}. {s.short}
            </Button>
          </span>
        ))}
      </Row>

      <Row gap={12} align="center">
        <Button variant="secondary" disabled={idx === 0} onClick={prev}>
          Précédent
        </Button>
        <Text weight="semibold">
          Étape {current.n} — {current.title}
        </Text>
        <Pill tone="info">{current.status}</Pill>
        <Button
          variant="secondary"
          disabled={idx === STAGES.length - 1}
          onClick={next}
        >
          Suivant
        </Button>
      </Row>

      <Grid columns={3} gap={12}>
        <Stat value={String(current.n)} label="Étape" />
        <Stat value="6 nœuds" label="Exemple (2×2×1)" />
        <Stat value={current.mutates.split(",")[0]!} label="Mutation principale" />
      </Grid>

      {stage === "create" && <StageCreate />}
      {stage === "upload" && <StageUpload />}
      {stage === "extract" && <StageExtract themeStroke={t.stroke.tertiary} />}
      {stage === "validate" && <StageValidate />}
      {stage === "chiffrage" && <StageChiffrage />}
      {stage === "gates" && <StageGates />}
      {stage === "devis" && <StageDevis />}
      {stage === "chantier" && <StageChantier />}

      <Divider />
      <Stack gap={8}>
        <H2>Fil conducteur (toutes étapes)</H2>
        <Table
          headers={["Étape", "Ce qui existe", "Ce qui n’existe pas encore"]}
          rows={STAGES.map((s) => [
            `${s.n}. ${s.title}`,
            s.mutates,
            s.id === "create"
              ? "Docs, tree, prix"
              : s.id === "upload"
                ? "Tree DPGF"
                : s.id === "extract"
                  ? "Lignes DpgfNoeud (encore draft)"
                  : s.id === "validate"
                    ? "Prix DPU / composants"
                    : s.id === "chiffrage"
                      ? "Devis figé"
                      : s.id === "gates"
                        ? "Devis / chantier"
                        : s.id === "devis"
                          ? "Lots chantier réels"
                          : "—",
          ])}
        />
      </Stack>

      <Callout tone="info" title="Décision modèle (rappel)">
        Le tree n’est pas un document Mongo. L’extraction produit un JSON
        temporaire ; la validation matérialise des `DpgfNoeud` avec `parent_id`.
        Le chiffrage mute un nœud (et son `PrixDpu`) sans réécrire l’arbre entier.
      </Callout>
    </Stack>
  );
}

function StageCreate() {
  return (
    <Stack gap={12}>
      <H2>0 — Création dossier</H2>
      <Text>
        L’utilisateur crée un dossier étude. Aucun bordereau, aucun prix.
      </Text>
      <Grid columns={2} gap={12}>
        <Card>
          <CardHeader>Entité</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <Row gap={8}>
                <Text weight="semibold">DossierEtude</Text>
                <Pill size="sm">dossiers_etude</Pill>
              </Row>
              <Text tone="secondary" size="small">
                status=BROUILLON · currentStep=1 · FG/marge/TVA defaults ·
                dpgfId=null · devisGenereId=null
              </Text>
            </Stack>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>Exemple</CardHeader>
          <CardBody>
            <Stack gap={6}>
              <Text weight="semibold">DOS-2026-0042</Text>
              <Text tone="secondary" size="small">
                Objet : Résidence Al Amal — lot gros œuvre + cloisons
              </Text>
              <Text tone="secondary" size="small">
                Tree : ∅ (0 nœuds)
              </Text>
            </Stack>
          </CardBody>
        </Card>
      </Grid>
    </Stack>
  );
}

function StageUpload() {
  return (
    <Stack gap={12}>
      <H2>1 — Upload pièces marché</H2>
      <Text>
        Dépôt BDP (bordereau) + CPS. Toujours pas d’arbre chiffrable. Le CPS peut
        déclencher une indexation (`CpsDocument` / `CpsSection`) en parallèle.
      </Text>
      <Grid columns={2} gap={12}>
        <Card>
          <CardHeader trailing={<Pill tone="warning" size="sm">Gate 1</Pill>}>
            Documents
          </CardHeader>
          <CardBody>
            <Table
              headers={["Fichier", "Type", "Effet"]}
              rows={[
                ["BDP_AlAmal.xlsx", "BORDEREAU", "Stocké — extraction à lancer"],
                ["CPS_marche.pdf", "CPS", "Index CPS auto + cpsDocumentId"],
              ]}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>État tree</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <Text tone="secondary">
                Aucune ligne `dpgf_noeuds`. L’UI pièces ne montre que les slots.
              </Text>
              <Callout tone="neutral" title="Fallback manuel">
                Sans BDP extractable : `assurerBordereauManuel` → DPGF vide, saisie
                à la main (même modèle de nœuds plus tard).
              </Callout>
            </Stack>
          </CardBody>
        </Card>
      </Grid>
    </Stack>
  );
}

function StageExtract({ themeStroke }: { themeStroke: string }) {
  return (
    <Stack gap={12}>
      <H2>2 — Extraction → draft JSON</H2>
      <Text>
        Job async `BORDEREAU_EXTRACT`. Succès = brouillon dans{" "}
        <Text as="span" weight="semibold">
          resultJson
        </Text>{" "}
        —{" "}
        <Text as="span" weight="semibold">
          aucune écriture DPGF
        </Text>
        .
      </Text>
      <Grid columns={2} gap={12}>
        <Card>
          <CardHeader trailing={<Pill tone="warning" size="sm">REVIEW_REQUIRED</Pill>}>
            DocumentExtractionJob
          </CardHeader>
          <CardBody>
            <Stack gap={8}>
              <Row gap={8} wrap>
                <Pill size="sm">QUEUED</Pill>
                <Text tone="secondary" size="small">
                  →
                </Text>
                <Pill size="sm">RUNNING</Pill>
                <Text tone="secondary" size="small">
                  →
                </Text>
                <Pill tone="success" size="sm">
                  SUCCEEDED
                </Pill>
              </Row>
              <Text size="small" tone="secondary">
                articleCount=2 · outcome=REVIEW_REQUIRED
              </Text>
            </Stack>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>Arbre logique (pas encore persisté)</CardHeader>
          <CardBody>
            <TreePreview highlight="logical" />
          </CardBody>
        </Card>
      </Grid>
      <Card>
        <CardHeader>Extrait resultJson (simplifié)</CardHeader>
        <CardBody>
          <pre
            style={{
              margin: 0,
              fontSize: 11,
              lineHeight: 1.45,
              whiteSpace: "pre-wrap",
              borderTop: `1px solid ${themeStroke}`,
              paddingTop: 8,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            }}
          >
            {DRAFT_JSON}
          </pre>
        </CardBody>
      </Card>
    </Stack>
  );
}

function StageValidate() {
  return (
    <Stack gap={12}>
      <H2>3 — Validation import → tree relationnel</H2>
      <Text>
        `valider-bordereau` matérialise le draft : crée `Dpgf` + 6 lignes{" "}
        `DpgfNoeud` (adjacency `parent_id`). Articles en mode{" "}
        <Text as="span" weight="semibold">
          FOURNI
        </Text>{" "}
        par défaut, sans DPU.
      </Text>
      <Grid columns={2} gap={12}>
        <Card>
          <CardHeader trailing={<Pill tone="success" size="sm">Live SoT</Pill>}>
            dpgf_noeuds (exemple)
          </CardHeader>
          <CardBody>
            <TreePreview highlight="rows" showIds />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>Table plate (ce qui est en base)</CardHeader>
          <CardBody>
            <Table
              headers={["id", "parent_id", "type", "code", "qté"]}
              rows={EXAMPLE_NODES.map((n) => [
                n.id,
                n.parent ?? "—",
                n.type,
                n.code,
                n.qte != null ? `${n.qte} ${n.unite}` : "—",
              ])}
            />
          </CardBody>
        </Card>
      </Grid>
      <Callout tone="warning" title="Gate 2 — Bordereau">
        ≥1 ARTICLE ; chaque article a unité + qté &gt; 0 ; pas de LOT/SOUS_LOT
        vide ; codes article uniques. Ensuite structure verrouillable
        (`structureVerrouillee`).
      </Callout>
      <Text size="small" tone="secondary">
        Lecture UI : chargement flat + `buildTree()` reconstruit `enfants` en
        mémoire — le document nested n’est jamais la vérité stockée.
      </Text>
    </Stack>
  );
}

function StageChiffrage() {
  return (
    <Stack gap={12}>
      <H2>4 — Chiffrage poste par poste</H2>
      <Text>
        Mutation locale sur un ARTICLE. L’arbre (lots / sous-lots) ne change
        pas. Deux modes sur le même nœud.
      </Text>
      <Grid columns={2} gap={12}>
        <Card>
          <CardHeader trailing={<Pill tone="info" size="sm">FOURNI</Pill>}>
            01.01.10 Béton B25
          </CardHeader>
          <CardBody>
            <Stack gap={8}>
              <Text size="small">
                Mute uniquement `DpgfNoeud` : prixFourniBase, FG%, marge% →
                prixUnitaire, total = qté × PU.
              </Text>
              <Table
                headers={["Champ", "Valeur"]}
                rows={[
                  ["mode", "FOURNI"],
                  ["prixFourniBase", "850 MAD"],
                  ["FG %", "12"],
                  ["Marge %", "15"],
                  ["prixUnitaire", "1 095,80"],
                  ["total (45 m³)", "49 311"],
                  ["prix_dpu_id", "null"],
                ]}
              />
            </Stack>
          </CardBody>
        </Card>
        <Card>
          <CardHeader trailing={<Pill tone="success" size="sm">DECOMPOSE</Pill>}>
            02.01.10 Cloison BA13
          </CardHeader>
          <CardBody>
            <Stack gap={8}>
              <Text size="small">
                Crée `PrixDpu` 1:1 + `ComposantDpu` (rendements). Sync PU / total
                sur le nœud.
              </Text>
              <Table
                headers={["Nature", "Désignation", "Rendement", "PU"]}
                rows={[
                  ["MAT", "Plaque BA13", "2,05", "42"],
                  ["MAT", "Montants", "0,80", "18"],
                  ["MO", "Poseur cloison", "0,35", "160"],
                ]}
              />
              <Text size="small" tone="secondary">
                deboursSec → ×(1+FG)×(1+marge) → prixVenteHt → DpgfNoeud.prixUnitaire
              </Text>
            </Stack>
          </CardBody>
        </Card>
      </Grid>
      <TreePreview highlight="chiffrage" />
      <Callout tone="info" title="Pourquoi pas un document ici">
        Save drawer = UPDATE 1 nœud (+ évent. DPU/composants). Pas de rewrite du
        blob « 2 lots entiers ». Concurrent edit et dirty local restent simples.
      </Callout>
    </Stack>
  );
}

function StageGates() {
  return (
    <Stack gap={12}>
      <H2>5 — Agrégation & gates</H2>
      <Text>
        Les totaux ARTICLE remontent sur SOUS_LOT / LOT / `Dpgf`. Les gates
        lisent des faits queryables (PU, composants, client…), pas un JSON opaque.
      </Text>
      <Grid columns={2} gap={12}>
        <Card>
          <CardHeader>Roll-up exemple</CardHeader>
          <CardBody>
            <Table
              headers={["Nœud", "Rôle", "Total HT"]}
              rows={[
                ["01.01.10", "ARTICLE", "49 311"],
                ["01.01", "SOUS_LOT", "49 311"],
                ["01", "LOT", "49 311"],
                ["02.01.10", "ARTICLE", "18 240"],
                ["02.01", "SOUS_LOT", "18 240"],
                ["02", "LOT", "18 240"],
                ["DPGF", "header", "67 551"],
              ]}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>Gates (blocking)</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <Row gap={8}>
                <Pill tone="success" size="sm">
                  OK
                </Pill>
                <Text size="small">Décomposition — chaque poste PU &gt; 0</Text>
              </Row>
              <Row gap={8}>
                <Pill tone="success" size="sm">
                  OK
                </Pill>
                <Text size="small">Chiffrage — client + FG/marge DECOMPOSE</Text>
              </Row>
              <Row gap={8}>
                <Pill tone="warning" size="sm">
                  WARN
                </Pill>
                <Text size="small">
                  Consultation — composants non CONSULTE (non bloquant)
                </Text>
              </Row>
              <Spacer height={4} />
              <Text size="small" tone="secondary">
                Submit → EN_VALIDATION → approve → VALIDEE
              </Text>
            </Stack>
          </CardBody>
        </Card>
      </Grid>
    </Stack>
  );
}

function StageDevis() {
  return (
    <Stack gap={12}>
      <H2>6 — Génération devis</H2>
      <Text>
        Projection commerciale : ARTICLEs → `DevisLigne`. La structure lot /
        sous-lot peut devenir chapitres ; le DPGF reste la source étude.
      </Text>
      <Grid columns={2} gap={12}>
        <Card>
          <CardHeader>Depuis le tree étude</CardHeader>
          <CardBody>
            <TreePreview highlight="rows" />
          </CardBody>
        </Card>
        <Card>
          <CardHeader trailing={<Pill size="sm">DEVIS_GENERE</Pill>}>
            Devis + lignes
          </CardHeader>
          <CardBody>
            <Table
              headers={["Ligne devis", "Origine", "Qté", "PU"]}
              rows={[
                ["Chap. 01 Gros œuvre", "LOT 01", "—", "—"],
                ["Béton B25 semelles", "ARTICLE 01.01.10", "45", "1 095,80"],
                ["Chap. 02 Second œuvre", "LOT 02", "—", "—"],
                ["Cloison BA13", "ARTICLE 02.01.10", "120", "152,00"],
              ]}
            />
            <Spacer height={8} />
            <Text size="small" tone="secondary">
              DossierEtude.devisGenereId renseigné. Suite commerciale : EMIS →
              APPROUVE (gagné).
            </Text>
          </CardBody>
        </Card>
      </Grid>
    </Stack>
  );
}

function StageChantier() {
  return (
    <Stack gap={12}>
      <H2>7 — Projection chantier</H2>
      <Text>
        Cible documentée (lot 7) : même idée d’adjacency côté chantier. Code
        actuel = stub `chantierGenereId` sur devis APPROUVE — pas encore la
        projection complète.
      </Text>
      <Grid columns={2} gap={12}>
        <Card>
          <CardHeader>Mapping cible</CardHeader>
          <CardBody>
            <Table
              headers={["Étude", "Chantier"]}
              rows={[
                ["LOT 01 / 02", "ChantierLot (parentLotId)"],
                ["SOUS_LOT 01.01 / 02.01", "ChantierLot enfants"],
                ["ARTICLE …10", "PosteBudgetaire"],
                ["ComposantDpu × qté", "BudgetLigne (déboursé)"],
              ]}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>Exemple projeté</CardHeader>
          <CardBody>
            <Stack gap={6}>
              <Text weight="semibold">Chantier — Résidence Al Amal</Text>
              <Text size="small">├─ Lot 01 Gros œuvre</Text>
              <Text size="small">│ └─ 01.01 Béton armé</Text>
              <Text size="small">│ └─ Poste : Béton B25 (budget)</Text>
              <Text size="small">└─ Lot 02 Second œuvre</Text>
              <Text size="small"> └─ 02.01 Cloisons</Text>
              <Text size="small"> └─ Poste : Cloison BA13 (budget)</Text>
              <Spacer height={6} />
              <Pill tone="warning" size="sm">
                CONVERTIE — cible, pas full live
              </Pill>
            </Stack>
          </CardBody>
        </Card>
      </Grid>
      <Callout tone="neutral" title="Même pattern aval">
        Pas de bascule document pour le chantier non plus : lots adjacency +
        postes budget queryables (avancement, sous-traitance, reporting).
      </Callout>
    </Stack>
  );
}

function TreePreview({
  highlight,
  showIds,
}: {
  highlight: "logical" | "rows" | "chiffrage";
  showIds?: boolean;
}) {
  const t = useHostTheme();
  return (
    <Stack gap={4}>
      <H3>
        {highlight === "logical"
          ? "Arbre logique extrait"
          : highlight === "chiffrage"
            ? "Tree live après chiffrage"
            : "Tree assemblé (buildTree)"}
      </H3>
      {EXAMPLE_NODES.map((n) => {
        const pad = indentFor(n.parent) * 16;
        const mode =
          highlight === "chiffrage" && n.id === "a1"
            ? "FOURNI"
            : highlight === "chiffrage" && n.id === "a2"
              ? "DECOMPOSE"
              : null;
        return (
          <div key={n.id}>
            <Row
              gap={8}
              align="center"
              style={{
                paddingLeft: pad,
                paddingTop: 4,
                paddingBottom: 4,
                borderBottom: `1px solid ${t.stroke.tertiary}`,
              }}
            >
              <Pill tone={typeTone(n.type)} size="sm">
                {n.type}
              </Pill>
              <Text weight="semibold" size="small">
                {n.code}
              </Text>
              <Text size="small">{n.libelle}</Text>
              {n.qte != null && (
                <Text size="small" tone="secondary">
                  {n.qte} {n.unite}
                </Text>
              )}
              {showIds && (
                <Text size="small" tone="secondary">
                  id={n.id}
                  {n.parent ? ` ← ${n.parent}` : ""}
                </Text>
              )}
              {mode && (
                <Pill tone={mode === "FOURNI" ? "info" : "success"} size="sm">
                  {mode}
                </Pill>
              )}
            </Row>
          </div>
        );
      })}
    </Stack>
  );
}
