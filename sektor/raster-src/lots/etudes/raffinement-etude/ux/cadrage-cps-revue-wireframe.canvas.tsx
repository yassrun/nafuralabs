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

type ViewId = "aujourd-hui" | "revue" | "extraction" | "manuel" | "bloque";

const VIEWS: { id: ViewId; label: string }[] = [
  { id: "aujourd-hui", label: "Aujourd hui" },
  { id: "revue", label: "Cible — revue CPS" },
  { id: "extraction", label: "Extraction" },
  { id: "manuel", label: "Sans CPS / echec" },
  { id: "bloque", label: "Continuer bloque" },
];

type FieldKey =
  | "objet"
  | "moa"
  | "typeAo"
  | "dateLimite"
  | "reference"
  | "ville";

type FieldStatus = "proposed" | "accepted" | "rejected" | "empty";

type FieldSpec = {
  key: FieldKey;
  label: string;
  required?: boolean;
  value: string;
  source?: string;
  fromCps: boolean;
};

const FIELDS: FieldSpec[] = [
  {
    key: "objet",
    label: "Objet",
    required: true,
    value:
      "TRAVAUX DE CONSTRUCTION DE LA PLATEFORME AGROALIMENTAIRE DE RABAT",
    source: "p. 1",
    fromCps: true,
  },
  {
    key: "moa",
    label: "MOA",
    required: true,
    value: "Societe Rabat Region Amenagement",
    source: "p. 2",
    fromCps: true,
  },
  {
    key: "typeAo",
    label: "Type d AO",
    value: "Public",
    source: "p. 1",
    fromCps: true,
  },
  {
    key: "dateLimite",
    label: "Date limite de depot",
    value: "",
    fromCps: false,
  },
  {
    key: "reference",
    label: "Reference AO",
    value: "AOO N A049-RRA-2026",
    source: "p. 1",
    fromCps: true,
  },
  {
    key: "ville",
    label: "Ville",
    value: "",
    fromCps: false,
  },
];

const INITIAL_STATUS: Record<FieldKey, FieldStatus> = {
  objet: "proposed",
  moa: "proposed",
  typeAo: "proposed",
  dateLimite: "empty",
  reference: "proposed",
  ville: "empty",
};

export default function CadrageCpsRevueWireframe() {
  const [view, setView] = useCanvasState<ViewId>("cadrage-cps-revue-view", "revue");

  return (
    <Stack gap={16} style={{ maxWidth: 980, padding: 24 }}>
      <H1>Cadrage — une seule etape, revue CPS</H1>
      <Text tone="secondary">
        Plus de page Nouvelle etude. Le listing ouvre le wizard etape 1.
        Chaque champ deduit du CPS reste une proposition jusqu a Accepter,
        Refuser ou corriger. AC-12 du lot raffinement-etude.
      </Text>

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

      {view === "aujourd-hui" && <VueAujourdHui />}
      {view === "revue" && <VueRevue />}
      {view === "extraction" && <VueExtraction />}
      {view === "manuel" && <VueManuel />}
      {view === "bloque" && <VueBloque />}

      <Spacer />
      <H2>Decisions UX</H2>
      <Text>
        CTA listing = brouillon coquille + wizard etape 1. Charge d etude =
        utilisateur courant s il est ingenieur, sinon a choisir avant import
        CPS. Proposition jamais persistee comme verite (pas d
        appliquerPropositionMarche silencieux). Badge de provenance =
        « IA · CPS », pas « Accepte » : la revue n est pas stockee, seulement
        la valeur. Accepter / Refuser tant que non enregistre. Editer un
        champ propose = l accepter corrige. Enregistrer / Continuer
        confirment les valeurs affichees. Extraction partielle ou echec =
        saisie manuelle, jamais un bandeau unique « verifiez-les ».
      </Text>
    </Stack>
  );
}

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
        border: `1px solid ${t.stroke.primary}`,
        borderRadius: 8,
        overflow: "hidden",
        background: t.bg.elevated,
      }}
    >
      <div
        style={{
          padding: "8px 14px",
          borderBottom: `1px solid ${t.stroke.primary}`,
          fontSize: 12,
          color: t.text.secondary,
        }}
      >
        {title}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

function Stepper({ current }: { current: 1 | 2 | 3 | 4 }) {
  const labels = [
    "1. Cadrage & documents",
    "2. Bordereau",
    "3. Chiffrage",
    "4. Synthese et validation",
  ];
  return (
    <Row gap={8} wrap>
      {labels.map((label, i) => (
        <span key={label}>
          <Pill active={i + 1 === current} size="sm">
            {label}
          </Pill>
        </span>
      ))}
    </Row>
  );
}

