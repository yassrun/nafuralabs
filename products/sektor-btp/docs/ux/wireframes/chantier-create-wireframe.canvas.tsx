import type { ReactNode } from "react";
import {
  Button,
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
  useCanvasState,
  useHostTheme,
} from "cursor/canvas";

type EntryId = "A" | "B";
type StepId = 0 | 1 | 2 | 3 | 4 | 5;
type ScenarioId = "ok" | "ecart" | "no_decompo" | "gate_blocked";
/** Traitement de l’installation de chantier selon le marché. */
type InstallMode = "lot" | "incluse" | "hors_marche";

const STEPS: Array<{ id: StepId; label: string }> = [
  { id: 0, label: "1 · Contexte" },
  { id: 1, label: "2 · Marché + chantier" },
  { id: 2, label: "3 · Projection" },
  { id: 3, label: "4 · Budget" },
  { id: 4, label: "5 · Équipe" },
  { id: 5, label: "6 · Récap" },
];

const LOT_ROWS_BASE: Array<[string, string, string, string]> = [
  ["01", "Gros œuvre", "LOT", "—"],
  ["01.01", "  Béton armé", "SOUS_LOT", "—"],
  ["01.01.10", "  Béton B25 semelles", "ARTICLE", "125 000"],
  ["01.01.20", "  Ferraillage HA", "ARTICLE", "84 500"],
  ["02", "Second œuvre", "LOT", "—"],
  ["02.01.10", "  Cloisons BA13", "ARTICLE", "42 000"],
];

const LOT_INSTALL: Array<[string, string, string, string]> = [
  ["00", "Installation de chantier", "LOT", "—"],
  ["00.01", "  Base vie / clôture / branchements", "ARTICLE", "45 000"],
];

const BUDGET_ROWS: Array<[string, string, string]> = [
  ["MATERIAUX", "Déboursé matières", "98 400"],
  ["MAIN_OEUVRE", "Déboursé MO", "72 100"],
  ["MATERIEL", "Déboursé matériel", "18 200"],
  ["SOUS_TRAITANCE", "Déboursé ST", "12 800"],
];

/** Rôles d’équipe — core vs optionnels selon taille / type chantier. */
const ROLE_CORE = [
  ["Chef de chantier", "Karim Benali (EMP-014)", "requis"],
  ["Conducteur de travaux", "Sara El Fassi (EMP-008)", "requis"],
] as const;

const ROLE_OPTIONAL = [
  ["Magasinier", "Youssef Amrani (EMP-022)", "recommandé si stock chantier"],
  ["Pointeur", "— non affecté —", "recommandé si pointage quotidien"],
  ["Ingénieur", "— optionnel —", "selon complexité"],
] as const;

function Field({
  label,
  value,
  locked,
  hint,
}: {
  label: string;
  value: string;
  locked?: boolean;
  hint?: string;
}) {
  const t = useHostTheme();
  return (
    <Stack gap={4}>
      <Row gap={6} align="center">
        <Text size="small" tone="tertiary" weight="semibold">
          {label}
        </Text>
        {locked ? (
          <Pill tone="neutral" size="sm">
            verrouillé
          </Pill>
        ) : null}
      </Row>
      <div
        style={{
          padding: "8px 10px",
          border: `1px solid ${t.stroke.secondary}`,
          borderRadius: 6,
          background: locked ? t.fill.tertiary : t.bg.editor,
        }}
      >
        <Text size="small">{value}</Text>
      </div>
      {hint ? (
        <Text size="small" tone="tertiary">
          {hint}
        </Text>
      ) : null}
    </Stack>
  );
}

