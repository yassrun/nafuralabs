import {
  Button,
  Callout,
  Card,
  CardBody,
  CardHeader,
  Divider,
  H1,
  H2,
  Pill,
  Row,
  Spacer,
  Stack,
  Table,
  Text,
  useCanvasState,
  useHostTheme,
} from "cursor/canvas";

type ViewId = "chrome" | "etats" | "bordereau" | "synthese" | "eviter";

const VIEWS: { id: ViewId; label: string }[] = [
  { id: "chrome", label: "Chrome 3 bandes" },
  { id: "etats", label: "Etats stepper" },
  { id: "bordereau", label: "Sur le bordereau" },
  { id: "synthese", label: "Synthese + cout incomplet" },
  { id: "eviter", label: "A eviter" },
];

type StepKind = "done" | "current" | "todo" | "incomplete";

type StepSpec = {
  n: number;
  label: string;
  kind: StepKind;
};

export default function DossierChromeStepperWireframe() {
  const [view, setView] = useCanvasState<ViewId>(
    "dossier-chrome-stepper-view",
    "chrome",
  );

  return (
    <Stack gap={16} style={{ maxWidth: 980, padding: 24 }}>
      <H1>Etude — chrome et stepper</H1>
      <Text tone="secondary">
        L en-tete dit qui est le dossier. La barre d actions dit quoi faire.
        Le stepper dit ou je suis. Trois bandes, pas un seul bloc.
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

      {view === "chrome" && <VueChrome />}
      {view === "etats" && <VueEtats />}
      {view === "bordereau" && <VueBordereau />}
      {view === "synthese" && <VueSynthese />}
      {view === "eviter" && <VueEviter />}

      <Spacer />
      <H2>Decisions UX</H2>
      <Text>
        Pas trois couleurs de remplissage. Position = forme (check, numero
        plein, numero fantome). Sante = badge warning sur une etape deja
        visitee. CTA wizard uniquement dans le footer. Header = infos + KPI
        (statut, pas la phase du stepper).
        Action bar = secondaires + un primary dossier, jamais le meme Soumettre
        qu en bas.
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
      {children}
    </div>
  );
}

function Band({
  label,
  children,
}: {
  label: string;
  children: import("react").ReactNode;
}) {
  const t = useHostTheme();
  return (
    <div
      style={{
        padding: "10px 14px",
        borderBottom: `1px solid ${t.stroke.secondary}`,
      }}
    >
      <Text size="small" tone="tertiary">
        {label}
      </Text>
      <div style={{ marginTop: 6 }}>{children}</div>
    </div>
  );
}

function CheckMark({ stroke }: { stroke: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path
        d="M2.2 6.2 L4.6 8.6 L9.8 3.4"
        fill="none"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StepDot({ kind, n }: { kind: StepKind; n: number }) {
  const t = useHostTheme();
  const size = 24;
  const base: import("react").CSSProperties = {
    width: size,
    height: size,
    borderRadius: 9999,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 600,
    flexShrink: 0,
    position: "relative",
  };

  if (kind === "current") {
    return (
      <span
        style={{
          ...base,
          background: t.accent.primary,
          color: t.text.onAccent,
        }}
      >
        {n}
      </span>
    );
  }

  if (kind === "done") {
    return (
      <span
        style={{
          ...base,
          background: t.fill.tertiary,
          border: `1px solid ${t.stroke.primary}`,
        }}
      >
        <CheckMark stroke={t.text.primary} />
      </span>
    );
  }

  if (kind === "incomplete") {
    return (
      <span style={{ position: "relative", display: "inline-flex" }}>
        <span
          style={{
            ...base,
            background: t.fill.tertiary,
            border: `1px solid ${t.stroke.primary}`,
          }}
        >
          <CheckMark stroke={t.text.primary} />
        </span>
        <span
          style={{
            position: "absolute",
            top: -4,
            right: -6,
            minWidth: 14,
            height: 14,
            borderRadius: 9999,
            background: t.bg.elevated,
            border: `1px solid ${t.stroke.primary}`,
            fontSize: 9,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: t.text.primary,
          }}
        >
          !
        </span>
      </span>
    );
  }

  return (
    <span
      style={{
        ...base,
        background: "transparent",
        border: `1px solid ${t.stroke.secondary}`,
        color: t.text.tertiary,
      }}
    >
      {n}
    </span>
  );
}

function Connector({ filled }: { filled: boolean }) {
  const t = useHostTheme();
  return (
    <span
      style={{
        width: 28,
        height: 1,
        background: filled ? t.stroke.primary : t.stroke.tertiary,
        flexShrink: 0,
      }}
    />
  );
}

function Stepper({ steps }: { steps: StepSpec[] }) {
  const t = useHostTheme();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
      {steps.map((step, i) => {
        const next = steps[i + 1];
        const filledLine =
          (step.kind === "done" || step.kind === "incomplete") &&
          next != null &&
          next.kind !== "todo";
        const current = step.kind === "current";
        const muted = step.kind === "todo";
        return (
          <span
            key={step.n}
            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <StepDot kind={step.kind} n={step.n} />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: current ? 600 : 400,
                  color: current
                    ? t.accent.primary
                    : muted
                      ? t.text.tertiary
                      : t.text.primary,
                }}
              >
                {step.label}
              </span>
            </span>
            {i < steps.length - 1 ? <Connector filled={filledLine} /> : null}
          </span>
        );
      })}
    </div>
  );
}

