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
 * L9 — Rattrapage LIBRE / hors_referentiel / création article allégée
 * Specs : 05-ux.md écran 3 · 01-modele-cible.md « article n'existe pas »
 */
type ViewId =
  | "saisie"
  | "rattrapage"
  | "rapprocher"
  | "creer"
  | "controlee"
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
          Étude · Référentiel · {title}
        </Text>
      </div>
      {children}
    </div>
  );
}

function ViewSaisie() {
  const t = useHostTheme();
  return (
    <Stack gap={0}>
      <div
        style={{
          padding: "10px 14px",
          borderBottom: `1px solid ${t.stroke.tertiary}`,
        }}
      >
        <Text weight="semibold">3.2 Enduit extérieur — décomposition</Text>
      </div>
      <div style={{ padding: 16 }}>
        <Stack gap={12}>
          <Callout tone="info" title="Pendant la saisie">
            Aucune fenêtre de création obligatoire. Texte inconnu → composant
            LIBRE, on continue.
          </Callout>

          <Text size="small" tone="secondary">
            Composant
          </Text>
          <TextInput value="ciment cpj 4" />
          <div
            style={{
              border: `1px solid ${t.stroke.secondary}`,
              borderRadius: 6,
              background: t.bg.elevated,
              padding: 8,
            }}
          >
            <Stack gap={6}>
              <Text size="small">CIM-045 · Ciment CPJ 45 sac 50kg</Text>
              <Text size="small">CIM-055 · Ciment CPJ 55 vrac</Text>
              <Divider />
              <Text size="small" tone="secondary">
                + créer « ciment cpj 4 » — proposé, jamais imposé
              </Text>
            </Stack>
          </div>

          <Row gap={8} align="center">
            <Pill size="sm" tone="warning">
              LIBRE
            </Pill>
            <Text size="small" tone="secondary">
              Prix manuel + rendement conservés · rattrapage en fin de dossier
            </Text>
          </Row>
        </Stack>
      </div>
    </Stack>
  );
}

function GroupeRow({
  libelle,
  count,
  onRapprocher,
  onCreer,
  onIgnorer,
}: {
  libelle: string;
  count: number;
  onRapprocher: () => void;
  onCreer: () => void;
  onIgnorer: () => void;
}) {
  const t = useHostTheme();
  return (
    <div
      style={{
        padding: "12px 14px",
        borderBottom: `1px solid ${t.stroke.tertiary}`,
      }}
    >
      <Row gap={12} align="center" justify="space-between" wrap>
        <Row gap={10} align="center">
          <Text weight="semibold">{libelle}</Text>
          <Pill size="sm" tone="neutral">
            ×{count}
          </Pill>
        </Row>
        <Row gap={6} wrap>
          <Button variant="secondary" onClick={onRapprocher}>
            Rapprocher
          </Button>
          <Button variant="secondary" onClick={onCreer}>
            Créer
          </Button>
          <Button variant="ghost" onClick={onIgnorer}>
            Ignorer
          </Button>
        </Row>
      </Row>
    </div>
  );
}

function ViewRattrapage({
  go,
}: {
  go: (v: ViewId) => void;
}) {
  return (
    <Stack gap={0}>
      <div style={{ padding: "12px 16px" }}>
        <Row gap={10} align="center" justify="space-between" wrap>
          <Stack gap={4}>
            <Text weight="semibold">12 composants non rattachés</Text>
            <Text size="small" tone="secondary">
              Dossier DE-0142 · groupés par libellé similaire
            </Text>
          </Stack>
          <Pill size="sm" tone="warning">
            LIBRE ∧ ¬ hors_referentiel
          </Pill>
        </Row>
      </div>
      <Divider />
      <GroupeRow
        libelle="Ciment CPJ 45"
        count={4}
        onRapprocher={() => go("rapprocher")}
        onCreer={() => go("creer")}
        onIgnorer={() => go("vide")}
      />
      <GroupeRow
        libelle="Sable de dune"
        count={3}
        onRapprocher={() => go("rapprocher")}
        onCreer={() => go("creer")}
        onIgnorer={() => go("vide")}
      />
      <GroupeRow
        libelle="Amenée et repli"
        count={2}
        onRapprocher={() => go("rapprocher")}
        onCreer={() => go("creer")}
        onIgnorer={() => go("vide")}
      />
      <div style={{ padding: 16 }}>
        <Callout tone="neutral" title="Ignorer = hors_referentiel">
          Définitif : la ligne ne réapparaît plus jamais. Une liste qu&apos;on
          peut vider est une liste qu&apos;on utilise.
        </Callout>
        <Spacer size={12} />
        <Button variant="secondary" onClick={() => go("controlee")}>
          Voir mode CONTROLEE
        </Button>
      </div>
    </Stack>
  );
}