function WizardChrome({
  entry,
  step,
  children,
  onPrev,
  onNext,
  nextDisabled,
  nextLabel,
}: {
  entry: EntryId;
  step: StepId;
  children: ReactNode;
  onPrev: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
}) {
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
        <Row gap={8} align="center" justify="space-between" wrap>
          <Row gap={8} align="center">
            <Text size="small" weight="semibold">
              Créer le marché et le chantier
            </Text>
            <Pill tone={entry === "A" ? "info" : "warning"} size="sm">
              {entry === "A" ? "Entrée A · Depuis devis" : "Entrée B · Marché existant"}
            </Pill>
          </Row>
          <Text size="small" tone="tertiary">
            Étape {step + 1} / 6 · code prévu CH-2026-015
          </Text>
        </Row>
      </div>

      <div
        style={{
          display: "flex",
          gap: 4,
          padding: "10px 14px",
          borderBottom: `1px solid ${t.stroke.tertiary}`,
          background: t.fill.tertiary,
        }}
      >
        {STEPS.map((s) => (
          <div
            key={s.id}
            style={{
              flex: 1,
              height: 6,
              borderRadius: 3,
              background:
                step >= s.id ? t.accent.primary : t.stroke.secondary,
            }}
          />
        ))}
      </div>

      <div style={{ padding: 16 }}>{children}</div>

      <div
        style={{
          padding: "12px 14px",
          borderTop: `1px solid ${t.stroke.tertiary}`,
          background: t.bg.chrome,
        }}
      >
        <Row gap={8} align="center" justify="space-between">
          <Button variant="secondary" onClick={onPrev} disabled={step === 0}>
            Précédent
          </Button>
          <Button
            variant="primary"
            onClick={onNext}
            disabled={nextDisabled}
          >
            {nextLabel ?? (step === 5 ? "Créer le marché et le chantier" : "Suivant")}
          </Button>
        </Row>
      </div>
    </div>
  );
}

function StepContexte({
  entry,
  blocked,
}: {
  entry: EntryId;
  blocked: boolean;
}) {
  return (
    <Stack gap={14}>
      <Stack gap={4}>
        <H3>Contexte source</H3>
        <Text size="small" tone="secondary">
          Lecture seule — la source est fixée par le parcours (CTA dossier).
        </Text>
      </Stack>

      {blocked ? (
        <Callout tone="danger" title="Conversion bloquée">
          Client manquant sur le dossier. Compléter le dossier avant d’ouvrir
          ce wizard (gate d’entrée).
        </Callout>
      ) : (
        <Callout tone="info" title="Gate OK">
          {entry === "A"
            ? "Dossier GAGNE + devis lié. Ouverture autorisée."
            : "Dossier MARCHE_EXISTANT avec bordereau et montant. Ouverture autorisée."}
        </Callout>
      )}

      <Grid columns={2} gap={12}>
        <Card>
          <CardHeader trailing={<Pill size="sm">{entry === "A" ? "A" : "B"}</Pill>}>
            Affaire
          </CardHeader>
          <CardBody>
            <Stack gap={8}>
              <Stat
                value={entry === "A" ? "ETU-2026-042" : "ETU-2026-088"}
                label="N° dossier"
              />
              {entry === "A" ? (
                <Stat value="DEV-2026-018" label="N° devis" />
              ) : (
                <Stat value="MARCHE_EXISTANT" label="Origine" />
              )}
              <Text size="small">
                Extension bâtiment administratif — R+2
              </Text>
              <Text size="small" tone="secondary">
                Lien · Voir le dossier
                {entry === "A" ? " · Voir le devis" : ""}
              </Text>
            </Stack>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>Références commerciales</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <Stat
                value={blocked ? "—" : "Atlas Immobilier SA"}
                label="Client"
              />
              <Stat
                value={entry === "A" ? "1 240 000 MAD HT" : "980 000 MAD HT"}
                label={entry === "A" ? "Total devis HT" : "Montant contractuel HT"}
              />
              <Text size="small" tone="tertiary">
                Ces montants alimentent l’étape 2 (montant attribué éditable).
              </Text>
            </Stack>
          </CardBody>
        </Card>
      </Grid>
    </Stack>
  );
}

