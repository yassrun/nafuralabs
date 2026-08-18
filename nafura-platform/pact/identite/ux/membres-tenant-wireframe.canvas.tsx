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
 * SSOT Git : nafura-platform/pact/identite/ux/membres-tenant-wireframe.canvas.tsx
 * Preview IDE : canvases/membres-tenant-wireframe.canvas.tsx
 *
 * Décisions UX
 * - Écran admin du tenant : liste des membres, pas un « qui est connecté » produit
 * - Inviter est manuel (email + code de rôle + message) — l'IA n'a pas de place ici
 * - Fallback : l'API sans cet écran ; accepter l'invitation est public (jeton), pas cet écran
 * - Le code de rôle est un texte du tenant, pas un métier produit
 * - Autre tenant : liste vide — pas un message « accès refusé » métier
 * - CTA Inviter en tête de liste ; actions de cycle (suspendre / relancer / retirer) sur la ligne
 * - Pas d'écran platform « accepter l'invitation » : ça vit chez le produit
 */

type ViewId = "liste" | "inviter" | "detail" | "vide" | "autre-tenant";

export default function MembresTenantWireframe() {
  const [view, setView] = useCanvasState<ViewId>("identite-membres-view", "liste");
  const [email, setEmail] = useCanvasState("identite-invite-email", "");
  const [message, setMessage] = useCanvasState("identite-invite-message", "");

  return (
    <Stack gap={20} style={{ maxWidth: 720 }}>
      <Stack gap={6}>
        <H1>Membres du tenant</H1>
        <Text tone="secondary">
          Réglages de cette app. L'administrateur voit qui est membre de son
          tenant. Le produit n'authentifie pas.
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
          variant={view === "inviter" ? "primary" : "secondary"}
          onClick={() => setView("inviter")}
        >
          Inviter
        </Button>
        <Button
          variant={view === "detail" ? "primary" : "secondary"}
          onClick={() => setView("detail")}
        >
          Fiche
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
      </Row>

      <Card>
        <CardHeader
          trailing={
            <Pill tone="neutral" size="sm" active={false}>
              admin-tenant
            </Pill>
          }
        >
          Membres du tenant
        </CardHeader>
        <CardBody>
          <Stack gap={12}>
            {view === "liste" && (
              <Stack gap={8}>
                <Row gap={8}>
                  <Button variant="primary" onClick={() => setView("inviter")}>
                    Inviter
                  </Button>
                </Row>
                <Table
                  headers={["Personne", "Rôle", "Statut", ""]}
                  rows={[
                    ["Ada — ada@a.test", "un code du tenant", "active", "Fiche"],
                    ["Bo — bo@a.test", "un code du tenant", "invitée", "Relancer"],
                    ["Cy — cy@a.test", "un code du tenant", "suspendue", "Réactiver"],
                  ]}
                />
                <Text tone="secondary">
                  Le code de rôle est un texte. Cette liste ne catalogue pas ce
                  qu'il autorise.
                </Text>
              </Stack>
            )}

            {view === "inviter" && (
              <Stack gap={12}>
                <Text weight="semibold">Inviter une personne</Text>
                <Text tone="secondary">
                  Manuel : email + un code de rôle du tenant. Pas d'IA.
                </Text>
                <TextInput
                  value={email}
                  onChange={setEmail}
                  placeholder="email de la personne"
                />
                <Text tone="secondary">Code de rôle : un code qui existe ici</Text>
                <TextArea
                  value={message}
                  onChange={setMessage}
                  rows={3}
                  placeholder="Message optionnel — le courrier part ailleurs"
                />
                <Row gap={8}>
                  <Button variant="primary">Envoyer l'invitation</Button>
                  <Button variant="secondary" onClick={() => setView("liste")}>
                    Annuler
                  </Button>
                </Row>
                <Callout tone="neutral" title="Déjà membre">
                  Un email déjà membre de ce tenant est refusé. Chez un autre
                  tenant, c'est une autre appartenance.
                </Callout>
              </Stack>
            )}

            {view === "detail" && (
              <Stack gap={12}>
                <Text weight="semibold">Bo — bo@a.test</Text>
                <Row gap={8}>
                  <Pill tone="warning" size="sm" active={false}>
                    invitée
                  </Pill>
                </Row>
                <Text tone="secondary">
                  Codes de rôle : un code du tenant. Ce BC les pose ; il ne dit
                  pas ce qu'ils autorisent.
                </Text>
                <Row gap={8}>
                  <Button variant="secondary">Relancer l'invitation</Button>
                  <Button variant="primary">Retirer</Button>
                </Row>
                <Text tone="secondary">
                  Active : suspendre. Suspendue : réactiver. Retirer enlève
                  l'appartenance, pas la personne.
                </Text>
              </Stack>
            )}

            {view === "vide" && (
              <Callout tone="neutral" title="Aucun membre">
                Personne dans ce tenant. Inviter une personne — manuel.
              </Callout>
            )}

            {view === "autre-tenant" && (
              <Stack gap={8}>
                <Text tone="secondary">Aucun membre dans ce tenant.</Text>
                <Callout tone="warning" title="Isolation">
                  Les membres de A ne sont pas listés chez B. Pas un message
                  « accès refusé » métier.
                </Callout>
              </Stack>
            )}
          </Stack>
        </CardBody>
      </Card>
      <Spacer />
    </Stack>
  );
}
