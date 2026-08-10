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
  Stat,
  Text,
  UsageBar,
  useCanvasState,
  useHostTheme,
} from "cursor/canvas";

/** L6 — polish UI chiffrage (remplace FOURNI / DECOMPOSE binaire). */
type ViewId = "estime" | "decompo" | "forfait" | "etape5";
type SaisieEn = "cout" | "vente";

function FrameShell({
  children,
  title,
  step,
}: {
  children: ReactNode;
  title: string;
  step: string;
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
        <Row gap={8} align="center">
          <Text size="small" weight="semibold">
            Étude · {step}
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

function OriginSelector({
  active,
  onChange,
}: {
  active: "decompo" | "forfait" | "estime";
  onChange: (v: "decompo" | "forfait" | "estime") => void;
}) {
  const t = useHostTheme();
  const opts: Array<{ id: "decompo" | "forfait" | "estime"; label: string }> = [
    { id: "decompo", label: "je décompose" },
    { id: "forfait", label: "forfait" },
    { id: "estime", label: "j'estime" },
  ];
  return (
    <Stack gap={6}>
      <Text size="small" tone="secondary">
        Mon coût, je l&apos;établis :
      </Text>
      <Row gap={6} wrap>
        {opts.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: `1px solid ${
                active === o.id ? t.accent.primary : t.stroke.secondary
              }`,
              background:
                active === o.id ? t.bg.elevated : t.bg.editor,
              color: t.text.primary,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: active === o.id ? 600 : 400,
            }}
          >
            {o.label}
          </button>
        ))}
      </Row>
    </Stack>
  );
}

function TroisLignes({
  cout,
  fgPct,
  revient,
  margePct,
  vente,
  totalLigne,
}: {
  cout: string;
  fgPct: string;
  revient: string;
  margePct: string;
  vente: string;
  totalLigne: string;
}) {
  const t = useHostTheme();
  const row = (left: string, mid: string, right: string, bold?: boolean) => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto auto",
        gap: 12,
        padding: "4px 0",
        fontSize: 13,
        fontWeight: bold ? 600 : 400,
        color: t.text.primary,
      }}
    >
      <span>{left}</span>
      <span style={{ color: t.text.tertiary, textAlign: "right" }}>{mid}</span>
      <span style={{ textAlign: "right", minWidth: 72 }}>{right}</span>
    </div>
  );
  return (
    <Stack gap={2}>
      <Text size="small" weight="semibold">
        Plancher — toujours visible
      </Text>
      {row("Coût", "", cout)}
      {row("+ frais généraux", fgPct, revient)}
      {row("+ marge", margePct, vente)}
      <Divider />
      {row("Total ligne", "", totalLigne, true)}
    </Stack>
  );
}

function PosteHeader() {
  const t = useHostTheme();
  return (
    <div
      style={{
        padding: "12px 16px",
        borderBottom: `1px solid ${t.stroke.tertiary}`,
      }}
    >
      <Row gap={10} align="center" wrap>
        <Text weight="semibold">3.2 Enduit extérieur</Text>
        <Pill size="sm" tone="neutral">
          Article 3.2.1
        </Pill>
        <Text size="small" tone="tertiary">
          1 240 m²
        </Text>
        <Spacer />
        <Pill size="sm" tone="warning">
          dirty
        </Pill>
      </Row>
    </div>
  );
}

function FooterSticky({ label }: { label: string }) {
  const t = useHostTheme();
  return (
    <div
      style={{
        marginTop: "auto",
        padding: "10px 16px",
        borderTop: `1px solid ${t.stroke.tertiary}`,
        background: t.bg.chrome,
        display: "flex",
        justifyContent: "flex-end",
        gap: 8,
      }}
    >
      <Button variant="secondary">Annuler</Button>
      <Button variant="primary">{label}</Button>
    </div>
  );
}

