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
} from "cursor/canvas";

/**
 * SSOT Git : nafura-platform/pact/documents/ux/piece-jointe-wireframe.canvas.tsx
 * Preview IDE : canvases/piece-jointe-wireframe.canvas.tsx
 *
 * Décisions UX
 * - Pas d'écran platform « mes fichiers » : widget sur une fiche produit
 * - AI-first n'a pas de place ici : joindre / retirer est manuel
 * - Fallback : le produit peut appeler l'API sans le widget
 * - Autre tenant : même fiche, liste vide — pas un message d'erreur métier
 */

type ViewId = "sur-fiche" | "vide" | "autre-tenant";

export default function PieceJointeWireframe() {
  const [view, setView] = useCanvasState<ViewId>("documents-view", "sur-fiche");

  return (
    <Stack gap={20} style={{ maxWidth: 720 }}>
      <Stack gap={6}>
        <H1>Pièce jointe</H1>
        <Text tone="secondary">
          Widget sur une fiche produit. Cette app conserve ; le produit nomme
          l'enregistrement.
        </Text>
      </Stack>

      <Row gap={8}>
        <Button
          variant={view === "sur-fiche" ? "primary" : "secondary"}
          onClick={() => setView("sur-fiche")}
        >
          Sur la fiche
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
          trailing={<Pill tone="neutral" size="sm" active={false}>fiche produit</Pill>}
        >
          Enregistrement du produit
        </CardHeader>
        <CardBody>
          <Stack gap={12}>
            <Text weight="semibold">Fichiers</Text>
            {view === "sur-fiche" && (
              <>
                <Table
                  headers={["Nom", "Taille", ""]}
                  rows={[
                    ["devis-fournisseur.pdf", "240 Ko", "Retirer"],
                    ["photo-facade.jpg", "1,1 Mo", "Retirer"],
                  ]}
                />
                <Row gap={8}>
                  <Button>Joindre</Button>
                </Row>
              </>
            )}
            {view === "vide" && (
              <Stack gap={8}>
                <Text tone="secondary">Aucun fichier sur cet enregistrement.</Text>
                <Row gap={8}>
                  <Button>Joindre</Button>
                </Row>
              </Stack>
            )}
            {view === "autre-tenant" && (
              <Stack gap={8}>
                <Text tone="secondary">Aucun fichier sur cet enregistrement.</Text>
                <Callout tone="warning" title="Isolation">
                  Même fiche côté produit, autre tenant. Pas les pièces de A.
                  Pas un message « accès refusé » métier.
                </Callout>
              </Stack>
            )}
          </Stack>
        </CardBody>
      </Card>

      <Divider />

      <Stack gap={8}>
        <H2>Hors ce widget</H2>
          <Text tone="secondary">
          Original (études) : pas d'écran platform — le produit garde le lien.
          Imprimer / modèle : pas ce contexte.
        </Text>
      </Stack>
      <Spacer />
    </Stack>
  );
}