function ViewRapprocher({ back }: { back: () => void }) {
  return (
    <div style={{ padding: 16 }}>
      <Stack gap={12}>
        <Text weight="semibold">Rapprocher · Ciment CPJ 45 (×4)</Text>
        <Text size="small" tone="secondary">
          Appliqué aux 4 composants du groupe → ITEM + itemId · gel L5 au save
        </Text>
        <TextInput value="CIM-045" placeholder="Chercher un article tenant…" />
        <Stack gap={6}>
          <Text size="small">CIM-045 · Ciment CPJ 45 sac 50kg</Text>
          <Text size="small">CIM-047 · Ciment CPJ 45 big-bag</Text>
        </Stack>
        <Row gap={8}>
          <Button variant="primary" onClick={back}>
            Lier les 4 lignes
          </Button>
          <Button variant="ghost" onClick={back}>
            Annuler
          </Button>
        </Row>
      </Stack>
    </div>
  );
}

function ViewCreer({ back }: { back: () => void }) {
  return (
    <div style={{ padding: 16 }}>
      <Stack gap={12}>
        <Text weight="semibold">Créer article allégé · Ciment CPJ 45 (×4)</Text>
        <Callout tone="info" title="3 champs seulement">
          Toujours item tenant — jamais catalogue Sektor. Marqué « à compléter ».
        </Callout>
        <Text size="small" tone="secondary">
          Libellé
        </Text>
        <TextInput value="Ciment CPJ 45" />
        <Text size="small" tone="secondary">
          Nature
        </Text>
        <TextInput value="Matériau" />
        <Text size="small" tone="secondary">
          Unité (préremplie depuis Nature)
        </Text>
        <TextInput value="T" />
        <Text size="small" tone="tertiary">
          Poste budgétaire prérempli depuis Nature · pas de prix forcé ici
        </Text>
        <Row gap={8}>
          <Button variant="primary" onClick={back}>
            Créer et lier ×4
          </Button>
          <Button variant="ghost" onClick={back}>
            Annuler
          </Button>
        </Row>
      </Stack>
    </div>
  );
}

function ViewControlee({ back }: { back: () => void }) {
  return (
    <div style={{ padding: 16 }}>
      <Stack gap={12}>
        <Text weight="semibold">Mode tenant CONTROLEE</Text>
        <Callout tone="warning" title="Le chiffreur n'a pas le droit de créer">
          Bouton « Demander la création ». La saisie LIBRE n&apos;est pas
          perdue en attendant l&apos;approbation référentiel.
        </Callout>
        <Text size="small" tone="secondary">
          Libellé demandé
        </Text>
        <TextInput value="Ciment CPJ 45" />
        <Row gap={8} align="center">
          <Pill size="sm" tone="warning">
            Demande ouverte
          </Pill>
          <Text size="small" tone="secondary">
            Composants restent LIBRE jusqu&apos;à validation
          </Text>
        </Row>
        <Row gap={8}>
          <Button variant="primary" onClick={back}>
            Demander la création
          </Button>
          <Button variant="ghost" onClick={back}>
            Retour rattrapage
          </Button>
        </Row>
      </Stack>
    </div>
  );
}

