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
  Stack,
  Stat,
  Table,
  Text,
  useCanvasState,
  useHostTheme,
} from "cursor/canvas";

/**
 * Socle Raster — le panneau de décision. SSOT: raster/pact/socle/ux/decision-wireframe.canvas.tsx
 * Preview: canvases/decision-wireframe.canvas.tsx
 *
 * Remplace le détail actuel (select de status + CTA « Lancer agent » dominant),
 * inadapté au mode autonome : en autonome tu ne pilotes plus, tu arbitres.
 *
 * Décisions UX
 * - Nav gagne **Toi** en tête, avec compteur — la seule vue qui te concerne en autonome
 * - Une task qui t'attend affiche **la question d'abord**, avant l'identité et le fichier
 * - `gate: me` devient un **bandeau**, pas une pilule parmi quatre (P1 · agent · gate · backlog)
 * - **Plus de select de status** : `done-me` est le résultat d'une approbation (AGENTS.md §0.1-8)
 * - Le **rapport de livraison** est affiché — aujourd'hui l'app le jette (elle ne lit que le frontmatter)
 * - CTA humain > CTA agent : quand ça t'attend, « Lancer » disparaît
 * - Readiness visible en liste : lançable · bloqué par · attend l'externe (AGENTS.md §7)
 * - Métadonnées et chemin de fichier **repliés** — ils servent au debug, pas à la décision
 * - Fallback manuel : ouvrir le .md · `node raster/t.mjs check`
 */

type StateId = "toi" | "question" | "courant" | "externe";

const ETAT_LABEL: Record<StateId, string> = {
  toi: "Attend ton approbation",
  question: "Question bloquante",
  courant: "Rien ne t'attend",
  externe: "Bloqué dehors",
};

export default function DecisionWireframe() {
  const [state, setState] = useCanvasState<StateId>("decision-state", "toi");
  const { accent } = useHostTheme();

  return (
    <Stack gap={16} style={{ maxWidth: 920 }}>
      <H1>Raster — panneau de décision</H1>
      <Text tone="secondary">
        En mode autonome tu n'appuies plus sur « Lancer ». Tu arbitres. L'écran
        doit donc répondre à une seule question : qu'est-ce qui m'attend, et
        que me demande-t-on ?
      </Text>

      <Nav state={state} setState={setState} />
      <Divider />

      {state === "toi" ? <AttenteView accent={accent} /> : null}
      {state === "question" ? <QuestionView accent={accent} /> : null}
      {state === "courant" ? <CourantView accent={accent} /> : null}
      {state === "externe" ? <ExterneView /> : null}

      <Divider />
      <Callout tone="neutral" title="Fallback manuel">
        Tout reste dans le fichier. Ouvrir le `.md`, répondre sous
        `## Question`, puis `node raster/t.mjs check`. L'UI n'est jamais un
        passage obligé.
      </Callout>
    </Stack>
  );
}

/** Nav — « Toi » en tête. Les autres vues sont des listes ; celle-ci est une file d'attente. */
function Nav({
  state,
  setState,
}: {
  state: StateId;
  setState: (s: StateId) => void;
}) {
  return (
    <Stack gap={8}>
      <Row gap={8}>
        <Button variant="primary">Toi · 3</Button>
        <Button variant="secondary">Inbox</Button>
        <Button variant="secondary">Backlog</Button>
        <Button variant="secondary">En cours · 7</Button>
        <Button variant="secondary">Done agent</Button>
      </Row>
      <Text size="small" tone="secondary">
        « Sprint » cède la tête à « Toi » et « En cours ». La semaine ISO n'est
        plus l'unité de pilotage — la borne l'est.
      </Text>
      <Row gap={6}>
        {(Object.keys(ETAT_LABEL) as StateId[]).map((id) => (
          <Button
            key={id}
            size="sm"
            variant={state === id ? "primary" : "secondary"}
            onClick={() => setState(id)}
          >
            {ETAT_LABEL[id]}
          </Button>
        ))}
      </Row>
    </Stack>
  );
}