function ViewEstime({
  saisieEn,
  setSaisieEn,
  onOrigin,
}: {
  saisieEn: SaisieEn;
  setSaisieEn: (v: SaisieEn) => void;
  onOrigin: (v: "decompo" | "forfait" | "estime") => void;
}) {
  const t = useHostTheme();
  return (
    <Stack gap={0} style={{ minHeight: 460 }}>
      <PosteHeader />
      <div style={{ padding: 16, flex: 1 }}>
        <Stack gap={16}>
          <OriginSelector active="estime" onChange={onOrigin} />

          <div
            style={{
              border: `1px solid ${t.stroke.secondary}`,
              borderRadius: 8,
              padding: 14,
              background: t.bg.elevated,
            }}
          >
            <Stack gap={10}>
              <Text size="small" tone="secondary">
                je saisis :
              </Text>
              <Row gap={6}>
                {(
                  [
                    { id: "cout" as const, label: "un coût" },
                    { id: "vente" as const, label: "un prix de vente" },
                  ] as const
                ).map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setSaisieEn(o.id)}
                    style={{
                      padding: "5px 10px",
                      borderRadius: 6,
                      border: `1px solid ${
                        saisieEn === o.id
                          ? t.accent.primary
                          : t.stroke.secondary
                      }`,
                      background: t.bg.editor,
                      color: t.text.primary,
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: saisieEn === o.id ? 600 : 400,
                    }}
                  >
                    {o.label}
                  </button>
                ))}
              </Row>
              <Row gap={8} align="center">
                <Text size="small" weight="semibold">
                  {saisieEn === "cout" ? "Coût" : "Prix de vente HT"}
                </Text>
                <div
                  style={{
                    border: `1px solid ${t.stroke.secondary}`,
                    borderRadius: 4,
                    padding: "4px 10px",
                    minWidth: 88,
                    textAlign: "right",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {saisieEn === "cout" ? "46,00" : "1 000,00"}
                </div>
                <Text size="small" tone="tertiary">
                  DH/m²
                </Text>
              </Row>
              {saisieEn === "vente" ? (
                <Callout tone="warning" title="Coût déduit">
                  Saisie en vente → coût calculé 865,33 DH · cout_deduit = true ·
                  exclu de la marge synthèse.
                </Callout>
              ) : null}
            </Stack>
          </div>

          <TroisLignes
            cout={saisieEn === "cout" ? "46,00" : "865,33"}
            fgPct="8 %"
            revient={saisieEn === "cout" ? "49,68" : "934,56"}
            margePct="7 %"
            vente={saisieEn === "cout" ? "53,16" : "1 000,00"}
            totalLigne={saisieEn === "cout" ? "65 918,40 DH" : "1 240 000 DH"}
          />

          <Callout tone="info" title="Avis (L8 — stub visible)">
            1 avis d&apos;exécution non traité · [ Voir ]
          </Callout>
        </Stack>
      </div>
      <FooterSticky label="Enregistrer" />
    </Stack>
  );
}

