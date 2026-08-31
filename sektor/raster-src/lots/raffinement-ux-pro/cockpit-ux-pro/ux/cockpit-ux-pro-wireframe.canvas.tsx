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

  TextInput,

  useCanvasState,

  useHostTheme,

} from "cursor/canvas";



type ViewId =

  | "encours"

  | "prepa"

  | "raccourcis"

  | "listing"

  | "listing-reload"

  | "listing-vide"

  | "listing-erreur"

  | "cockpit-chargement"

  | "cockpit-erreur";



const VIEWS: { id: ViewId; label: string }[] = [

  { id: "encours", label: "EN_COURS" },

  { id: "prepa", label: "EN_PREPARATION" },

  { id: "raccourcis", label: "Cibles routes" },

  { id: "listing", label: "Portefeuille OK" },

  { id: "listing-reload", label: "Recherche (reload)" },

  { id: "listing-vide", label: "0 hit" },

  { id: "listing-erreur", label: "Erreur API" },

  { id: "cockpit-chargement", label: "Cockpit load" },

  { id: "cockpit-erreur", label: "Cockpit erreur" },

];



const NAV = [

  "Arbre",

  "Equipe",

  "Avancement",

  "Attachement",

  "Situations",

  "Docs",

  "Journal",

  "Planning",

  "Budget",

  "DA",

  "ST",

  "BL",

];



export default function CockpitUxProWireframe() {

  const [view, setView] = useCanvasState<ViewId>("cockpit-ux-pro-view", "encours");



  return (

    <Stack gap={16} style={{ padding: 24, maxWidth: 980 }}>

      <H1>Cockpit chantier — surface pro</H1>

      <Text tone="secondary">

        CONTRAT AC-1…AC-15. Hierarchie : KPI → a faire → flux → nav toujours

        visible. Gérer / Ouvrir atterrissent. Recherche portefeuille sans vider

        la table.

      </Text>

      <Callout tone="info" title="Une nav, pas deux">

        Les commandes restent dans « A faire ». Le bandeau « Aller a » n’est

        jamais filtre par nextActions. Pas de seconde carte workflow sous le

        cockpit.

      </Callout>

      <Row gap={8} wrap>

        {VIEWS.map((v) => (

          <Button

            key={v.id}

            size="sm"

            variant={view === v.id ? "primary" : "secondary"}

            onClick={() => setView(v.id)}

          >

            {v.label}

          </Button>

        ))}

      </Row>

      <Divider />

      {view === "encours" && <EnCours />}

      {view === "prepa" && <Prepa />}

      {view === "raccourcis" && <Raccourcis />}

      {view === "listing" && <Listing />}

      {view === "listing-reload" && <ListingReload />}

      {view === "listing-vide" && <ListingVide />}

      {view === "listing-erreur" && <ListingErreur />}

      {view === "cockpit-chargement" && <CockpitChargement />}

      {view === "cockpit-erreur" && <CockpitErreur />}

    </Stack>

  );

}



function KpiStrip() {

  const items = [

    ["Vente active HT", "737 106 MAD"],

    ["Budget revise HT", "582 600 MAD"],

    ["Marge projetee", "154 506 · 21 %"],

    ["Avancement", "37 %"],

    ["Echeance", "214 j restants"],

  ];

  return (

    <Row gap={8} wrap>

      {items.map(([label, value]) => (

        <Card key={label} size="sm" style={{ flex: "1 1 140px" }}>

          <CardBody>

            <Text size="small" tone="secondary">

              {label}

            </Text>

            <Text weight="semibold">{value}</Text>

          </CardBody>

        </Card>

      ))}

    </Row>

  );

}



function NavRail() {

  return (

    <Stack gap={8}>

      <Text size="small" tone="secondary" weight="semibold">

        Aller a (toujours visible — AC-4)

      </Text>

      <Row gap={6} wrap>

        {NAV.map((label) => (

          <Pill key={label} size="sm" tone="neutral">

            {label}

          </Pill>

        ))}

      </Row>

    </Stack>

  );

}