function StepMarcheChantier({
  entry,
  ecart,
  installMode,
}: {
  entry: EntryId;
  ecart: boolean;
  installMode: InstallMode;
}) {
  const installLabel =
    installMode === "lot"
      ? "Facturée · lot / article au BDP"
      : installMode === "incluse"
        ? "Incluse dans le prix (pas de ligne séparée)"
        : "Hors marché · coût interne / budget déboursé";

  return (
    <Stack gap={14}>
      <Stack gap={4}>
        <H3>Marché + chantier</H3>
        <Text size="small" tone="secondary">
          Un seul écran — création atomique en fin de wizard.
        </Text>
      </Stack>

      {ecart ? (
        <Callout tone="warning" title="Écart montant attribué / devis">
          Attribué 1 180 000 MAD HT vs devis 1 240 000 (−4,8 %). Autorisé —
          warning visible. Confirmer avant de continuer.
        </Callout>
      ) : null}

      <Callout
        tone="info"
        title="Installation de chantier — selon le marché"
      >
        Traitement choisi : {installLabel}. Détecté depuis le BDP si un lot
        « Installation » existe ; sinon l’utilisateur choisit. Pas de règle
        unique pour tous les marchés.
      </Callout>

      <Grid columns={2} gap={14}>
        <Stack gap={10}>
          <Text weight="semibold" size="small">
            Bloc marché (contrat)
          </Text>
          <Field
            label="Réf. marché"
            value={entry === "A" ? "MR-2026-ATLAS-07" : "AO-2025-PREF-12"}
          />
          <Field label="Type" value="Public · CCAG travaux" />
          <Field
            label="Montant HT attribué"
            value={ecart ? "1 180 000" : entry === "A" ? "1 240 000" : "980 000"}
            hint="Peut différer du devis (négociation)."
          />
          <Field label="Installation de chantier" value={installLabel} />
          <Field label="TVA %" value="20" />
          <Field label="RG %" value="10" />
          <Field label="Avance %" value="10" />
          <Field
            label="Client / MOA"
            value="Atlas Immobilier SA"
            locked={!ecart}
            hint="Éditable seulement si manquant sur la source."
          />
          <Field label="MOE" value="Cabinet Nour Architectes" />
          <Text size="small" tone="secondary">
            Cautions · ☐ Soumission · ☑ Bonne fin · ☐ Restitution avance
          </Text>
        </Stack>

        <Stack gap={10}>
          <Text weight="semibold" size="small">
            Bloc chantier (exécution)
          </Text>
          <Field
            label="Nom"
            value="Extension Atlas — R+2 Casablanca"
          />
          <Field label="Code (preview)" value="CH-2026-015" locked />
          <Field label="Statut initial" value="EN_PREPARATION" />
          <Field
            label="Adresse"
            value="Bd de la Corniche, Casablanca"
          />
          <Field label="Ville" value="Casablanca" />
          <Field label="Date début" value="2026-09-15" />
          <Field label="Date fin prévue" value="2027-06-30" />
          <Field
            label="Budget HT (= montant marché)"
            value={ecart ? "1 180 000" : entry === "A" ? "1 240 000" : "980 000"}
            locked
            hint="Pas un 4e chiffre inventé — aligné sur le marché."
          />
        </Stack>
      </Grid>
    </Stack>
  );
}

function StepProjection({ installMode }: { installMode: InstallMode }) {
  const rows =
    installMode === "lot"
      ? [...LOT_INSTALL, ...LOT_ROWS_BASE]
      : LOT_ROWS_BASE;
  const articleCount = installMode === "lot" ? 4 : 3;

  return (
    <Stack gap={14}>
      <Stack gap={4}>
        <H3>Projection bordereau → lots</H3>
        <Text size="small" tone="secondary">
          Aperçu de ce qui sera créé : LOT / SOUS_LOT → ChantierLot, ARTICLE →
          PosteBudgetaire.
        </Text>
      </Stack>

      {installMode === "lot" ? (
        <Callout tone="info" title="Lot Installation présent">
          Le BDP contient un lot « Installation de chantier » — projeté comme
          les autres (facturable / situations).
        </Callout>
      ) : installMode === "incluse" ? (
        <Callout tone="neutral" title="Installation incluse">
          Pas de ligne séparée au BDP. Coût éventuel à suivre en déboursé
          interne (budget), pas en vente client.
        </Callout>
      ) : (
        <Callout tone="warning" title="Installation hors marché">
          Non facturée au client. Créer une ligne budget « Installation »
          (déboursé) sans poste de vente — ou ignorer si négligeable.
        </Callout>
      )}

      <Callout tone="info" title="Lecture seule">
        Hiérarchie reprise du DPGF dossier. Pas d’édition structure ici —
        corriger dans l’étude si besoin, puis relancer.
      </Callout>

      <Table
        headers={["Code", "Libellé", "Type", "Total HT (MAD)"]}
        rows={rows}
        rowTone={rows.map((r) =>
          r[2] === "LOT" ? ("info" as const) : undefined,
        )}
      />

      <Row gap={16} wrap>
        <Stat value={String(rows.length)} label="Nœuds projetés" />
        <Stat value={String(articleCount)} label="Articles → postes" />
        <Stat
          value={installMode === "lot" ? "296 500" : "251 500"}
          label="Σ articles HT (extrait)"
        />
      </Row>
    </Stack>
  );
}