function ViewDecompo({
  onOrigin,
}: {
  onOrigin: (v: "decompo" | "forfait" | "estime") => void;
}) {
  const t = useHostTheme();
  return (
    <Stack gap={0} style={{ minHeight: 460 }}>
      <PosteHeader />
      <div style={{ padding: 16, flex: 1 }}>
        <Stack gap={14}>
          <OriginSelector active="decompo" onChange={onOrigin} />

          <Callout tone="info" title="Estimation conservée (repère)">
            Tu visais 46,00 — ta décomposition donne 44,20 (−3,9 %).
          </Callout>

          <div
            style={{
              border: `1px solid ${t.stroke.secondary}`,
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "56px 1fr 1.2fr 48px 56px 56px",
                gap: 8,
                padding: "8px 10px",
                background: t.bg.chrome,
                fontSize: 11,
                color: t.text.tertiary,
                fontWeight: 600,
              }}
            >
              <span>Type</span>
              <span>Désignation</span>
              <span>Source</span>
              <span>Qté</span>
              <span>PU</span>
              <span>Total</span>
            </div>
            {[
              [
                "MAT",
                "Enduit monocouche",
                "1,20 DH — catalogue Lafarge, 12/06/2026",
                "1,05",
                "1,20",
                "1,26",
              ],
              ["MO", "Applicateur", "Manuel", "0,35", "95,00", "33,25"],
              ["MAT", "Primaire", "Consulté", "0,08", "42,00", "3,36"],
            ].map((r, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "56px 1fr 1.2fr 48px 56px 56px",
                  gap: 8,
                  padding: "8px 10px",
                  borderTop: `1px solid ${t.stroke.tertiary}`,
                  fontSize: 12,
                }}
              >
                {r.map((cell, j) => (
                  <span
                    key={j}
                    style={{
                      color: j === 2 ? t.text.secondary : t.text.primary,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={cell}
                  >
                    {cell}
                  </span>
                ))}
              </div>
            ))}
          </div>

          <Row gap={8}>
            <Button variant="secondary">+ Composant</Button>
            <Button variant="ghost">Extraire (IA)</Button>
            <Text size="small" tone="tertiary">
              Manuel toujours disponible
            </Text>
          </Row>

          <TroisLignes
            cout="44,20"
            fgPct="8 %"
            revient="47,74"
            margePct="7 %"
            vente="51,08"
            totalLigne="63 339,20 DH"
          />
        </Stack>
      </div>
      <FooterSticky label="Enregistrer" />
    </Stack>
  );
}

function ViewForfait({
  onOrigin,
}: {
  onOrigin: (v: "decompo" | "forfait" | "estime") => void;
}) {
  const t = useHostTheme();
  return (
    <Stack gap={0} style={{ minHeight: 460 }}>
      <PosteHeader />
      <div style={{ padding: 16, flex: 1 }}>
        <Stack gap={14}>
          <OriginSelector active="forfait" onChange={onOrigin} />

          <div
            style={{
              border: `1px solid ${t.stroke.secondary}`,
              borderRadius: 8,
              padding: 14,
              background: t.bg.elevated,
            }}
          >
            <Stack gap={10}>
              <Row gap={8} align="center" wrap>
                <Text size="small" weight="semibold">
                  Sous-traitant
                </Text>
                <div
                  style={{
                    border: `1px solid ${t.stroke.secondary}`,
                    borderRadius: 4,
                    padding: "4px 10px",
                    fontSize: 13,
                    minWidth: 160,
                  }}
                >
                  Entreprise Atlas Façades
                </div>
              </Row>
              <Row gap={8} align="center" wrap>
                <Text size="small" weight="semibold">
                  Offre
                </Text>
                <div
                  style={{
                    border: `1px solid ${t.stroke.secondary}`,
                    borderRadius: 4,
                    padding: "4px 10px",
                    fontSize: 13,
                    minWidth: 160,
                  }}
                >
                  OFF-2026-118 · 46,00 DH/m²
                </div>
                <Pill size="sm" tone="info">
                  forfait_partner_id + forfait_offre_id
                </Pill>
              </Row>
              <Row gap={8} align="center">
                <Text size="small" weight="semibold">
                  Coût forfait
                </Text>
                <div
                  style={{
                    border: `1px solid ${t.stroke.secondary}`,
                    borderRadius: 4,
                    padding: "4px 10px",
                    minWidth: 88,
                    textAlign: "right",
                    fontWeight: 600,
                  }}
                >
                  46,00
                </div>
                <Text size="small" tone="tertiary">
                  DH/m²
                </Text>
              </Row>
            </Stack>
          </div>

          <TroisLignes
            cout="46,00"
            fgPct="8 %"
            revient="49,68"
            margePct="7 %"
            vente="53,16"
            totalLigne="65 918,40 DH"
          />

          <Text size="small" tone="tertiary">
            Pas de décomposition obligatoire. Les 3 lignes restent affichées
            (même chaîne multiplicative que ESTIME).
          </Text>
        </Stack>
      </div>
      <FooterSticky label="Enregistrer" />
    </Stack>
  );
}