function EnCours() {

  const theme = useHostTheme();

  return (

    <Stack gap={12}>

      <H2>CH-2026-014 · Lycee Al Qods — en cours</H2>

      <KpiStrip />

      <Row gap={12} wrap>

        <Card style={{ flex: "1 1 280px" }}>

          <CardHeader>A faire maintenant</CardHeader>

          <CardBody>

            <Stack gap={8}>

              <Button>Saisir l’avancement</Button>

              <Row gap={6} wrap>

                <Pill size="sm">Nouvelle DA</Pill>

                <Pill size="sm">Receptionner un BL</Pill>

              </Row>

              <Callout tone="warning" title="Retard contractuel">

                Ouvrir → /chantiers/planning?chantier=id (AC-2)

              </Callout>

            </Stack>

          </CardBody>

        </Card>

        <Card style={{ flex: "1 1 280px" }}>

          <CardHeader trailing={<Pill size="sm">Aout 2026</Pill>}>

            Flux du mois

          </CardHeader>

          <CardBody>

            <Text>Etape : Avancement</Text>

            <Spacer />

            <Button size="sm">Passer a l’etape → route /…</Button>

          </CardBody>

        </Card>

      </Row>

      <NavRail />

      <Text size="small" tone="secondary">

        AC-5 — pas de second bandeau workflow. Surface {theme.bg.elevated}.

      </Text>

    </Stack>

  );

}



function Prepa() {

  return (

    <Stack gap={12}>

      <H2>CH-2026-002 · Ecole Al Amal — preparation</H2>

      <KpiStrip />

      <Row gap={12} wrap>

        <Card style={{ flex: "1 1 280px" }}>

          <CardHeader>A faire maintenant</CardHeader>

          <CardBody>

            <Stack gap={8}>

              <Text size="small">Reference OS + date d’effet → demarrer</Text>

              <Button>Enregistrer l’OS et demarrer</Button>

            </Stack>

          </CardBody>

        </Card>

        <Card style={{ flex: "1 1 280px" }}>

          <CardHeader trailing={<Pill size="sm">5/7 prerequis</Pill>}>

            Preparation

          </CardHeader>

          <CardBody>

            <Stack gap={6}>

              <Text size="small">OK Identite · vente · dates</Text>

              <Row gap={8}>

                <Text size="small">! Responsables</Text>

                <Pill size="sm" tone="warning">

                  Gerer → ?tab=equipe

                </Pill>

              </Row>

              <Row gap={8}>

                <Text size="small">A faire Planning</Text>

                <Pill size="sm">Creer → /planning?chantier=</Pill>

              </Row>

            </Stack>

          </CardBody>

        </Card>

      </Row>

      <NavRail />

      <Callout tone="info" title="AC-3 — onglets live">

        Clic Arbre / Equipe depuis la nav met a jour queryParamMap ; l’onglet

        change sans recharger toute la fiche.

      </Callout>

    </Stack>

  );

}



function Raccourcis() {

  return (

    <Stack gap={12}>

      <H2>Cibles — plus jamais une cle i18n (AC-1, AC-2, AC-8)</H2>

      <Callout tone="danger" title="Bug labo a tuer">

        ouvrirRoute(p.action) naviguait vers

        chantiers.cockpit.preparation.action.arbre. Interdit.

      </Callout>

      <Table

        headers={["Source", "Geste", "Destination"]}

        striped

        rows={[

          ["Prep identite / dates / vente", "Gerer", "/chantiers/{id}/edit"],

          ["Prep arbre", "Gerer", "/chantiers/{id}?tab=lots"],

          ["Prep responsables", "Gerer", "/chantiers/{id}?tab=equipe"],

          ["Prep budget", "Gerer", "/chantiers/budget/{id}"],

          ["Prep / alerte planning", "Ouvrir", "/chantiers/planning?chantier={id}"],

          ["Alerte marge", "Ouvrir", "/chantiers/budget/{id}"],

          ["Alerte finance", "Ouvrir", "/chantiers/{id}/edit"],

          ["Alerte retard", "Ouvrir", "/chantiers/planning?chantier={id}"],

          ["Flux premiereAction", "Passer", "route /… (jamais i18n)"],

          ["Code inconnu", "—", "no-op / CTA absent"],

        ]}

      />

    </Stack>

  );

}



