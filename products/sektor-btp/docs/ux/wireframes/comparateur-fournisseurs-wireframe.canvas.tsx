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
 * L11 — Comparateur fournisseurs (05-ux.md écran 4).
 * Dépend de L7 (prix_normalise). Classement par prix comparable.
 */
type ViewId = "liste" | "perime" | "vide";

function Frame({ children, title }: { children: ReactNode; title: string }) {
  const t = useHostTheme();
  return (
    <div
      style={{
        border: `1px solid ${t.stroke.secondary}`,
        background: t.bg.editor,
        borderRadius: 8,
        overflow: "hidden",
        minHeight: 400,
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
          Achats · Comparateur · {title}
        </Text>
      </div>
      {children}
    </div>
  );
}

type RowData = {
  fournisseur: string;
  conditionnement: string;
  commercial: string;
  comparable: string;
  delai: string;
  perime?: boolean;
  best?: boolean;
};

function CompareTable({ rows }: { rows: RowData[] }) {
  const t = useHostTheme();
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
        }}
      >
        <thead>
          <tr style={{ background: t.bg.chrome }}>
            {[
              "Fournisseur",
              "Conditionnement",
              "Prix commercial",
              "Prix comparable",
              "Délai",
            ].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: h.includes("Prix") || h === "Délai" ? "right" : "left",
                  padding: "8px 12px",
                  borderBottom: `1px solid ${t.stroke.tertiary}`,
                  fontWeight: 600,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.fournisseur}
              style={{
                background: r.best ? t.bg.elevated : undefined,
                opacity: r.perime ? 0.85 : 1,
              }}
            >
              <td style={{ padding: "10px 12px", borderBottom: `1px solid ${t.stroke.tertiary}` }}>
                <Row gap={8} align="center">
                  <Text weight={r.best ? "semibold" : "normal"}>{r.fournisseur}</Text>
                  {r.best ? (
                    <Pill size="sm" active>
                      meilleur comparable
                    </Pill>
                  ) : null}
                </Row>
              </td>
              <td style={{ padding: "10px 12px", borderBottom: `1px solid ${t.stroke.tertiary}` }}>
                {r.conditionnement}
              </td>
              <td
                style={{
                  padding: "10px 12px",
                  borderBottom: `1px solid ${t.stroke.tertiary}`,
                  textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {r.commercial}
              </td>
              <td
                style={{
                  padding: "10px 12px",
                  borderBottom: `1px solid ${t.stroke.tertiary}`,
                  textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                  fontWeight: 600,
                }}
              >
                {r.comparable}
              </td>
              <td
                style={{
                  padding: "10px 12px",
                  borderBottom: `1px solid ${t.stroke.tertiary}`,
                  textAlign: "right",
                }}
              >
                <Row gap={6} align="center" justify="end">
                  <Text>{r.delai}</Text>
                  {r.perime ? (
                    <Pill size="sm" tone="warning">
                      périmé
                    </Pill>
                  ) : null}
                </Row>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const SCENARIO_REF: RowData[] = [
  {
    fournisseur: "Jotun",
    conditionnement: "pot 20 L",
    commercial: "560,00 DH",
    comparable: "28,00 DH/L",
    delai: "5 j",
    best: true,
  },
  {
    fournisseur: "Tollens",
    conditionnement: "pot 15 L",
    commercial: "450,00 DH",
    comparable: "30,00 DH/L",
    delai: "2 j",
  },
  {
    fournisseur: "Colorado",
    conditionnement: "pot 15 L",
    commercial: "465,00 DH",
    comparable: "31,00 DH/L",
    delai: "12 j",
    perime: true,
  },
];

function ViewListe() {
  return (
    <Stack gap={0}>
      <div style={{ padding: "12px 16px" }}>
        <Stack gap={8}>
          <Text weight="semibold">Peinture acrylique intérieure</Text>
          <Text size="small" tone="secondary">
            Article tenant · lignes catalogue valides à la date · tri prix comparable
            croissant
          </Text>
          <TextInput value="Peinture acrylique intérieure" />
        </Stack>
      </div>
      <Divider />
      <CompareTable rows={SCENARIO_REF} />
      <div style={{ padding: 16 }}>
        <Callout tone="info" title="Les deux prix toujours visibles">
          Commercial = facturé (450 le pot). Comparable = recalculé L7 (30 DH/L).
          Jamais l&apos;un sans l&apos;autre.
        </Callout>
      </div>
    </Stack>
  );
}

function ViewPerime() {
  return (
    <Stack gap={0}>
      <div style={{ padding: "12px 16px" }}>
        <Text weight="semibold">Même article · focus périmé</Text>
      </div>
      <Divider />
      <CompareTable rows={SCENARIO_REF} />
      <div style={{ padding: 16 }}>
        <Callout tone="warning" title="Prix périmé affiché, jamais filtré">
          Colorado reste dans la liste avec pastille « périmé ». Pas de filtre
          silencieux.
        </Callout>
      </div>
    </Stack>
  );
}

function ViewVide() {
  return (
    <div style={{ padding: 16 }}>
      <Stack gap={12}>
        <Text weight="semibold">Article sans offre catalogue</Text>
        <Callout tone="neutral" title="État vide">
          Aucune ligne catalogue active pour cet article à la date. CTA vers
          fiche fournisseur / saisie catalogue (hors lot).
        </Callout>
        <Button variant="secondary">Ouvrir catalogue fournisseurs</Button>
      </Stack>
    </div>
  );
}

export default function ComparateurFournisseursWireframe() {
  const [view, setView] = useCanvasState<ViewId>("view", "liste");

  return (
    <Stack gap={20} style={{ padding: 20, maxWidth: 960 }}>
      <Stack gap={6}>
        <H1>L11 — Comparateur fournisseurs</H1>
        <Text tone="secondary">
          Wireframe epic referentiel-catalogue-sektor · à valider avant code
        </Text>
      </Stack>

      <Row gap={6} wrap>
        {(
          [
            { id: "liste" as const, label: "1. Classement (28 avant 30)" },
            { id: "perime" as const, label: "2. Prix périmé visible" },
            { id: "vide" as const, label: "3. Vide" },
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
          view === "liste"
            ? "Comparaison"
            : view === "perime"
              ? "Périmé"
              : "Sans offre"
        }
      >
        {view === "liste" && <ViewListe />}
        {view === "perime" && <ViewPerime />}
        {view === "vide" && <ViewVide />}
      </Frame>

      <Divider />
      <H2>Décisions UX (à valider)</H2>
      <Stack gap={8}>
        <Text>
          1. Entrée : recherche / sélection d&apos;un article tenant → liste des
          lignes catalogue valides.
        </Text>
        <Text>
          2. Colonnes : fournisseur, conditionnement, prix commercial, prix
          comparable, délai (+ pastille périmé).
        </Text>
        <Text>
          3. Tri par défaut : prix comparable croissant (Jotun 28 avant Tollens
          30).
        </Text>
        <Text>
          4. Les deux prix toujours affichés ; périmé visible, jamais masqué.
        </Text>
        <Text>
          5. Hors lot : commande / attribution — lecture comparaison seulement.
        </Text>
      </Stack>
      <Spacer size={8} />
    </Stack>
  );
}