function ViewEtape5() {
  const t = useHostTheme();
  return (
    <Stack gap={0} style={{ minHeight: 460 }}>
      <div
        style={{
          padding: "12px 16px",
          borderBottom: `1px solid ${t.stroke.tertiary}`,
        }}
      >
        <Row gap={10} align="center" wrap>
          <Text weight="semibold">Résidence Al Manar — DE-0142</Text>
          <Text size="small" tone="tertiary">
            182 articles · Étape 5 — Arbitrage
          </Text>
        </Row>
      </div>
      <div style={{ padding: 16 }}>
        <Stack gap={16}>
          <Row gap={16} wrap>
            <Stat value="4 210 000" label="Montant total HT (DH)" />
            <Stat value="2 480 000" label="Coût établi (DH)" />
            <Stat value="21 %" label="Marge sur coûts établis" tone="success" />
            <Stat value="520 000" label="Marge (DH)" tone="success" />
          </Row>

          <Callout tone="warning" title="Coût déduit — non fiable">
            Exclu de la marge. Part du montant : 12 % · cliquable → filtre
            articles concernés.
          </Callout>

          <Stack gap={8}>
            <H3>Répartition du montant</H3>
            <UsageBar
              total={100}
              topLeftLabel="Répartition montant HT"
              topRightLabel="41% · 22% · 25% · 12%"
              segments={[
                { id: "decompo", value: 41, color: "blue" },
                { id: "forfait", value: 22, color: "purple" },
                { id: "estime", value: 25, color: "orange" },
                { id: "deduit", value: 12, color: "yellow" },
              ]}
            />
            <Text size="small" tone="tertiary">
              décomposé 41 % · forfait 22 % · estimé 25 % · coût déduit 12 % —
              jamais en nombre de lignes. Chaque segment filtre la liste.
            </Text>
          </Stack>

          <Callout tone="danger" title="Avant soumission">
            37 % du montant repose sur des coûts non établis · 3 avis
            d&apos;exécution écartés · [ Détail ]
          </Callout>

          <div
            style={{
              border: `1px solid ${t.stroke.secondary}`,
              borderRadius: 8,
              padding: 12,
            }}
          >
            <Text size="small" weight="semibold">
              Liste filtrée (ex. « estimé »)
            </Text>
            <Spacer height={8} />
            <Stack gap={4}>
              <Text size="small">
                3.2.1 Enduit extérieur — ESTIME · 46,00
              </Text>
              <Text size="small">
                4.1.3 Peinture int. — ESTIME · cout_deduit
              </Text>
              <Text size="small">5.0.2 Divers — ESTIME · 12,00</Text>
            </Stack>
          </div>
        </Stack>
      </div>
    </Stack>
  );
}

function Decisions() {
  return (
    <Stack gap={8}>
      <H2>Décisions UX à valider (L6)</H2>
      <Text>
        <Text as="span" weight="semibold">
          1. Sélecteur 3 origines{" "}
        </Text>
        remplace le toggle « Décomposé | Prix fourni ». Labels métier : « je
        décompose / forfait / j&apos;estime ». Toujours visible, toujours
        modifiable.
      </Text>
      <Text>
        <Text as="span" weight="semibold">
          2. Interrupteur coût / vente{" "}
        </Text>
        uniquement en ESTIME. Défaut = coût. Saisie vente → cout_deduit +
        callout.
      </Text>
      <Text>
        <Text as="span" weight="semibold">
          3. Trois lignes toujours affichées{" "}
        </Text>
        (coût → revient → vente) dans les 3 origines — jamais repliées. Cas
        référence 46 → 49,68 → 53,16 (FG 8 %, marge 7 %).
      </Text>
      <Text>
        <Text as="span" weight="semibold">
          4. Changer d&apos;origine ne perd rien.{" "}
        </Text>
        ESTIME → DECOMPOSE : estimation = repère + écart % (callout).
        Brouillon décompo conservé en FORFAIT / ESTIME.
      </Text>
      <Text>
        <Text as="span" weight="semibold">
          5. FOURNI disparaît du vocabulaire UI.{" "}
        </Text>
        Purge labels / i18n / modeUi binaire. API : origineCout + coutUnitaire
        (contrat L1 déjà là).
      </Text>
      <Text>
        <Text as="span" weight="semibold">
          6. Bandeau étape 5{" "}
        </Text>
        : montant, coût établi, marge hors déduits, répartition cliquable,
        alerte % non établi. Avis = stub L8 (lien seulement).
      </Text>
      <Text>
        <Text as="span" weight="semibold">
          7. Hors L6{" "}
        </Text>
        : rattrapage LIBRE (L9), avis complets (L8), gel display déjà L5.
      </Text>
      <Text>
        <Text as="span" weight="semibold">
          8. AI-first / manuel{" "}
        </Text>
        : Extraire IA optionnel en DECOMPOSE ; + Composant toujours présent
        (héritage wireframe décompo).
      </Text>
    </Stack>
  );
}

