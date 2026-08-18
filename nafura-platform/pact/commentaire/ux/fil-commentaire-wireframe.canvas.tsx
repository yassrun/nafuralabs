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
  Text,
  TextArea,
  useCanvasState,
} from "cursor/canvas";

/**
 * SSOT Git : nafura-platform/pact/commentaire/ux/fil-commentaire-wireframe.canvas.tsx
 * Preview IDE : canvases/fil-commentaire-wireframe.canvas.tsx
 *
 * Décisions UX
 * - Pas d'écran platform « mes commentaires » : widget sur une fiche produit
 * - Fil plat côté widget : racines seulement — les réponses existent en API, pas ici
 * - AI-first n'a pas de place ici : poster / corriger / retirer est manuel
 * - Fallback : le produit peut appeler l'API sans le widget
 * - Autre tenant : même fiche, liste vide — pas un message d'erreur métier
 * - Mention / notification / modération : hors widget, hors ce BC
 */

type ViewId = "vide" | "messages" | "saisie" | "autre-tenant";

export default function FilCommentaireWireframe() {
  const [view, setView] = useCanvasState<ViewId>("commentaire-view", "messages");
  const [draft, setDraft] = useCanvasState(
    "commentaire-draft",
    "Je reviens sur ce point.",
  );

  return (
    <Stack gap={20} style={{ maxWidth: 720 }}>
      <Stack gap={6}>
        <H1>Fil de commentaire</H1>
        <Text tone="secondary">
          Widget sur une fiche produit. Cette app tient le fil ; le produit
          nomme l'enregistrement.
        </Text>
      </Stack>

      <Row gap={8}>
        <Button
          variant={view === "vide" ? "primary" : "secondary"}
          onClick={() => setView("vide")}
        >
          Vide
        </Button>
        <Button
          variant={view === "messages" ? "primary" : "secondary"}
          onClick={() => setView("messages")}
        >
          Messages
        </Button>
        <Button
          variant={view === "saisie" ? "primary" : "secondary"}
          onClick={() => setView("saisie")}
        >
          Saisie
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
              fiche produit
            </Pill>
          }
        >
          Enregistrement du produit
        </CardHeader>
        <CardBody>
          <Stack gap={12}>
            <Text weight="semibold">Commentaires</Text>

            {view === "vide" && (
              <Stack gap={8}>
                <Text tone="secondary">Aucun commentaire pour l'instant.</Text>
                <TextArea
                  value=""
                  onChange={() => undefined}
                  placeholder="Écrire un commentaire…"
                  rows={3}
                />
                <Row gap={8}>
                  <Button>Ajouter un commentaire</Button>
                </Row>
              </Stack>
            )}

            {view === "messages" && (
              <Stack gap={12}>
                <Stack gap={4}>
                  <Row gap={8}>
                    <Text weight="semibold">alice@tenant.local</Text>
                    <Text tone="secondary">il y a 2 h</Text>
                  </Row>
                  <Text>Je reviens sur ce point.</Text>
                  <Row gap={8}>
                    <Button variant="secondary">Modifier</Button>
                    <Button variant="secondary">Supprimer</Button>
                  </Row>
                </Stack>
                <Divider />
                <Stack gap={4}>
                  <Row gap={8}>
                    <Text weight="semibold">bob@tenant.local</Text>
                    <Text tone="secondary">il y a 1 h · modifié</Text>
                  </Row>
                  <Text>Noté, je m'en occupe.</Text>
                </Stack>
                <TextArea
                  value=""
                  onChange={() => undefined}
                  placeholder="Écrire un commentaire…"
                  rows={3}
                />
                <Row gap={8}>
                  <Button>Ajouter un commentaire</Button>
                </Row>
              </Stack>
            )}

            {view === "saisie" && (
              <Stack gap={12}>
                <Stack gap={4}>
                  <Row gap={8}>
                    <Text weight="semibold">alice@tenant.local</Text>
                    <Text tone="secondary">il y a 2 h</Text>
                  </Row>
                  <Text>Je reviens sur ce point.</Text>
                </Stack>
                <TextArea value={draft} onChange={setDraft} rows={3} />
                <Row gap={8}>
                  <Button>Ajouter un commentaire</Button>
                  <Button variant="secondary">Annuler</Button>
                </Row>
              </Stack>
            )}

            {view === "autre-tenant" && (
              <Stack gap={8}>
                <Text tone="secondary">Aucun commentaire pour l'instant.</Text>
                <Callout tone="warning" title="Isolation">
                  Même fiche côté produit, autre tenant. Pas les messages de A.
                  Pas un message « accès refusé » métier.
                </Callout>
                <TextArea
                  value=""
                  onChange={() => undefined}
                  placeholder="Écrire un commentaire…"
                  rows={3}
                />
                <Row gap={8}>
                  <Button>Ajouter un commentaire</Button>
                </Row>
              </Stack>
            )}
          </Stack>
        </CardBody>
      </Card>

      <Divider />

      <Stack gap={8}>
        <H2>Hors ce widget</H2>
        <Text tone="secondary">
          Réponses (API) · mention · notification · modération : pas ce
          contexte. Corriger / retirer n'apparaissent que sur les siens.
        </Text>
      </Stack>
      <Spacer />
    </Stack>
  );
}
