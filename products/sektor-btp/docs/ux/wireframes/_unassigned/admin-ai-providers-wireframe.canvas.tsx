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

type View = "list" | "saved" | "missing-key";

const PROVIDERS = [
  {
    id: "gemini",
    name: "Google Gemini",
    models: ["gemini-2.5-flash", "gemini-2.0-flash"],
    keyOk: true,
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    models: ["deepseek-v4-flash", "deepseek-v4-pro"],
    keyOk: true,
  },
] as const;

/**
 * UX wireframe — Administration → Providers AI
 * Décisions:
 * - Liste providers configurés (clé env/Vault) ; switch runtime sans redémarrage
 * - Clés API jamais saisies dans l’UI MVP (env/Vault) — seul provider+modèle en DB tenant
 * - Fallback manuel: AI_PROVIDER env si aucun choix tenant
 * - Scope: tenant (tenant_setting app.ai.*)
 */
export default function AdminAiProvidersWireframe() {
  const theme = useHostTheme();
  const [view, setView] = useCanvasState<View>("view", "list");
  const [active, setActive] = useCanvasState<string>("active", "gemini");
  const [model, setModel] = useCanvasState<string>("model", "gemini-2.5-flash");

  const selected = PROVIDERS.find((p) => p.id === active) ?? PROVIDERS[0];

  return (
    <Stack gap={16} style={{ padding: 20, maxWidth: 720 }}>
      <Stack gap={4}>
        <H1>Providers AI</H1>
        <Text tone="secondary" size="small">
          Administration · switch runtime · clés hors UI (env / Vault)
        </Text>
      </Stack>

      <Row gap={8}>
        <Button
          variant={view === "list" ? "primary" : "secondary"}
          onClick={() => setView("list")}
        >
          Écran principal
        </Button>
        <Button
          variant={view === "saved" ? "primary" : "secondary"}
          onClick={() => setView("saved")}
        >
          Après enregistrement
        </Button>
        <Button
          variant={view === "missing-key" ? "primary" : "secondary"}
          onClick={() => setView("missing-key")}
        >
          Clé manquante
        </Button>
      </Row>

      <Divider />

      {view === "missing-key" ? (
        <Callout tone="warning" title="DeepSeek non utilisable">
          AI_DEEPSEEK_API_KEY absente. Provider listé mais non sélectionnable jusqu’à
          configuration env / Vault.
        </Callout>
      ) : null}

      {view === "saved" ? (
        <Callout tone="success" title="Actif">
          {active} · {model} — les prochains appels conversation / agent / extraction
          utilisent ce provider.
        </Callout>
      ) : null}

      <H2>Provider actif</H2>
      <Stack gap={10}>
        {PROVIDERS.map((p) => {
          const selectedRow = active === p.id;
          const disabled = view === "missing-key" && p.id === "deepseek";
          return (
            <Stack
              key={p.id}
              gap={8}
              style={{
                border: `1px solid ${theme.stroke}`,
                borderRadius: 8,
                padding: 12,
                background: selectedRow ? theme.control.bg : undefined,
              }}
            >
              <Row gap={8} align="center" justify="space-between">
                <Row gap={8} align="center">
                  <Text weight="semibold">{p.name}</Text>
                  {selectedRow ? <Pill tone="success">Actif</Pill> : null}
                  {p.keyOk && !(view === "missing-key" && p.id === "deepseek") ? (
                    <Pill tone="neutral">Clé OK</Pill>
                  ) : (
                    <Pill tone="warning">Clé manquante</Pill>
                  )}
                </Row>
                <Button
                  variant={selectedRow ? "primary" : "secondary"}
                  disabled={disabled}
                  onClick={() => {
                    if (disabled) return;
                    setActive(p.id);
                    setModel(p.models[0]);
                  }}
                >
                  {selectedRow ? "Sélectionné" : "Utiliser"}
                </Button>
              </Row>
              {selectedRow ? (
                <Stack gap={4}>
                  <H3>Modèle</H3>
                  <Row gap={8}>
                    {p.models.map((m) => (
                      <Button
                        key={m}
                        size="small"
                        variant={model === m ? "primary" : "secondary"}
                        onClick={() => setModel(m)}
                      >
                        {m}
                      </Button>
                    ))}
                  </Row>
                </Stack>
              ) : null}
            </Stack>
          );
        })}
      </Stack>

      <Spacer height={8} />
      <Row gap={8} justify="end">
        <Button
          variant="primary"
          onClick={() => setView("saved")}
          disabled={view === "missing-key" && active === "deepseek"}
        >
          Enregistrer
        </Button>
      </Row>

      <Divider />
      <Text size="small" tone="secondary">
        Fallback manuel : si aucun choix tenant → AI_PROVIDER / AI_*_MODEL env. Pas de
        saisie de secret dans cet écran (MVP).
      </Text>
      <Text size="small" tone="secondary">
        Cycle : liste → choisir provider → modèle → Enregistrer → toast / pill Actif.
      </Text>
    </Stack>
  );
}
