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
  useCanvasState,
  useHostTheme,
} from "cursor/canvas";

/**
 * L14 — Console éditoriale catalogue Sektor (hors app client)
 * Specs : 05-ux.md Écran 6 · 03-catalogue-produit.md G2 · 01-modele-cible Phase 5
 *
 * Backend L14 : tables catalog_* sans tenant_id ; front console après tel quel.
 * Interdit : publier sous seuil ; afficher nom de tenant ; FK vers tables tenant.
 */
type ViewId = "file" | "eligible" | "sous-seuil" | "publie" | "editions";

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
          Katalog · Console · {title}
        </Text>
      </div>
      {children}
    </div>
  );
}

function ViewFile({ go }: { go: (v: ViewId) => void }) {
  const t = useHostTheme();
  return (
    <Stack gap={0}>
      <div
        style={{
          padding: "10px 14px",
          borderBottom: `1px solid ${t.stroke.tertiary}`,
        }}
      >
        <Row gap={8} align="center" justify="space-between">
          <Row gap={8} align="center">
            <Text weight="semibold">Candidats</Text>
            <Pill size="sm" tone="neutral">
              14 en attente
            </Pill>
          </Row>
          <Text size="small" tone="secondary">
            Édition courante 2026.1
          </Text>
        </Row>
      </div>
      <div style={{ padding: 16 }}>
        <Stack gap={12}>
          <Callout tone="info" title="Hors application client">
            Console Sektor uniquement. Aucun libellé brut client · aucun nom de
            tenant. G2 : publier seulement si seuil atteint.
          </Callout>

          <div
            style={{
              border: `1px solid ${t.stroke.secondary}`,
              borderRadius: 6,
              padding: 12,
              background: t.bg.elevated,
              cursor: "pointer",
            }}
            onClick={() => go("eligible")}
          >
            <Stack gap={6}>
              <Row justify="space-between" align="center">
                <Text weight="semibold">Peinture acrylique intérieure</Text>
                <Pill size="sm" tone="success">
                  7 tenants · éligible
                </Pill>
              </Row>
              <Text size="small" tone="secondary">
                Exemples anonymisés · médiane 0,15 L/m² · proposé par règle
              </Text>
            </Stack>
          </div>

          <div
            style={{
              border: `1px solid ${t.stroke.secondary}`,
              borderRadius: 6,
              padding: 12,
              background: t.bg.elevated,
              cursor: "pointer",
            }}
            onClick={() => go("sous-seuil")}
          >
            <Stack gap={6}>
              <Row justify="space-between" align="center">
                <Text weight="semibold">Enduit spécial façade Riad</Text>
                <Pill size="sm" tone="warning">
                  1 tenant · sous seuil
                </Pill>
              </Row>
              <Text size="small" tone="secondary">
                Visible, non publiable — règle G2
              </Text>
            </Stack>
          </div>

          <Row gap={8}>
            <Button variant="secondary" onClick={() => go("editions")}>
              Éditions
            </Button>
          </Row>
        </Stack>
      </div>
    </Stack>
  );
}

function ViewEligible({ go }: { go: (v: ViewId) => void }) {
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
          <Button variant="secondary" onClick={() => go("file")}>
            ← File
          </Button>
          <Text weight="semibold">Candidat · article</Text>
          <Pill size="sm" tone="success">
            Éligible
          </Pill>
        </Row>
      </div>
      <div style={{ padding: 16 }}>
        <Stack gap={12}>
          <Text weight="semibold">Peinture acrylique intérieure</Text>
          <Text size="small" tone="secondary">
            Nature MATIERE · unité L · famille FIN_PEINT
          </Text>

          <div
            style={{
              border: `1px solid ${t.stroke.secondary}`,
              borderRadius: 6,
              padding: 12,
            }}
          >
            <Stack gap={6}>
              <Text size="small" weight="semibold">
                Libellés observés (anonymisés)
              </Text>
              <Text size="small">
                peinture mur blanc · peinture acrylique mur · peinture
                intérieure blanche · peinture mur intérieur mat
              </Text>
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
              <Text size="small" weight="semibold">
                Rendements observés
              </Text>
              <Row justify="space-between">
                <Text size="small">Min – max</Text>
                <Text size="small">0,12 – 0,18 L/m²</Text>
              </Row>
              <Row justify="space-between">
                <Text size="small">Médiane</Text>
                <Text weight="semibold">0,15 L/m²</Text>
              </Row>
            </Stack>
          </div>

          <Callout tone="neutral" title="Provenance">
            Proposé par : règle de regroupement · model_version —
          </Callout>

          <Row gap={8}>
            <Button variant="primary" onClick={() => go("publie")}>
              Publier dans 2026.1
            </Button>
            <Button variant="secondary" onClick={() => go("file")}>
              Refuser
            </Button>
          </Row>
        </Stack>
      </div>
    </Stack>
  );
}

function ViewSousSeuil({ go }: { go: (v: ViewId) => void }) {
  return (
    <Stack gap={0}>
      <div style={{ padding: "10px 14px" }}>
        <Row gap={8} align="center">
          <Button variant="secondary" onClick={() => go("file")}>
            ← File
          </Button>
          <Text weight="semibold">Sous le seuil</Text>
          <Pill size="sm" tone="warning">
            1 / 3
          </Pill>
        </Row>
      </div>
      <div style={{ padding: 16 }}>
        <Stack gap={12}>
          <Text weight="semibold">Enduit spécial façade Riad</Text>
          <Callout tone="warning" title="G2 — non publiable">
            Un seul tenant confirmant. Affiché pour transparence ; bouton
            Publier désactivé (pas grisé silencieux — motif visible).
          </Callout>
          <Button variant="secondary" disabled>
            Publier (seuil articles ≥ 3)
          </Button>
          <Text size="small" tone="secondary">
            Aucun nom de tenant affiché. Exemples anonymisés uniquement.
          </Text>
        </Stack>
      </div>
    </Stack>
  );
}