function Footer({
  primary,
  primaryDisabled,
  hint,
}: {
  primary: string;
  primaryDisabled?: boolean;
  hint?: string;
}) {
  return (
    <Stack gap={8}>
      {hint ? <Text tone="secondary">{hint}</Text> : null}
      <Row gap={8} justify="end">
        <Button variant="secondary">Enregistrer</Button>
        <Button variant="primary" disabled={primaryDisabled}>
          {primary}
        </Button>
      </Row>
    </Stack>
  );
}

function VueAujourdHui() {
  return (
    <Stack gap={16}>
      <Callout tone="warning" title="Deux ecrans, zero revue">
        La page new pre-remplit objet et MOA sans Accepter / Refuser a
        l ecran (la logique TS n est pas branchee). Le wizard reapplique le
        CPS en silence via appliquerPropositionMarche, puis un seul bandeau
        « verifiez-les ». AC-12 n est pas tenu.
      </Callout>

      <Frame title="Aujourd hui — /etudes/dossiers/new">
        <Stack gap={10}>
          <Text weight="semibold">Nouvelle etude</Text>
          <Text tone="secondary">
            Objet, MOA, charge. CPS optionnel. Puis « Creer et commencer le
            cadrage ».
          </Text>
          <Row gap={8} wrap>
            <Pill size="sm" tone="warning">
              Champs remplis sans geste
            </Pill>
            <Pill size="sm">AO absents de cet ecran</Pill>
          </Row>
        </Stack>
      </Frame>

      <Frame title="Aujourd hui — wizard etape 1 (ecran capture)">
        <Stack gap={10}>
          <Stepper current={1} />
          <Callout tone="info" title="Champs AO preremplis depuis le CPS — verifiez-les.">
            Aucun champ n indique sa provenance. Aucun Accepter / Refuser.
            Date limite, reference et ville restent vides sans dire si le CPS
            n a rien trouve.
          </Callout>
          <Text tone="secondary">
            Objet et MOA ont l air d une saisie humaine. L utilisateur ne
            sait pas quoi trancher.
          </Text>
        </Stack>
      </Frame>
    </Stack>
  );
}

function VueRevue() {
  const [status, setStatus] = useCanvasState<Record<FieldKey, FieldStatus>>(
    "cadrage-cps-revue-fields",
    INITIAL_STATUS,
  );

  const pending = FIELDS.filter((f) => status[f.key] === "proposed").length;

  const setOne = (key: FieldKey, next: FieldStatus) => {
    setStatus((cur) => ({ ...cur, [key]: next }));
  };

  return (
    <Stack gap={16}>
      <Callout tone="info" title={`${pending} proposition${pending > 1 ? "s" : ""} CPS a trancher`}>
        Issues du fichier CPS AOO N A049-RRA-2026.pdf. Accepter tout engage
        les valeurs proposees. Refuser tout les vide. Corriger un champ
        l accepte.
      </Callout>
      <Row gap={8}>
        <Button
          variant="primary"
          disabled={pending === 0}
          onClick={() => {
            setStatus((cur) => {
              const next = { ...cur };
              (Object.keys(next) as FieldKey[]).forEach((k) => {
                if (next[k] === "proposed") next[k] = "accepted";
              });
              return next;
            });
          }}
        >
          Accepter tout
        </Button>
        <Button
          variant="secondary"
          disabled={pending === 0}
          onClick={() => {
            setStatus((cur) => {
              const next = { ...cur };
              (Object.keys(next) as FieldKey[]).forEach((k) => {
                if (next[k] === "proposed") next[k] = "rejected";
              });
              return next;
            });
          }}
        >
          Refuser tout
        </Button>
        <Button
          variant="ghost"
          onClick={() => setStatus(INITIAL_STATUS)}
        >
          Rejouer l extraction
        </Button>
      </Row>

      <Frame title="Wizard etape 1 — identite unique">
        <Stack gap={14}>
          <Stepper current={1} />
          <Text weight="semibold">Importer le CPS</Text>
          <Row gap={8} align="center" wrap>
            <Pill active size="sm">
              CPS AOO N A049-RRA-2026.pdf
            </Pill>
            <Text tone="secondary">Remplacer tant que brouillon</Text>
          </Row>
          <Divider />
          <Text weight="semibold">Identite de l etude</Text>
          <FieldRow
            label="Charge d etude"
            value="QA Owner — qa@nafuralabs.local"
            status="human"
            required
          />
          {FIELDS.map((f) => (
            <div key={f.key}>
              <FieldRow
                label={f.label}
                value={
                  status[f.key] === "rejected" || status[f.key] === "empty"
                    ? ""
                    : f.value
                }
                status={
                  f.fromCps
                    ? status[f.key] === "empty"
                      ? "empty"
                      : status[f.key]
                    : "empty"
                }
                required={f.required}
                source={f.source}
                onAccept={() => setOne(f.key, "accepted")}
                onReject={() => setOne(f.key, "rejected")}
              />
            </div>
          ))}
          <Footer
            primary="Continuer vers le bordereau"
            primaryDisabled={pending > 0}
            hint={
              pending > 0
                ? `Tranchez les ${pending} champs CPS avant de continuer.`
                : undefined
            }
          />
        </Stack>
      </Frame>
    </Stack>
  );
}