function StepBudget({ noDecompo }: { noDecompo: boolean }) {
  return (
    <Stack gap={14}>
      <Stack gap={4}>
        <H3>Budget prévisionnel (déboursé)</H3>
        <Text size="small" tone="secondary">
          Ventilation par nature de composant. FG et marge n’entrent pas dans
          le budget d’exécution.
        </Text>
      </Stack>

      {noDecompo ? (
        <Callout tone="warning" title="Pas de décomposition complète">
          Impossible de ventiler le déboursé. Vous pouvez créer marché +
          chantier + lots sans budget ventilé, puis compléter plus tard. Pas
          de blocage dur.
        </Callout>
      ) : (
        <>
          <Table
            headers={["Rubrique", "Libellé", "Prévisionnel HT (MAD)"]}
            rows={BUDGET_ROWS}
          />
          <Row gap={16} wrap>
            <Stat value="201 500" label="Σ déboursé HT" />
            <Stat value="≠ vente" label="Hors FG / marge" />
          </Row>
        </>
      )}
    </Stack>
  );
}

function StepEquipe() {
  return (
    <Stack gap={14}>
      <Stack gap={4}>
        <H3>Équipe chantier</H3>
        <Text size="small" tone="secondary">
          Rôles d’affectation — core requis à la création ; optionnels selon
          le chantier (pas une liste RH figée pour tous).
        </Text>
      </Stack>

      <Callout tone="info" title="Modèle produit">
        Chef + conducteur = socle. Magasinier si stock / BL sur site. Pointeur
        si pointage quotidien terrain. Autres rôles ajoutables après création
        (affectations).
      </Callout>

      <Text weight="semibold" size="small">
        Rôles core
      </Text>
      <Grid columns={2} gap={12}>
        {ROLE_CORE.map(([label, value, hint]) => (
          <div key={label}>
            <Field label={label} value={value} hint={hint} />
          </div>
        ))}
      </Grid>

      <Text weight="semibold" size="small">
        Rôles optionnels (V1)
      </Text>
      <Grid columns={2} gap={12}>
        {ROLE_OPTIONAL.map(([label, value, hint]) => (
          <div key={label}>
            <Field label={label} value={value} hint={hint} />
          </div>
        ))}
      </Grid>
    </Stack>
  );
}

function StepRecap({
  entry,
  ecart,
  noDecompo,
  installMode,
}: {
  entry: EntryId;
  ecart: boolean;
  noDecompo: boolean;
  installMode: InstallMode;
}) {
  const installShort =
    installMode === "lot"
      ? "facturée (lot BDP)"
      : installMode === "incluse"
        ? "incluse au prix"
        : "hors marché (déboursé interne)";

  return (
    <Stack gap={14}>
      <Stack gap={4}>
        <H3>Récapitulatif</H3>
        <Text size="small" tone="secondary">
          Une transaction : marché + chantier + lots
          {noDecompo ? "" : " + budget"}
          . Échec → rien n’est créé.
        </Text>
      </Stack>

      <Grid columns={3} gap={10}>
        <Card>
          <CardHeader>Source</CardHeader>
          <CardBody>
            <Stack gap={6}>
              <Text size="small">
                {entry === "A" ? "Devis DEV-2026-018" : "Marché existant"}
              </Text>
              <Text size="small" tone="secondary">
                Dossier {entry === "A" ? "ETU-2026-042" : "ETU-2026-088"}
              </Text>
            </Stack>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>Marché</CardHeader>
          <CardBody>
            <Stack gap={6}>
              <Text size="small">MR-2026-ATLAS-07</Text>
              <Text size="small" weight="semibold">
                {ecart ? "1 180 000" : entry === "A" ? "1 240 000" : "980 000"}{" "}
                MAD HT
              </Text>
              <Text size="small" tone="secondary">
                Installation · {installShort}
              </Text>
            </Stack>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>Chantier</CardHeader>
          <CardBody>
            <Stack gap={6}>
              <Text size="small">CH-2026-015</Text>
              <Text size="small" tone="secondary">
                Casablanca · EN_PREPARATION
              </Text>
            </Stack>
          </CardBody>
        </Card>
      </Grid>

      <Stack gap={6}>
        <Text size="small">
          · Projection : lots/postes
          {installMode === "lot" ? " (+ lot Installation)" : ""}
        </Text>
        <Text size="small">
          · Budget :{" "}
          {noDecompo
            ? "non généré (à compléter plus tard)"
            : "4 rubriques déboursé · 201 500 MAD HT"}
        </Text>
        <Text size="small">
          · Équipe : chef + conducteur (+ magasinier / pointeur si saisis)
        </Text>
      </Stack>

      <Callout tone="neutral" title="CTA unique">
        « Créer le marché et le chantier » — pas de création partielle. Après
        succès : redirection fiche chantier + fil d’Ariane étude ↔ chantier.
      </Callout>
    </Stack>
  );
}