function FooterWizard({ primary }: { primary: string }) {
  return (
    <Row justify="space-between" align="center">
      <Button variant="secondary">Precedent</Button>
      <Button variant="primary">{primary}</Button>
    </Row>
  );
}

function VueChrome() {
  return (
    <Stack gap={12}>
      <Callout tone="info" title="Ce qui est mele aujourd hui">
        Identite, badges, KPI, Partager, Reouvrir et Soumettre
        vivent dans le meme header. Le footer wizard reaffiche Soumettre.
        Deux primary pour la meme intention.
      </Callout>
      <Frame title="DE-0263 — detail etude">
        <Band label="1 · En-tete infos — lecture seule">
          <Stack gap={6}>
            <Row gap={8} align="center" wrap>
              <Text weight="semibold">DE-0263 — QA overlay</Text>
              <Pill size="sm">En etude</Pill>
              <Pill size="sm">Structure figee</Pill>
              <Pill size="sm">Client a lier au devis</Pill>
            </Row>
            <Row gap={16}>
              <Text size="small" tone="secondary">
                Total HT 1 275 MAD
              </Text>
              <Text size="small" tone="secondary">
                Postes 1
              </Text>
              <Text size="small" tone="secondary">
                Anomalies etape 2 : 0
              </Text>
            </Row>
          </Stack>
        </Band>
        <Band label="2 · Action bar — secondaires a gauche, un primary dossier a droite">
          <Row justify="space-between" align="center" wrap>
            <Row gap={8} wrap>
              <Button variant="ghost">Partager</Button>
              <Button variant="ghost">Reouvrir le bordereau</Button>
            </Row>
            <Button variant="secondary">Voir la synthese</Button>
          </Row>
        </Band>
        <Band label="3 · Stepper — ou je suis, pas les boutons">
          <Stepper
            steps={[
              { n: 1, label: "Cadrage", kind: "done" },
              { n: 2, label: "Bordereau", kind: "current" },
              { n: 3, label: "Cout", kind: "todo" },
              { n: 4, label: "Synthese", kind: "todo" },
            ]}
          />
        </Band>
        <div style={{ padding: "14px" }}>
          <Text size="small" tone="secondary">
            Corps de l etape — arbre du bordereau, gates, warnings.
          </Text>
          <div style={{ height: 8 }} />
          <FooterWizard primary="Continuer vers le cout" />
        </div>
      </Frame>
      <Text tone="secondary">
        Soumettre le chiffrage n apparait que dans le footer, a l etape 4.
        Le header n a pas de second Soumettre.
      </Text>
    </Stack>
  );
}

function VueEtats() {
  return (
    <Stack gap={12}>
      <Callout tone="warning" title="Incomplet n est pas a venir">
        Gris = je n y suis pas encore. Warning = j y suis deja passe et
        quelque chose manque. Deux signaux, pas une troisieme couleur de
        cercle.
      </Callout>
      <Table
        headers={["Etat", "Signifie", "Rendu", "Couleur"]}
        rows={[
          [
            "Complet / passe",
            "J ai quitte cette etape",
            "Cercle + check",
            "Neutre. Le check porte le message.",
          ],
          [
            "En cours",
            "Je suis ici",
            "Cercle plein + numero",
            "Accent (bleu). Seule teinte du stepper.",
          ],
          [
            "A venir",
            "Pas encore ouvert",
            "Cercle fantome + numero",
            "Gris. Absence de couleur.",
          ],
          [
            "Incomplet",
            "Visite, gate warning ou blocking",
            "Check + badge !",
            "Badge, pas un cercle orange.",
          ],
        ]}
      />
      <H2>Les quatre rendus, cote a cote</H2>
      <Card>
        <CardHeader>Legende stepper</CardHeader>
        <CardBody>
          <Stack gap={10}>
            <Row gap={10} align="center">
              <StepDot kind="done" n={1} />
              <Text>Complet — check, plus de numero</Text>
            </Row>
            <Row gap={10} align="center">
              <StepDot kind="current" n={2} />
              <Text>En cours — numero dans l accent</Text>
            </Row>
            <Row gap={10} align="center">
              <StepDot kind="todo" n={3} />
              <Text>A venir — contour, label mute</Text>
            </Row>
            <Row gap={10} align="center">
              <StepDot kind="incomplete" n={3} />
              <Text>
                Incomplet — meme check, plus un ! . Le vert actuel ment si
                des prix manuels restent.
              </Text>
            </Row>
          </Stack>
        </CardBody>
      </Card>
    </Stack>
  );
}

