import {
  Button,
  Callout,
  Divider,
  H1,
  Pill,
  Row,
  Spacer,
  Stack,
  Text,
  useCanvasState,
  useHostTheme,
} from "cursor/canvas";

type ViewId = "listing" | "form-court" | "form-long" | "detail-retour" | "dialog";

const VIEWS: { id: ViewId; label: string }[] = [
  { id: "listing", label: "1 · Listing" },
  { id: "form-court", label: "2 · Form court" },
  { id: "form-long", label: "3 · Form long sticky" },
  { id: "detail-retour", label: "4 · Detail retour" },
  { id: "dialog", label: "5 · Dialog footer" },
];

function Frame({
  title,
  children,
}: {
  title: string;
  children: import("react").ReactNode;
}) {
  const t = useHostTheme();
  return (
    <div
      style={{
        border: `1px solid ${t.stroke}`,
        borderRadius: 8,
        overflow: "hidden",
        background: t.bg,
      }}
    >
      <div
        style={{
          padding: "10px 14px",
          borderBottom: `1px solid ${t.stroke}`,
          fontWeight: 600,
          fontSize: 13,
        }}
      >
        {title}
      </div>
      <div style={{ padding: 14 }}>{children}</div>
    </div>
  );
}

function FakeHeader({ cta }: { cta?: string }) {
  return (
    <Row gap={12} style={{ justifyContent: "space-between", marginBottom: 12 }}>
      <Stack gap={2}>
        <Text weight="semibold">Titre listing</Text>
        <Text tone="secondary" size="small">
          Sous-titre
        </Text>
      </Stack>
      {cta ? (
        <Pill tone="info" active>
          {cta} (primaryAction)
        </Pill>
      ) : null}
    </Row>
  );
}

function FakeFilters() {
  const t = useHostTheme();
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        padding: 8,
        marginBottom: 12,
        background: t.bg,
        border: `1px dashed ${t.stroke}`,
        borderRadius: 6,
      }}
    >
      <Text size="small">Filtres sous header — nf-select / lookupKey</Text>
      <Pill>Statut</Pill>
      <Pill>Chantier (combobox)</Pill>
    </div>
  );
}

function FakeTable() {
  return (
    <Stack gap={4}>
      <Text size="small" tone="secondary">
        nf-entity-listing / table
      </Text>
      <div style={{ height: 72, border: "1px solid #ccc", borderRadius: 4 }} />
    </Stack>
  );
}

function ActionBarDemo({ sticky }: { sticky?: boolean }) {
  const t = useHostTheme();
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 8,
        padding: "10px 0",
        marginTop: 12,
        borderTop: `1px solid ${t.stroke}`,
        ...(sticky
          ? {
              position: "sticky" as const,
              bottom: 0,
              background: t.bg,
            }
          : {}),
      }}
    >
      <Pill>Annuler secondary</Pill>
      <Pill tone="info" active>
        Enregistrer primary
      </Pill>
      {sticky ? (
        <Text size="small" tone="secondary">
          sticky
        </Text>
      ) : null}
    </div>
  );
}

export default function ActionsEtFiltresWireframe() {
  const [view, setView] = useCanvasState<ViewId>("homog-actions-view", "listing");
  const t = useHostTheme();

  return (
    <Stack gap={16} style={{ maxWidth: 920, padding: 24 }}>
      <H1>Homog — actions et filtres</H1>
      <Text tone="secondary">
        CONTRAT homogenisation-ux AC-1…AC-14. Modules : Etudes, Achats, Catalogue,
        Chantiers. Pas Marches. Pas MatDialog→nf-modal.
      </Text>

      <Callout tone="info" title="Ordre barre">
        ghost/secondary → primary a droite. Danger isole. Create listing = header
        primaryAction, jamais dans les filtres.
      </Callout>

      <Row gap={8} wrap>
        {VIEWS.map((v) => (
          <span key={v.id}>
            <Button
              variant={view === v.id ? "primary" : "secondary"}
              onClick={() => setView(v.id)}
            >
              {v.label}
            </Button>
          </span>
        ))}
      </Row>

      <Divider />

      {view === "listing" && (
        <Frame title="Listing — AC-2, AC-7, AC-10">
          <FakeHeader cta="Nouveau" />
          <FakeFilters />
          <FakeTable />
          <Spacer size={8} />
          <Text size="small" tone="secondary">
            Mort : chips + select maison + CTA create dans la toolbar filtres.
          </Text>
        </Frame>
      )}

      {view === "form-court" && (
        <Frame title="Form court — AC-3">
          <FakeHeader />
          <div
            style={{
              height: 100,
              border: `1px dashed ${t.stroke}`,
              borderRadius: 4,
              marginBottom: 8,
            }}
          />
          <Text size="small">champs…</Text>
          <ActionBarDemo />
          <Text size="small" tone="secondary">
            Mort : creer__bouton, nav-actions non anatomy.
          </Text>
        </Frame>
      )}

      {view === "form-long" && (
        <Frame title="Form long — AC-4 sticky">
          <FakeHeader />
          <div
            style={{
              height: 160,
              border: `1px dashed ${t.stroke}`,
              borderRadius: 4,
            }}
          />
          <Text size="small" tone="secondary">
            contenu scrollable…
          </Text>
          <ActionBarDemo sticky />
          <Text size="small" tone="secondary">
            Mort : saisie-page__sticky-bar custom divergent.
          </Text>
        </Frame>
      )}

      {view === "detail-retour" && (
        <Frame title="Detail — AC-1 retour">
          <Row gap={8} style={{ marginBottom: 12 }}>
            <Pill>← Retour liste (nf-button + arrow-left)</Pill>
          </Row>
          <Text weight="semibold">Fiche entite</Text>
          <Text size="small" tone="secondary">
            Mort : link-button / linklike.
          </Text>
        </Frame>
      )}

      {view === "dialog" && (
        <Frame title="Dialog footer — AC-5, AC-6">
          <div
            style={{
              height: 80,
              border: `1px dashed ${t.stroke}`,
              borderRadius: 4,
              marginBottom: 12,
            }}
          />
          <Row gap={8} style={{ justifyContent: "flex-end" }}>
            <Pill>Annuler</Pill>
            <Pill tone="info" active>
              Enregistrer
            </Pill>
          </Row>
          <Spacer size={8} />
          <Text size="small" tone="secondary">
            Delete = danger + ConfirmDialog, pas button.danger brut.
          </Text>
        </Frame>
      )}
    </Stack>
  );
}