function DecisionsSection() {
  return (
    <Stack gap={10}>
      <H2>Décisions UX figées (V1)</H2>
      <Stack gap={8}>
        <Text>
          <Text as="span" weight="semibold">
            Entrées A + B seulement.{" "}
          </Text>
          Pas de création libre / admin hors étude dans ce parcours.
        </Text>
        <Text>
          <Text as="span" weight="semibold">
            Gate A = GAGNE + devis.{" "}
          </Text>
          Pas d’ouverture depuis DEVIS_GENERE seul.
        </Text>
        <Text>
          <Text as="span" weight="semibold">
            Gate B = MARCHE_EXISTANT.{" "}
          </Text>
          Bordereau + montant suffisants ; même wizard de conversion.
        </Text>
        <Text>
          <Text as="span" weight="semibold">
            Client hérité.{" "}
          </Text>
          Éditable uniquement s’il manque sur la source.
        </Text>
        <Text>
          <Text as="span" weight="semibold">
            Écart montant.{" "}
          </Text>
          Attribué ≠ devis autorisé + warning (seuil à confirmer avec métier).
        </Text>
        <Text>
          <Text as="span" weight="semibold">
            Budget = déboursé.{" "}
          </Text>
          Pas de FG/marge dans BudgetLigne. Sans décomposition : warning, create
          OK sans budget ventilé.
        </Text>
        <Text>
          <Text as="span" weight="semibold">
            Atomique.{" "}
          </Text>
          Marché + chantier (+ lots ± budget) en une transaction.
        </Text>
        <Text>
          <Text as="span" weight="semibold">
            Installation de chantier = 3 modes.{" "}
          </Text>
          Lot facturé (BDP) · Incluse au prix · Hors marché (déboursé
          interne). Détection BDP + choix user si ambigu.
        </Text>
        <Text>
          <Text as="span" weight="semibold">
            Équipe = rôles, pas une organigramme fixe.{" "}
          </Text>
          Core : chef + conducteur. Optionnels V1 : magasinier, pointeur,
          ingénieur. Le reste via affectations post-création.
        </Text>
      </Stack>

      <Spacer height={8} />
      <H2>Points ouverts — revue partenaire</H2>
      <Stack gap={8}>
        <Text>
          1. Seuil d’écart montant (ex. 5 % / 10 %) — warning seul ou confirm
          obligatoire ?
        </Text>
        <Text>
          2. Statut initial chantier (EN_PREPARATION vs PLANIFIE) et moment du
          1er OS.
        </Text>
        <Text>
          3. Cautions : obligatoires selon type marché public, ou toujours
          optionnelles à la création ?
        </Text>
        <Text>
          4. Installation « hors marché » : créer auto une ligne budget
          Installation, ou laisser le conducteur la saisir plus tard ?
        </Text>
        <Text>
          5. Pointeur / magasinier : requis si modules Pointage / Stock
          chantier actifs, ou toujours optionnels ?
        </Text>
        <Text>
          6. Fermeture de `/chantiers/new` libre : redirect vers dossier, ou
          page « choisir une affaire » ?
        </Text>
      </Stack>
    </Stack>
  );
}