function ViewPublie({ go }: { go: (v: ViewId) => void }) {
  return (
    <Stack gap={0}>
      <div style={{ padding: "10px 14px" }}>
        <Row gap={8} align="center">
          <Text weight="semibold">Publié</Text>
          <Pill size="sm" tone="success">
            PUBLIE
          </Pill>
        </Row>
      </div>
      <div style={{ padding: 16 }}>
        <Stack gap={12}>
          <Callout tone="success" title="Article catalogue créé">
            cle_stable = peinture-acrylique-interieure · édition 2026.1 ·
            statut PUBLIE. Candidat → ACCEPTE.
          </Callout>
          <Text size="small" tone="secondary">
            Dépréciation future = remplace_par, jamais delete. Études
            enregistrent le code d’édition utilisé.
          </Text>
          <Row gap={8}>
            <Button variant="primary" onClick={() => go("file")}>
              Retour file
            </Button>
            <Button variant="secondary" onClick={() => go("editions")}>
              Voir édition
            </Button>
          </Row>
        </Stack>
      </div>
    </Stack>
  );
}

function ViewEditions({ go }: { go: (v: ViewId) => void }) {
  const t = useHostTheme();
  return (
    <Stack gap={0}>
      <div style={{ padding: "10px 14px" }}>
        <Row gap={8} align="center">
          <Button variant="secondary" onClick={() => go("file")}>
            ← File
          </Button>
          <Text weight="semibold">Éditions</Text>
        </Row>
      </div>
      <div style={{ padding: 16 }}>
        <Stack gap={10}>
          <div
            style={{
              border: `1px solid ${t.stroke.secondary}`,
              borderRadius: 6,
              padding: 12,
              background: t.bg.elevated,
            }}
          >
            <Row justify="space-between">
              <Text weight="semibold">2026.1</Text>
              <Pill size="sm" tone="success">
                PUBLIEE
              </Pill>
            </Row>
            <Text size="small" tone="secondary">
              Corpus GO amorcé · articles + ouvrages
            </Text>
          </div>
          <div
            style={{
              border: `1px solid ${t.stroke.secondary}`,
              borderRadius: 6,
              padding: 12,
            }}
          >
            <Row justify="space-between">
              <Text weight="semibold">2026.2</Text>
              <Pill size="sm" tone="neutral">
                BROUILLON
              </Pill>
            </Row>
            <Text size="small" tone="secondary">
              Prochaine vague candidats
            </Text>
          </div>
          <Callout tone="info" title="Import tenant">
            Lookup catalogue → copie vers item/ouvrage tenant (clé stable,
            pas de FK). Hors console détail L14 API.
          </Callout>
        </Stack>
      </div>
    </Stack>
  );
}

export default function CatalogueConsoleWireframe() {
  const [view, setView] = useCanvasState<ViewId>("l14-view", "file");

  return (
    <Stack gap={16} style={{ padding: 16, maxWidth: 720 }}>
      <Stack gap={4}>
        <H1>L14 — Console catalogue</H1>
        <Text tone="secondary">
          File candidats · G2 seuils · éditions · hors app client
        </Text>
      </Stack>

      <Row gap={6} wrap>
        {(
          [
            ["file", "File"],
            ["eligible", "Éligible"],
            ["sous-seuil", "Sous seuil"],
            ["publie", "Publié"],
            ["editions", "Éditions"],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            variant={view === id ? "primary" : "secondary"}
            onClick={() => setView(id)}
          >
            {label}
          </Button>
        ))}
      </Row>

      <Frame
        title={
          view === "file"
            ? "File"
            : view === "eligible"
              ? "Éligible"
              : view === "sous-seuil"
                ? "Sous seuil"
                : view === "publie"
                  ? "Publié"
                  : "Éditions"
        }
      >
        {view === "file" && <ViewFile go={setView} />}
        {view === "eligible" && <ViewEligible go={setView} />}
        {view === "sous-seuil" && <ViewSousSeuil go={setView} />}
        {view === "publie" && <ViewPublie go={setView} />}
        {view === "editions" && <ViewEditions go={setView} />}
      </Frame>

      <Divider />
      <H2>Décisions UX (L14)</H2>
      <Stack gap={6}>
        <Text>
          1. Console hors ERP client — route / permissions catalogue.* séparées.
        </Text>
        <Text>
          2. Sous-seuil : visible + motif ; Publier inactif avec raison (pas
          silence).
        </Text>
        <Text>
          3. Jamais de nom de tenant · exemples anonymisés · dispersion +
          médiane.
        </Text>
        <Text>
          4. Provenance règle/IA + model_version toujours visible.
        </Text>
        <Text>
          5. Publier → cle_stable + édition ; refuse → candidat REFUSE.
        </Text>
      </Stack>

      <Spacer />
      <Text size="small" tone="secondary">
        Validé « tel quel » — L14 front console livré.
      </Text>
    </Stack>
  );
}
