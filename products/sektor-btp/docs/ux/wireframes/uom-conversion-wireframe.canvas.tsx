import {
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
  Toggle,
  useCanvasState,
  useHostTheme,
} from "cursor/canvas";

type ViewId = "fiche" | "convert-ok" | "convert-err";

/**
 * L3 — Fiche unité : facteur vers base, unité de base, test de conversion.
 * Décisions UX :
 * - Facteur = combien d'unités de base dans 1 unité (1 M3 = 1000 L)
 * - Une seule base par catégorie ; bascule manuelle
 * - Test conversion manuel (pas d'IA) — échec cross-catégorie explicite
 */
export default function UomConversionWireframe() {
  const theme = useHostTheme();
  const [view, setView] = useCanvasState<ViewId>("view", "fiche");
  const [estBase, setEstBase] = useCanvasState<boolean>("estBase", false);

  const border = theme.stroke.tertiary;
  const muted = theme.text.tertiary;
  const accent = theme.accent.primary;

  return (
    <Stack gap={20} style={{ padding: 24, maxWidth: 720 }}>
      <Stack gap={6}>
        <H1>Unités — facteur & conversion</H1>
        <Text tone="secondary" size="small">
          L3 référentiel-catalogue · configuration inventaire · manuel only
        </Text>
      </Stack>

      <Row gap={8}>
        <Pill active={view === "fiche"} onClick={() => setView("fiche")}>
          Fiche M3
        </Pill>
        <Pill active={view === "convert-ok"} onClick={() => setView("convert-ok")}>
          Conversion OK
        </Pill>
        <Pill active={view === "convert-err"} onClick={() => setView("convert-err")}>
          Échec L → H
        </Pill>
      </Row>

      {view === "fiche" && (
        <Stack gap={16}>
          <H2>Mètre cube (M3)</H2>
          <Stack
            gap={12}
            style={{
              border: `1px solid ${border}`,
              borderRadius: 8,
              padding: 16,
            }}
          >
            <Row gap={24}>
              <Stack gap={4} style={{ flex: 1 }}>
                <Text size="small" tone="secondary">
                  Code
                </Text>
                <Text weight="semibold">M3</Text>
              </Stack>
              <Stack gap={4} style={{ flex: 1 }}>
                <Text size="small" tone="secondary">
                  Libellé
                </Text>
                <Text weight="semibold">Mètre cube</Text>
              </Stack>
            </Row>
            <Row gap={24}>
              <Stack gap={4} style={{ flex: 1 }}>
                <Text size="small" tone="secondary">
                  Catégorie
                </Text>
                <Text>VOLUME</Text>
              </Stack>
              <Stack gap={4} style={{ flex: 1 }}>
                <Text size="small" tone="secondary">
                  Facteur vers base
                </Text>
                <Text weight="semibold" style={{ color: accent }}>
                  1000
                </Text>
                <Text size="small" tone="secondary">
                  1 M3 = 1000 L (base)
                </Text>
              </Stack>
            </Row>
            <Divider />
            <Row gap={12} align="center">
              <Text>Unité de base de la catégorie</Text>
              <Spacer />
              <Toggle checked={estBase} onChange={setEstBase} />
            </Row>
            {estBase && (
              <Callout tone="warning">
                L (Litre) perdra le statut de base. Le facteur de M3 passera à 1 —
                recalculez les autres unités de VOLUME.
              </Callout>
            )}
          </Stack>

          <H3>Décisions</H3>
          <Stack gap={6}>
            <Text size="small">
              · Facteur = quantité d&apos;unité de base contenue dans 1 unité
            </Text>
            <Text size="small">
              · Exactement une base par catégorie / tenant (contrainte SQL)
            </Text>
            <Text size="small">
              · Conversion strictement intra-catégorie — pas de second système
            </Text>
            <Text size="small" style={{ color: muted }}>
              · SURFACE séparée de LONGUEUR (M2 n&apos;est plus dans LONGUEUR)
            </Text>
          </Stack>
        </Stack>
      )}

      {view === "convert-ok" && (
        <Stack gap={16}>
          <H2>Tester une conversion</H2>
          <Stack
            gap={12}
            style={{
              border: `1px solid ${border}`,
              borderRadius: 8,
              padding: 16,
            }}
          >
            <Row gap={16}>
              <Stack gap={4} style={{ flex: 1 }}>
                <Text size="small" tone="secondary">
                  De
                </Text>
                <Text weight="semibold">L — Litre</Text>
              </Stack>
              <Stack gap={4} style={{ flex: 1 }}>
                <Text size="small" tone="secondary">
                  Vers
                </Text>
                <Text weight="semibold">M3 — Mètre cube</Text>
              </Stack>
              <Stack gap={4} style={{ flex: 1 }}>
                <Text size="small" tone="secondary">
                  Quantité
                </Text>
                <Text weight="semibold">1000</Text>
              </Stack>
            </Row>
            <Divider />
            <Callout tone="success">
              1000 L = 1 M3 · même catégorie VOLUME · facteurs 1 / 1000
            </Callout>
          </Stack>
        </Stack>
      )}

      {view === "convert-err" && (
        <Stack gap={16}>
          <H2>Tester une conversion</H2>
          <Stack
            gap={12}
            style={{
              border: `1px solid ${border}`,
              borderRadius: 8,
              padding: 16,
            }}
          >
            <Row gap={16}>
              <Stack gap={4} style={{ flex: 1 }}>
                <Text size="small" tone="secondary">
                  De
                </Text>
                <Text weight="semibold">L — Litre</Text>
              </Stack>
              <Stack gap={4} style={{ flex: 1 }}>
                <Text size="small" tone="secondary">
                  Vers
                </Text>
                <Text weight="semibold">H — Heure</Text>
              </Stack>
              <Stack gap={4} style={{ flex: 1 }}>
                <Text size="small" tone="secondary">
                  Quantité
                </Text>
                <Text weight="semibold">15</Text>
              </Stack>
            </Row>
            <Divider />
            <Callout tone="danger">
              Impossible : VOLUME ≠ TEMPS. La conversion n&apos;est autorisée
              qu&apos;à l&apos;intérieur d&apos;une même catégorie.
            </Callout>
          </Stack>
          <Spacer />
          <Text size="small" tone="secondary">
            Message i18n : item.uom.conversion.cross_category
          </Text>
        </Stack>
      )}
    </Stack>
  );
}
