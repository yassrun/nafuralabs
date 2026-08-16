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
  Text,
  useCanvasState,
} from "cursor/canvas";

/**
 * SSOT Git : nafura-platform/pact/impression/ux/page-rendue-wireframe.canvas.tsx
 * Preview IDE : canvases/page-rendue-wireframe.canvas.tsx
 *
 * Décisions UX
 * - Pas d'écran platform « mes modèles » : le produit demande une page
 * - Chrome (logo, pied) vient du tenant, pas du métier
 * - Fallback : le produit appelle l'API sans ce cadre
 * - Autre tenant : pas la page de A — pas un message métier
 */

type ViewId = "page-rendue" | "sans-modele" | "autre-tenant";

export default function PageRendueWireframe() {
  const [view, setView] = useCanvasState<ViewId>("impression-view", "page-rendue");

  return (
    <Stack gap={20} style={{ maxWidth: 720 }}>
      <Stack gap={6}>
        <H1>Page rendue</H1>
        <Text tone="secondary">
          Le produit demande. Cette app rend. Le modèle métier reste au produit.
        </Text>
      </Stack>

      <Row gap={8}>
        <Button
          variant={view === "page-rendue" ? "primary" : "secondary"}
          onClick={() => setView("page-rendue")}
        >
          Page rendue
        </Button>
        <Button
          variant={view === "sans-modele" ? "primary" : "secondary"}
          onClick={() => setView("sans-modele")}
        >
          Sans modèle
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
          trailing={<Pill tone="neutral" size="sm" active={false}>via le produit</Pill>}
        >
          Demande d'impression
        </CardHeader>
        <CardBody>
          <Stack gap={12}>
            {view === "page-rendue" && (
              <Stack gap={8}>
                <Text weight="semibold">PDF</Text>
                <Text tone="secondary">
                  Chrome du tenant (identité, pied). Corps fourni par le produit.
                </Text>
                <Row gap={8}>
                  <Button>Télécharger</Button>
                </Row>
              </Stack>
            )}
            {view === "sans-modele" && (
              <Callout tone="warning" title="Pas de modèle">
                Rien à rendre. Le produit fournit le modèle — pas cette app.
              </Callout>
            )}
            {view === "autre-tenant" && (
              <Callout tone="warning" title="Isolation">
                Le modèle de A n'est pas servi à B. Pas un message « accès refusé »
                métier.
              </Callout>
            )}
          </Stack>
        </CardBody>
      </Card>
      <Spacer />
    </Stack>
  );
}