function ViewVide({ back }: { back: () => void }) {
  return (
    <div style={{ padding: 16 }}>
      <Stack gap={12}>
        <Callout tone="success" title="Liste vide">
          « Amenée et repli » marqué hors_referentiel (×2). Plus jamais dans le
          rattrapage. Les LIBRE restants restent candidats au rapprochement
          auto (L15 — hors lot).
        </Callout>
        <Text weight="semibold">10 composants non rattachés</Text>
        <Text size="small" tone="secondary">
          Après ignore · compteur mis à jour
        </Text>
        <Button variant="secondary" onClick={back}>
          Retour liste
        </Button>
      </Stack>
    </div>
  );
}

export default function EtudeRattrapageLibreWireframe() {
  const [view, setView] = useCanvasState<ViewId>("view", "rattrapage");
  const [modeHint, setModeHint] = useCanvasState<"LIBRE" | "CONTROLEE">(
    "mode",
    "LIBRE",
  );

  return (
    <Stack gap={20} style={{ padding: 20, maxWidth: 920 }}>
      <Stack gap={6}>
        <H1>L9 — Rattrapage LIBRE</H1>
        <Text tone="secondary">
          Wireframe epic referentiel-catalogue-sektor · à valider avant code
        </Text>
      </Stack>

      <Row gap={6} wrap>
        {(
          [
            { id: "saisie" as const, label: "1. Saisie (pas de blocage)" },
            { id: "rattrapage" as const, label: "2. Rattrapage groupé" },
            { id: "rapprocher" as const, label: "3. Rapprocher" },
            { id: "creer" as const, label: "4. Créer allégé" },
            { id: "controlee" as const, label: "5. Mode CONTROLEE" },
            { id: "vide" as const, label: "6. Après Ignorer" },
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
          view === "saisie"
            ? "Saisie composant"
            : view === "rattrapage"
              ? "Fin de dossier · rattrapage"
              : view === "rapprocher"
                ? "Rapprocher"
                : view === "creer"
                  ? "Création allégée"
                  : view === "controlee"
                    ? "Création contrôlée"
                    : "Liste après ignore"
        }
      >
        {view === "saisie" && <ViewSaisie />}
        {view === "rattrapage" && <ViewRattrapage go={setView} />}
        {view === "rapprocher" && (
          <ViewRapprocher back={() => setView("rattrapage")} />
        )}
        {view === "creer" && <ViewCreer back={() => setView("rattrapage")} />}
        {view === "controlee" && (
          <ViewControlee back={() => setView("rattrapage")} />
        )}
        {view === "vide" && <ViewVide back={() => setView("rattrapage")} />}
      </Frame>

      <Divider />

      <H2>Décisions UX (à valider)</H2>
      <Stack gap={8}>
        <Text>
          1. Saisie inconnue → LIBRE sans modal ; « + créer » discret optionnel.
        </Text>
        <Text>
          2. Rattrapage fin de dossier : groupes par libellé similaire ; actions
          Rapprocher / Créer / Ignorer sur le groupe entier.
        </Text>
        <Text>
          3. Ignorer = hors_referentiel définitif sur tous les composants du
          groupe.
        </Text>
        <Text>
          4. Créer = 3 champs (libellé, nature, unité) → item tenant « à
          compléter » + liaison ITEM + gel L5.
        </Text>
        <Text>
          5. Paramètre tenant LIBRE (défaut PME) vs CONTROLEE (« Demander la
          création », saisie conservée).
        </Text>
        <Text>
          6. Hors lot : versement biblio à la validation (L12) · rapprochement
          auto (L15).
        </Text>
      </Stack>

      <Row gap={8} align="center">
        <Text size="small" tone="secondary">
          Mode création illustré :
        </Text>
        <Button
          variant={modeHint === "LIBRE" ? "primary" : "secondary"}
          onClick={() => setModeHint("LIBRE")}
        >
          LIBRE
        </Button>
        <Button
          variant={modeHint === "CONTROLEE" ? "primary" : "secondary"}
          onClick={() => {
            setModeHint("CONTROLEE");
            setView("controlee");
          }}
        >
          CONTROLEE
        </Button>
      </Row>
    </Stack>
  );
}