function VueExtraction() {
  return (
    <Stack gap={16}>
      <Callout tone="neutral" title="Indexation CPS en cours">
        Le formulaire reste editable. Les champs ne bougent pas tant que
        l extraction n a pas un etat REVIEW. Quitter la page ne perd pas le
        job (AC-15).
      </Callout>
      <Frame title="Wizard etape 1 — extraction">
        <Stack gap={12}>
          <Stepper current={1} />
          <Text weight="semibold">Importer le CPS</Text>
          <Row gap={8} align="center">
            <Pill size="sm">CPS AOO N A049-RRA-2026.pdf</Pill>
            <Pill tone="warning" size="sm">
              Indexation…
            </Pill>
          </Row>
          <Text tone="secondary">
            Objet / MOA encore vides ou placeholders. Pas de preremplissage
            partiel silencieux pendant RUNNING.
          </Text>
          <Footer primary="Continuer vers le bordereau" primaryDisabled hint="Attendez la fin d extraction, ou saisissez a la main et ignorez le CPS." />
        </Stack>
      </Frame>
    </Stack>
  );
}

function VueManuel() {
  return (
    <Stack gap={16}>
      <Callout tone="warning" title="Extraction partielle — continuez en manuel">
        Le CPS est depose. 2 champs proposes, le reste introuvable. Ce n est
        pas un echec total : les propositions restantes se tranchent, le
        reste se saisit.
      </Callout>
      <Frame title="Echec ou NO_RESULT">
        <Stack gap={8}>
          <Text>
            FAILED = relancer l import. UNAVAILABLE / NO_RESULT = voie
            manuelle, meme ecran, aucun bandeau « champs preremplis ».
          </Text>
          <Text tone="secondary">
            Sans PDF : etape 1 est un formulaire vide. Continuer des que
            objet, MOA et charge sont remplis.
          </Text>
        </Stack>
      </Frame>
    </Stack>
  );
}

function VueBloque() {
  return (
    <Stack gap={16}>
      <Callout tone="danger" title="Continuer refuse — 4 propositions non tranchees">
        Le footer reste le seul CTA wizard. Un clic trop tot n ecrase pas
        les propositions en verite dossier. L anomalie est un fait (AC-1),
        pas un toast.
      </Callout>
      <Frame title="Wizard etape 1 — gate">
        <Stack gap={12}>
          <Stepper current={1} />
          <Text>
            Objet, MOA, type AO et reference portent le badge IA · CPS.
            Date limite et ville vides : Non trouve dans le CPS (optionnel).
          </Text>
          <Footer
            primary="Continuer vers le bordereau"
            primaryDisabled
            hint="Acceptez, refusez ou corrigez chaque champ CPS."
          />
        </Stack>
      </Frame>
    </Stack>
  );
}

function FieldRow({
  label,
  value,
  status,
  required,
  source,
  onAccept,
  onReject,
}: {
  label: string;
  value: string;
  status: FieldStatus | "human";
  required?: boolean;
  source?: string;
  onAccept?: () => void;
  onReject?: () => void;
}) {
  const t = useHostTheme();
  const proposed = status === "proposed";
  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: 6,
        border: `1px solid ${proposed ? t.accent.primary : t.stroke.primary}`,
        background: proposed ? t.fill.tertiary : t.bg.editor,
      }}
    >
      <Stack gap={6}>
        <Row gap={8} align="center" justify="space-between" wrap>
          <Row gap={8} align="center" wrap>
            <Text weight="semibold">
              {label}
              {required ? " *" : ""}
            </Text>
            {status === "proposed" && (
              <Pill tone="warning" size="sm">
                IA · CPS {source ?? ""}
              </Pill>
            )}
            {status === "accepted" && (
              <Pill size="sm">
                IA · CPS {source ?? ""}
              </Pill>
            )}
            {status === "rejected" && (
              <Pill size="sm">Saisie manuelle</Pill>
            )}
            {status === "empty" && (
              <Pill size="sm">Non trouve dans le CPS</Pill>
            )}
            {status === "human" && <Pill size="sm">Saisie</Pill>}
          </Row>
          {proposed && (
            <Row gap={6}>
              <Button variant="primary" onClick={onAccept}>
                Accepter
              </Button>
              <Button variant="secondary" onClick={onReject}>
                Refuser
              </Button>
            </Row>
          )}
        </Row>
        <div
          style={{
            padding: "8px 10px",
            borderRadius: 4,
            border: `1px solid ${t.stroke.secondary}`,
            color: value ? t.text.primary : t.text.tertiary,
            fontSize: 13,
          }}
        >
          {value || "—"}
        </div>
      </Stack>
    </div>
  );
}