function VueBordereau() {
  return (
    <Stack gap={12}>
      <Callout tone="info" title="Cas de la capture Bordereau">
        Etape 1 passee = check. Etape 2 = bleu, je suis la. 3 et 4 restent
        fantomes. Pas de vert sur 1 : le check suffit.
      </Callout>
      <Frame title="Etape 2 — Bordereau">
        <Band label="En-tete infos">
          <Row gap={8} align="center" wrap>
            <Text weight="semibold">DE-0263 — QA overlay</Text>
            <Pill size="sm" active>
              Validee
            </Pill>
            <Text size="small" tone="secondary">
              Total HT 1 275 MAD · Postes 1 · Anomalies etape 2 : 0
            </Text>
          </Row>
        </Band>
        <Band label="Action bar">
          <Row justify="space-between" wrap>
            <Row gap={8}>
              <Button variant="ghost">Partager</Button>
            </Row>
            <Button variant="secondary">Voir la synthese</Button>
          </Row>
        </Band>
        <Band label="Stepper">
          <Stepper
            steps={[
              { n: 1, label: "Cadrage & documents", kind: "done" },
              { n: 2, label: "Bordereau", kind: "current" },
              { n: 3, label: "Cout", kind: "todo" },
              { n: 4, label: "Synthese et validation", kind: "todo" },
            ]}
          />
        </Band>
        <div style={{ padding: 14 }}>
          <Text weight="semibold">Bordereau — edition manuelle de l arbre</Text>
          <Text size="small" tone="secondary">
            LOT 01 GO · ART. 01.01.01 Ciment
          </Text>
          <div style={{ height: 12 }} />
          <FooterWizard primary="Continuer vers le cout" />
        </div>
      </Frame>
    </Stack>
  );
}

function VueSynthese() {
  return (
    <Stack gap={12}>
      <Callout tone="warning" title="Cas de la capture Synthese">
        Aujourd hui 1, 2 et 3 sont verts alors que le cout a encore des prix
        manuels. Le stepper ment. Coût reste check + ! . Le warning du corps
        et le badge d etape disent la meme chose.
      </Callout>
      <Frame title="Etape 4 — Synthese et validation">
        <Band label="En-tete infos">
          <Row gap={8} align="center" wrap>
            <Text weight="semibold">DE-0263 — QA overlay</Text>
            <Pill size="sm">En etude</Pill>
            <Text size="small" tone="secondary">
              Total HT 1 275 MAD · Marge 21,6 %
            </Text>
          </Row>
        </Band>
        <Band label="Action bar — pas de Soumettre ici">
          <Row justify="space-between" wrap>
            <Row gap={8}>
              <Button variant="ghost">Partager</Button>
              <Button variant="ghost">Reouvrir le bordereau</Button>
            </Row>
          </Row>
        </Band>
        <Band label="Stepper">
          <Stepper
            steps={[
              { n: 1, label: "Cadrage", kind: "done" },
              { n: 2, label: "Bordereau", kind: "done" },
              { n: 3, label: "Cout", kind: "incomplete" },
              { n: 4, label: "Synthese et validation", kind: "current" },
            ]}
          />
        </Band>
        <div style={{ padding: 14 }}>
          <Callout tone="warning" title="Certains prix restent manuels">
            0 / 1 composant consulte. Vous pouvez tout de meme soumettre.
            Le ! sur Cout pointe ici, pas un cercle orange.
          </Callout>
          <div style={{ height: 12 }} />
          <FooterWizard primary="Soumettre le chiffrage" />
        </div>
      </Frame>
    </Stack>
  );
}

function VueEviter() {
  return (
    <Stack gap={12}>
      <H2>Trois couleurs de cercle</H2>
      <Text>
        Vert = passe, bleu = ici, orange = incomplet. Ca entre en collision
        avec les badges du header (En etude, Validee) et avec le warning du
        corps. Daltonisme : vert et orange tombent. Surtout, le vert actuel
        veut dire « j ai clique Continuer », pas « les donnees sont saines ».
      </Text>
      <Card>
        <CardHeader>Regle</CardHeader>
        <CardBody>
          <Stack gap={8}>
            <Text>
              Maximum une teinte sur le stepper : l accent de l etape
              courante.
            </Text>
            <Text>
              Complet = check. A venir = fantome. Incomplet = badge sur une
              etape deja visitee.
            </Text>
            <Text>
              Anomalie detaillee = gate dans le corps + KPI « Anomalies etape
              N ». Le stepper ne recopie pas le paragraphe d avertissement.
            </Text>
          </Stack>
        </CardBody>
      </Card>
      <H2>Actions dans l en-tete infos</H2>
      <Text>
        Partager / Reouvrir colles aux badges et au Total HT.
        Le CTA primary du header double le footer. Resultat : on ne sait
        plus si on lit un etat ou si on agit.
      </Text>
      <Table
        headers={["Bande", "Contient", "Ne contient pas"]}
        rows={[
          [
            "En-tete infos",
            "Titre, badges, meta, KPI",
            "Boutons",
          ],
          [
            "Action bar",
            "Ghost secondaires + 1 primary dossier",
            "KPI, badges de statut",
          ],
          [
            "Stepper",
            "Position + badge sante",
            "Soumettre, Partager",
          ],
          [
            "Footer wizard",
            "Precedent / Continuer / Soumettre",
            "Actions dossier (Partager…)",
          ],
        ]}
      />
    </Stack>
  );
}