function ListingToolbar(props: { value: string; hint: string }) {

  return (

    <Stack gap={8}>

      <Row gap={8} wrap>

        <TextInput value={props.value} placeholder="Code, nom, client…" disabled />

        <Pill size="sm">Statut</Pill>

        <Pill size="sm">Tri = code</Pill>

      </Row>

      <Text size="small" tone="secondary">

        {props.hint}

      </Text>

    </Stack>

  );

}



function Listing() {

  return (

    <Stack gap={12}>

      <H2>Mes chantiers — recherche OK (AC-10, AC-11)</H2>

      <Callout tone="warning" title="Avant">

        GET /portefeuille composait summary+affectations+lots pour tout le

        tenant, puis filtrait. Table « Chargement… » a chaque frappe.

      </Callout>

      <ListingToolbar

        value="CH-014"

        hint="list(status, search, hydrate=false) d’abord · compose la page si tri=code"

      />

      <Table

        headers={["Code", "Nom", "Client", "Statut"]}

        striped

        rows={[

          ["CH-014", "Lycee Al Qods", "MOA Rabat", "EN_COURS"],

        ]}

      />

      <Text size="small" tone="secondary">

        1 resultat · compose uniquement cet id.

      </Text>

    </Stack>

  );

}



function ListingReload() {

  return (

    <Stack gap={12}>

      <H2>Frappe en cours — table stable (AC-13)</H2>

      <ListingToolbar

        value="CH-01"

        hint="Debounce ~300 ms · lignes precedentes restent visibles"

      />

      <Row gap={8}>

        <Pill size="sm" tone="warning">

          Rechargement…

        </Pill>

        <Text size="small" tone="secondary">

          Pas de tbody vide tant que rows.length &gt; 0

        </Text>

      </Row>

      <Table

        headers={["Code", "Nom", "Client", "Statut"]}

        striped

        rows={[

          ["CH-014", "Lycee Al Qods", "MOA Rabat", "EN_COURS"],

          ["CH-002", "Ecole Al Amal", "MOA Casa", "EN_PREPARATION"],

        ]}

      />

    </Stack>

  );

}



function ListingVide() {

  return (

    <Stack gap={12}>

      <H2>0 hit — pas une erreur (AC-14)</H2>

      <ListingToolbar value="ZZZ-999" hint="Count = 0 · message vide clair" />

      <Table

        headers={["Code", "Nom", "Client", "Statut"]}

        rows={[]}

        emptyMessage="Aucun chantier ne correspond a cette recherche."

      />

    </Stack>

  );

}



function ListingErreur() {

  return (

    <Stack gap={12}>

      <H2>Erreur API — lignes conservees (AC-14)</H2>

      <Callout tone="danger" title="Chargement impossible">

        Message + CTA Relancer. Les lignes deja affichees restent si presentes.

      </Callout>

      <Table

        headers={["Code", "Nom", "Client", "Statut"]}

        striped

        rows={[

          ["CH-014", "Lycee Al Qods", "MOA Rabat", "EN_COURS"],

        ]}

      />

      <Button size="sm">Relancer</Button>

    </Stack>

  );

}



function CockpitChargement() {

  return (

    <Stack gap={12}>

      <H2>Cockpit — chargement (AC-9)</H2>

      <Card>

        <CardBody>

          <Text tone="secondary">Chargement du read model…</Text>

          <Spacer />

          <Text size="small" tone="secondary">

            Pas de KPI a 0 inventes pendant le fetch.

          </Text>

        </CardBody>

      </Card>

    </Stack>

  );

}



function CockpitErreur() {

  return (

    <Stack gap={12}>

      <H2>Cockpit — erreur (AC-9)</H2>

      <Callout tone="danger" title="Read model indisponible">

        Message clair + relance. Aucune navigation vers une cle i18n.

      </Callout>

      <Button size="sm">Recharger</Button>

    </Stack>

  );

}