/** État central : la task t'attend. La question passe avant tout le reste. */
function AttenteView({ accent }: { accent: string }) {
  return (
    <Stack gap={12}>
      <H2>Toi — 3 en attente</H2>
      <Row gap={8}>
        <Stat value="1" label="approbation" />
        <Stat value="1" label="question" />
        <Stat value="1" label="bloqué dehors" />
      </Row>

      <Table
        headers={["", "ID", "Ce qu'on te demande", "Depuis"]}
        rows={[
          ["◆", "RAS-78", "Approuver — CADRE patché", "2 h"],
          ["?", "RAS-81", "Trancher — spawn ou brief", "20 min"],
          ["✕", "RAS-84", "Attend Vault (externe)", "1 j"],
        ]}
      />
      <Text size="small" tone="secondary">
        Trié par ancienneté, pas par priorité : ce qui t'attend depuis
        longtemps bloque des agents.
      </Text>

      <Card>
        <CardHeader
          trailing={
            <Row gap={6}>
              <Pill size="sm" tone="warning">
                ta décision
              </Pill>
            </Row>
          }
        >
          RAS-78 — Porter le mode autonome dans le CADRE
        </CardHeader>
        <CardBody>
          <Stack gap={12}>
            <Callout tone="warning" title="Question">
              <Stack gap={6}>
                <Text>
                  « Pas de base, pas d'auth » — on la tient, ou on la remplace ?
                </Text>
                <Text size="small">
                  <strong>A</strong> — tenue : l'app ne spawn jamais, le skill
                  lance depuis le terminal.
                </Text>
                <Text size="small">
                  <strong>B</strong> — remplacée : dire ce que l'exécution
                  ajoute comme prérequis (processus, clés).
                </Text>
                <Text size="small" style={{ color: accent }}>
                  Recommandé : B — la décision 7 fait déjà lancer l'app.
                </Text>
              </Stack>
            </Callout>

            <Row gap={8}>
              <Button variant="primary">A</Button>
              <Button variant="primary">B</Button>
              <Button variant="secondary">Répondre autre chose…</Button>
            </Row>
            <Text size="small" tone="secondary">
              Ta réponse s'écrit sous `## Question` et repasse la main à
              l'agent. Pas de select de status : `done-me` viendra de
              l'approbation, jamais d'un menu.
            </Text>

            <Divider />

            <Text size="small" tone="secondary">
              ▾ Rapport de livraison — ce que l'agent a décidé sans toi
            </Text>
            <Table
              headers={["", ""]}
              rows={[
                ["ce qui a changé", "CADRE : owns conduite parallèle + borne"],
                ["critères prouvés", "AC-1 · AC-3 · AC-4 — revue humaine"],
                ["décidé seul", "orchestration reste dans work (pas de BC)"],
                ["écarts / dette", "AC-2 non tranché — c'est la question"],
              ]}
            />
            <Row gap={8}>
              <Button variant="primary">Approuver → done-me</Button>
              <Button variant="secondary">Renvoyer à l'agent</Button>
            </Row>

            <Text size="small" tone="secondary">
              ▸ Identité · fichier · étapes · journal (replié)
            </Text>
          </Stack>
        </CardBody>
      </Card>
    </Stack>
  );
}

/** Question bloquante pendant l'exécution — l'agent n'attend pas une permission, il ne peut pas trancher. */
function QuestionView({ accent }: { accent: string }) {
  return (
    <Stack gap={12}>
      <H2>RAS-81 — l'agent ne peut pas trancher</H2>
      <Card>
        <CardHeader trailing={<Pill size="sm" tone="warning">ta décision</Pill>}>
          Question bloquante · agent en pause · sous-lot arrêté
        </CardHeader>
        <CardBody>
          <Stack gap={10}>
            <Callout tone="warning" title="Question">
              Le spawn passe par le serveur Vite ou par un process séparé ?
            </Callout>
            <Text size="small" style={{ color: accent }}>
              Une question bloquante n'est <strong>pas</strong> une demande de
              permission — l'agent a le droit d'agir seul (§0.1-2). Elle dit :
              indécidable sans toi. Si l'écran ne fait pas cette différence, tu
              réponds « oui » à tout et l'autonomie meurt.
            </Text>
            <Row gap={8}>
              <Button variant="primary">Répondre</Button>
              <Button variant="secondary">Voir le sous-lot arrêté</Button>
            </Row>
            <Text size="small" tone="secondary">
              Impact affiché : 2 tasks en série derrière, 1 exec en pause.
            </Text>
          </Stack>
        </CardBody>
      </Card>
    </Stack>
  );
}

/** Task courante : rien ne t'attend. L'écran doit être calme et ne rien réclamer. */
function CourantView({ accent }: { accent: string }) {
  return (
    <Stack gap={12}>
      <H2>RAS-79 — en cours, sans toi</H2>
      <Card>
        <CardHeader
          trailing={
            <Row gap={6}>
              <Pill size="sm">tech</Pill>
              <Pill size="sm" tone="info">
                exec
              </Pill>
              <Pill size="sm" tone="success">
                lançable
              </Pill>
            </Row>
          }
        >
          Commandes d'écriture `t.mjs`
        </CardHeader>
        <CardBody>
          <Stack gap={10}>
            <Text size="small" tone="secondary">
              gate: none — cette task ne te reviendra jamais. À `done-agent`
              elle passe `done-me` et sort du dépôt.
            </Text>
            <Text size="small" style={{ color: accent }}>
              Aucun bouton primaire ici. Un écran qui propose une action sur
              une task qui ne t'attend pas te réapprend à cliquer.
            </Text>
            <Divider />
            <Text size="small" tone="secondary">
              ▸ Étapes · journal · fichier (replié)
            </Text>
          </Stack>
        </CardBody>
      </Card>
    </Stack>
  );
}

/** blocked = externe uniquement (AGENTS.md §7). Le blocage interne est calculé, jamais affiché comme un état posé. */
function ExterneView() {
  return (
    <Stack gap={12}>
      <H2>RAS-84 — bloqué dehors</H2>
      <Card>
        <CardHeader trailing={<Pill size="sm" tone="neutral">externe</Pill>}>
          Attend une clé Vault
        </CardHeader>
        <CardBody>
          <Stack gap={10}>
            <Callout tone="neutral" title="Question">
              Qui demande la clé — toi ou l'ops ? Rien n'avance tant que ce
              n'est pas dit.
            </Callout>
            <Text size="small" tone="secondary">
              `status: blocked` ne sert qu'à ça : quelque chose que Raster ne
              voit pas. Un bloqueur interne (`blocked_by:`) n'apparaît jamais
              ici — il est <strong>calculé</strong>, et se lit « bloqué par
              RAS-79 » dans la liste.
            </Text>
            <Row gap={8}>
              <Button variant="primary">Débloquer</Button>
              <Button variant="secondary">Voir le sous-lot</Button>
            </Row>
          </Stack>
        </CardBody>
      </Card>
    </Stack>
  );
}
