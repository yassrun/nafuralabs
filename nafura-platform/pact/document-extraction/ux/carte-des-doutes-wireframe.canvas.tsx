import {
  Button,
  Callout,
  Card,
  CardBody,
  CardHeader,
  Code,
  Divider,
  Grid,
  H1,
  H2,
  Pill,
  Row,
  Spacer,
  Stack,
  Stat,
  Table,
  Text,
  useCanvasState,
  useHostTheme,
} from "cursor/canvas";

/**
 * SSOT Git : nafura-platform/pact/document-extraction/ux/carte-des-doutes-wireframe.canvas.tsx
 * Preview IDE : canvases/carte-des-doutes-wireframe.canvas.tsx
 *
 * Décisions UX
 * - Deux zones, jamais un % fusionné (Villa Kenitra : 4 extraits incertains vs 75 manques)
 * - On signale, on ne répare pas le fichier
 * - Recyclage : data-table / tree-table / record-table + listes par nature
 * - AI-first : le validateur a déjà posé `nature` ; fallback = reclasse manuelle d’un doute
 * - Parenté fausse (arbre) ≠ cellule fausse : geste différent, même séparation de natures
 * - CTA Enregistrer reste en footer sticky
 */

type ViewId = "liste" | "arbre" | "vide" | "chargement";

export default function CarteDesDoutesWireframe() {
  const theme = useHostTheme();
  const [view, setView] = useCanvasState<ViewId>("doutes-view", "liste");

  return (
    <Stack gap={20} style={{ maxWidth: 980 }}>
      <Stack gap={6}>
        <H1>Carte des doutes</H1>
        <Text tone="secondary">
          Relecture après extraction. Deux natures, deux compteurs. Footer Enregistrer
          inchangé.
        </Text>
      </Stack>

      <Row gap={8}>
        <Button variant={view === "liste" ? "primary" : "secondary"} onClick={() => setView("liste")}>
          Liste
        </Button>
        <Button variant={view === "arbre" ? "primary" : "secondary"} onClick={() => setView("arbre")}>
          Arbre
        </Button>
        <Button variant={view === "vide" ? "primary" : "secondary"} onClick={() => setView("vide")}>
          Rien à revoir
        </Button>
        <Button
          variant={view === "chargement" ? "primary" : "secondary"}
          onClick={() => setView("chargement")}
        >
          Chargement
        </Button>
      </Row>

      <Divider />

      {view === "chargement" ? <LoadingView /> : null}
      {view === "vide" ? <EmptyView /> : null}
      {view === "liste" ? <ListeView /> : null}
      {view === "arbre" ? <ArbreView /> : null}

      <Callout tone="neutral" title="Fallback manuel">
        Reclasser un doute (extraction ↔ manque source) sans relancer l’IA. Le fichier
        source n’est pas édité ici.
      </Callout>

      <Spacer />
      <Row
        gap={12}
        align="center"
        justify="space-between"
        style={{
          position: "sticky",
          bottom: 0,
          paddingTop: 12,
          paddingBottom: 8,
          background: theme.bg.editor,
          borderTop: `1px solid ${theme.stroke.tertiary}`,
        }}
      >
        <Text tone="secondary" size="small">
          Brouillon · dirty
        </Text>
        <Button variant="primary">Enregistrer</Button>
      </Row>
    </Stack>
  );
}

function LoadingView() {
  return (
    <Callout tone="info" title="Lecture en cours">
      Grille + plan. La carte des doutes n’apparaît qu’après validation du brouillon.
    </Callout>
  );
}

function EmptyView() {
  return (
    <Callout tone="success" title="Rien à revoir">
      186 articles lus. 0 doute d’extraction. 0 manque de la source.
    </Callout>
  );
}

function ListeView() {
  return (
    <Stack gap={16}>
      <H2>Forme liste — Villa Kenitra</H2>
      <Text tone="secondary" size="small">
        Inventaire :{" "}
        <Code>nf-smart-import-doubt-lists</Code> (deux listes) + table des lignes. Les
        natures ne se mélangent pas sous la ligne.
      </Text>

      <Grid columns={2} gap={16}>
        <Stat value="4" label="Doutes d’extraction" tone="warning" />
        <Stat value="75" label="Manques de la source" tone="info" />
      </Grid>

      <Callout tone="danger" title="Interdit">
        79 / 203 = 39 % à revoir. Ce pourcentage mélange lecture incertaine et
        cellules vides du fichier.
      </Callout>

      <Grid columns={2} gap={16}>
        <Card>
          <CardHeader trailing={<Pill active>extraction</Pill>}>
            On n’est pas sûr d’avoir bien lu
          </CardHeader>
          <CardBody>
            <Table
              headers={["Ligne", "Champ", "Lu"]}
              rows={[
                ["12", "unité", "M2 ?"],
                ["40", "code", "1-1-7 / 1.1.7"],
                ["88", "qté", "alignement colonne"],
                ["101", "désignation", "coupure de ligne"],
              ]}
              rowTone={["warning", "warning", "warning", "warning"]}
              striped
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader trailing={<Pill>manque source</Pill>}>
            Le fichier ne le contient pas
          </CardHeader>
          <CardBody>
            <Table
              headers={["Ligne", "Champ", "Attendu"]}
              rows={[
                ["3", "quantité", "vide dans le xlsx"],
                ["19", "quantité", "vide"],
                ["27", "quantité", "vide"],
                ["…", "75 postes", "idem Villa"],
              ]}
              striped
            />
          </CardBody>
        </Card>
      </Grid>
    </Stack>
  );
}

function ArbreView() {
  return (
    <Stack gap={16}>
      <H2>Forme arbre</H2>
      <Text tone="secondary" size="small">
        Inventaire : <Code>nf-smart-import-tree-table</Code>. Parenté fausse =
        déplacer le nœud (autre geste). Cellule fausse / manque = les deux
        listes ci-dessous.
      </Text>

      <Grid columns={2} gap={16}>
        <Stat value="3" label="Doutes d’extraction (cellules)" tone="warning" />
        <Stat value="11" label="Manques de la source" tone="info" />
      </Grid>

      <Card>
        <CardHeader>Lot 1 · article 1-1-1</CardHeader>
        <CardBody>
          <Stack gap={8}>
            <Text>
              Unité lue « M2 ? » → doute d’extraction, colonne de gauche.
            </Text>
            <Text>
              Quantité absente dans le fichier → manque source, colonne de
              droite. Pas dans la même pile.
            </Text>
          </Stack>
        </CardBody>
      </Card>
    </Stack>
  );
}
