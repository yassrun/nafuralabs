import {
  Button,
  Callout,
  Card,
  CardBody,
  CardHeader,
  H1,
  Pill,
  Row,
  Spacer,
  Stack,
  Table,
  Text,
  TextArea,
  TextInput,
  useCanvasState,
} from "cursor/canvas";

/**
 * SSOT Git : nafura-platform/pact/impression/ux/admin-modeles-wireframe.canvas.tsx
 * Preview IDE : canvases/admin-modeles-wireframe.canvas.tsx
 *
 * Décisions UX
 * - Écran admin du tenant, pas le flux « le produit demande une page »
 *   (page-rendue-wireframe reste l'autre canvas)
 * - Liste des contenants du tenant ; `type` est un texte opaque, pas un catalogue
 * - AI-first : proposer un HTML ; l'admin relit et enregistre
 * - Fallback manuel : coller / saisir le HTML sans l'IA ; ou l'API sans cet écran
 * - Pas d'éditeur visuel ni CodeMirror (hors CH)
 * - CTA Enregistrer en bas du formulaire
 * - Autre tenant : liste vide — pas un message « accès refusé » métier
 * - Erreur : un code, pas un texte seul
 */

type ViewId = "liste" | "edition" | "vide" | "autre-tenant" | "erreur";

export default function AdminModelesWireframe() {
  const [view, setView] = useCanvasState<ViewId>("impression-admin-view", "liste");
  const [prompt, setPrompt] = useCanvasState("impression-admin-prompt", "");
  const [html, setHtml] = useCanvasState(
    "impression-admin-html",
    "<p>corps du contenant</p>"
  );

  return (
    <Stack gap={20} style={{ maxWidth: 720 }}>
      <Stack gap={6}>
        <H1>Modèles du tenant</H1>
        <Text tone="secondary">
          Réglages de cette app. L'administrateur modifie le contenant. Le
          produit accroche le type et fournit le sac.
        </Text>
      </Stack>

      <Row gap={8}>
        <Button
          variant={view === "liste" ? "primary" : "secondary"}
          onClick={() => setView("liste")}
        >
          Liste
        </Button>
        <Button
          variant={view === "edition" ? "primary" : "secondary"}
          onClick={() => setView("edition")}
        >
          Édition
        </Button>
        <Button
          variant={view === "vide" ? "primary" : "secondary"}
          onClick={() => setView("vide")}
        >
          Vide
        </Button>
        <Button
          variant={view === "autre-tenant" ? "primary" : "secondary"}
          onClick={() => setView("autre-tenant")}
        >
          Autre tenant
        </Button>
        <Button
          variant={view === "erreur" ? "primary" : "secondary"}
          onClick={() => setView("erreur")}
        >
          Erreur
        </Button>
      </Row>

      <Card>
        <CardHeader
          trailing={
            <Pill tone="neutral" size="sm" active={false}>
              admin-tenant
            </Pill>
          }
        >
          Contenant rangé chez le tenant
        </CardHeader>
        <CardBody>
          <Stack gap={12}>
            {view === "liste" && (
              <Stack gap={8}>
                <Table
                  headers={["Type", "Contenant", ""]}
                  rows={[
                    ["alpha", "HTML du tenant", "Modifier"],
                    ["beta", "HTML du tenant", "Modifier"],
                  ]}
                />
                <Text tone="secondary">
                  `type` est un mot du produit. Cette liste ne le catalogue pas.
                </Text>
              </Stack>
            )}

            {view === "edition" && (
              <Stack gap={12}>
                <Text weight="semibold">Type `alpha`</Text>
                <Text tone="secondary">Texte opaque — pas un document métier.</Text>

                <Stack gap={6}>
                  <Text weight="semibold">Proposer</Text>
                  <TextInput
                    value={prompt}
                    onChange={setPrompt}
                    placeholder="Décrire la page — l'IA propose le HTML"
                  />
                  <Row gap={8}>
                    <Button
                      onClick={() =>
                        setHtml("<p>proposition à relire</p>")
                      }
                    >
                      Proposer
                    </Button>
                  </Row>
                </Stack>

                <Stack gap={6}>
                  <Text weight="semibold">HTML</Text>
                  <TextArea
                    value={html}
                    onChange={setHtml}
                    rows={6}
                    placeholder="Coller le HTML — fallback sans l'IA"
                  />
                </Stack>

                <Row gap={8}>
                  <Button variant="primary">Enregistrer</Button>
                </Row>
              </Stack>
            )}

            {view === "vide" && (
              <Callout tone="neutral" title="Aucun modèle">
                Rien à modifier dans ce tenant. Le produit accroche le
                contenant — pas cette liste.
              </Callout>
            )}

            {view === "autre-tenant" && (
              <Stack gap={8}>
                <Text tone="secondary">Aucun modèle dans ce tenant.</Text>
                <Callout tone="warning" title="Isolation">
                  Les modèles de A ne sont pas listés chez B. Pas un message
                  « accès refusé » métier.
                </Callout>
              </Stack>
            )}

            {view === "erreur" && (
              <Callout tone="danger" title="IMPRESSION_MODELE_INCONNU">
                Le modèle n'est pas dans le tenant courant. Un code, pas un
                texte seul.
              </Callout>
            )}
          </Stack>
        </CardBody>
      </Card>
      <Spacer />
    </Stack>
  );
}