export default function ChantierCreateWireframe() {
  const [entry, setEntry] = useCanvasState<EntryId>("cc-wf-entry", "A");
  const [step, setStep] = useCanvasState<StepId>("cc-wf-step", 0);
  const [scenario, setScenario] = useCanvasState<ScenarioId>(
    "cc-wf-scenario",
    "ok",
  );
  const [installMode, setInstallMode] = useCanvasState<InstallMode>(
    "cc-wf-install",
    "lot",
  );

  const blocked = scenario === "gate_blocked";
  const ecart = scenario === "ecart";
  const noDecompo = scenario === "no_decompo";

  const goNext = () => {
    if (blocked && step === 0) return;
    if (step < 5) setStep((step + 1) as StepId);
  };
  const goPrev = () => {
    if (step > 0) setStep((step - 1) as StepId);
  };

  return (
    <Stack gap={20} style={{ padding: 24, maxWidth: 960 }}>
      <Stack gap={6}>
        <H1>Wireframe — Créer marché + chantier</H1>
        <Text tone="secondary">
          Chaînage aval Lot 7 · wizard unique · entrées A (devis gagné) et B
          (marché existant). Pas de création libre.
        </Text>
      </Stack>

      <Stack gap={8}>
        <Text size="small" weight="semibold">
          Entrée
        </Text>
        <Row gap={8} wrap>
          <Button
            variant={entry === "A" ? "primary" : "secondary"}
            onClick={() => setEntry("A")}
          >
            A · Depuis devis
          </Button>
          <Button
            variant={entry === "B" ? "primary" : "secondary"}
            onClick={() => setEntry("B")}
          >
            B · Marché existant
          </Button>
        </Row>
      </Stack>

      <Stack gap={8}>
        <Text size="small" weight="semibold">
          Installation de chantier
        </Text>
        <Row gap={8} wrap>
          <Button
            variant={installMode === "lot" ? "primary" : "secondary"}
            onClick={() => {
              setInstallMode("lot");
              setStep(1);
            }}
          >
            Lot facturé
          </Button>
          <Button
            variant={installMode === "incluse" ? "primary" : "secondary"}
            onClick={() => {
              setInstallMode("incluse");
              setStep(1);
            }}
          >
            Incluse au prix
          </Button>
          <Button
            variant={installMode === "hors_marche" ? "primary" : "secondary"}
            onClick={() => {
              setInstallMode("hors_marche");
              setStep(1);
            }}
          >
            Hors marché
          </Button>
        </Row>
      </Stack>

      <Stack gap={8}>
        <Text size="small" weight="semibold">
          Scénario
        </Text>
        <Row gap={8} wrap>
          <Button
            variant={scenario === "ok" ? "primary" : "secondary"}
            onClick={() => setScenario("ok")}
          >
            Nominal
          </Button>
          <Button
            variant={scenario === "ecart" ? "primary" : "secondary"}
            onClick={() => {
              setScenario("ecart");
              setStep(1);
            }}
          >
            Écart montant
          </Button>
          <Button
            variant={scenario === "no_decompo" ? "primary" : "secondary"}
            onClick={() => {
              setScenario("no_decompo");
              setStep(3);
            }}
          >
            Sans décomposition
          </Button>
          <Button
            variant={scenario === "gate_blocked" ? "primary" : "secondary"}
            onClick={() => {
              setScenario("gate_blocked");
              setStep(0);
            }}
          >
            Gate bloquée
          </Button>
        </Row>
      </Stack>

      <Stack gap={8}>
        <Text size="small" weight="semibold">
          Étapes
        </Text>
        <Row gap={6} wrap>
          {STEPS.map((s) => (
            <span key={s.id}>
              <Button
                variant={step === s.id ? "primary" : "secondary"}
                onClick={() => setStep(s.id)}
              >
                {s.label}
              </Button>
            </span>
          ))}
        </Row>
      </Stack>

      <WizardChrome
        entry={entry}
        step={step}
        onPrev={goPrev}
        onNext={goNext}
        nextDisabled={blocked && step === 0}
        nextLabel={
          step === 5
            ? "Créer le marché et le chantier"
            : blocked && step === 0
              ? "Suivant (bloqué)"
              : undefined
        }
      >
        {step === 0 ? (
          <StepContexte entry={entry} blocked={blocked} />
        ) : null}
        {step === 1 ? (
          <StepMarcheChantier
            entry={entry}
            ecart={ecart}
            installMode={installMode}
          />
        ) : null}
        {step === 2 ? <StepProjection installMode={installMode} /> : null}
        {step === 3 ? <StepBudget noDecompo={noDecompo} /> : null}
        {step === 4 ? <StepEquipe /> : null}
        {step === 5 ? (
          <StepRecap
            entry={entry}
            ecart={ecart}
            noDecompo={noDecompo}
            installMode={installMode}
          />
        ) : null}
      </WizardChrome>

      <Divider />
      <DecisionsSection />
    </Stack>
  );
}