export default function EtudeChiffrageOriginesWireframe() {
  const [view, setView] = useCanvasState<ViewId>("l6-wf-view", "estime");
  const [saisieEn, setSaisieEn] = useCanvasState<SaisieEn>(
    "l6-wf-saisie",
    "cout",
  );

  const goOrigin = (v: "decompo" | "forfait" | "estime") => setView(v);

  return (
    <Stack gap={20} style={{ padding: 24, maxWidth: 960 }}>
      <Stack gap={6}>
        <H1>Wireframe L6 — Origines du coût</H1>
        <Text tone="secondary">
          Remplace FOURNI/DECOMPOSE. Normatif :{" "}
          <Text as="span" weight="semibold">
            05-ux.md
          </Text>{" "}
          écrans 1–2. Valider ici avant le code front.
        </Text>
      </Stack>

      <Row gap={8} wrap>
        <Button
          variant={view === "estime" ? "primary" : "secondary"}
          onClick={() => setView("estime")}
        >
          1 · J&apos;estime
        </Button>
        <Button
          variant={view === "decompo" ? "primary" : "secondary"}
          onClick={() => setView("decompo")}
        >
          2 · Je décompose
        </Button>
        <Button
          variant={view === "forfait" ? "primary" : "secondary"}
          onClick={() => setView("forfait")}
        >
          3 · Forfait
        </Button>
        <Button
          variant={view === "etape5" ? "primary" : "secondary"}
          onClick={() => setView("etape5")}
        >
          4 · Étape 5 synthèse
        </Button>
      </Row>

      <Callout tone="info" title="Cycle de vie poste">
        Ouvrir drawer → sélecteur origine (défaut = état persisté / DECOMPOSE)
        → saisir → 3 lignes live → Enregistrer. Switch origine = instantané ;
        confirm seulement si dirty et écrasement risqué. Tree / PU refresh
        après save (copie isolée inchangée).
      </Callout>

      <FrameShell
        step={view === "etape5" ? "Étape 5 — Arbitrage" : "Étape 3 — Coût"}
        title={
          view === "estime"
            ? `origine ESTIME · saisie ${saisieEn}`
            : view === "decompo"
              ? "origine DECOMPOSE · écart vs estimation"
              : view === "forfait"
                ? "origine FORFAIT · partenaire + offre"
                : "bandeau synthèse · répartition montant"
        }
      >
        {view === "estime" ? (
          <ViewEstime
            saisieEn={saisieEn}
            setSaisieEn={setSaisieEn}
            onOrigin={goOrigin}
          />
        ) : null}
        {view === "decompo" ? <ViewDecompo onOrigin={goOrigin} /> : null}
        {view === "forfait" ? <ViewForfait onOrigin={goOrigin} /> : null}
        {view === "etape5" ? <ViewEtape5 /> : null}
      </FrameShell>

      <Decisions />
    </Stack>
  );
}
