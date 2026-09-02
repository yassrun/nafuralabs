import { buildListingConfig } from '@platform/lib/anatomy';
import type { ColumnConfig, ListingRouteConfig } from '@platform/lib/anatomy/types';
import { ETAPES_DOSSIER_ETUDE } from '@app/etudes/models';
import type { DossierEtude } from '@app/etudes/models';

import { backendToUiEtape, libelleUiEtape } from '../utils/dossier-etape.util';
import {
  DOSSIER_STATUT_LABELS,
  DOSSIER_STATUT_VARIANTS,
} from '../utils/dossier-status.util';

export const DOSSIER_ROUTES: ListingRouteConfig<DossierEtude> = {
  detail: (item) => ['/etudes/dossiers', item.id],
  create: ['/etudes/dossiers/new'],
  list: ['/etudes/dossiers'],
};

function buildColumns(): ColumnConfig[] {
  return [
    { key: 'numero', label: 'N°', field: 'numero', type: 'text', sortable: true, width: '120px' },
    {
      key: 'objet',
      label: 'Objet',
      field: 'objet',
      type: 'text',
      sortable: true,
      width: '280px',
      // S4 — largeur fixe + ellipsis via CSS listing (cellule tronquée).
      cssClass: 'dossier-col-objet',
    },
    { key: 'clientNom', label: 'Client', field: 'clientNom', type: 'text', sortable: true, width: '160px' },
    {
      key: 'aoType',
      label: 'Type AO',
      field: 'aoType',
      type: 'text',
      sortable: true,
      width: '100px',
      transform: (value: unknown) => {
        if (value === 'PUBLIC') return 'Public';
        if (value === 'PRIVE') return 'Privé';
        return value ? String(value) : '—';
      },
    },
    {
      key: 'aoDateLimiteDepot',
      label: 'Limite dépôt',
      field: 'aoDateLimiteDepot',
      type: 'date',
      sortable: true,
      width: '130px',
    },
    {
      key: 'currentStep',
      label: 'Étape',
      field: 'currentStep',
      type: 'text',
      sortable: true,
      width: '200px',
      transform: (value: unknown) => {
        const backend = Number(value);
        if (!Number.isFinite(backend)) return String(value ?? '');
        const ui = backendToUiEtape(backend);
        return `${ui}/${ETAPES_DOSSIER_ETUDE.length} — ${libelleUiEtape(backend)}`;
      },
    },
    {
      key: 'status',
      label: 'Statut',
      field: 'status',
      type: 'badge',
      sortable: true,
      width: '140px',
      badgeVariant: (value: unknown) => DOSSIER_STATUT_VARIANTS[String(value)] ?? 'default',
      transform: (value: unknown) =>
        DOSSIER_STATUT_LABELS[String(value)] ?? String(value ?? ''),
    },
    {
      key: 'updatedAt',
      label: 'Modifié le',
      field: 'updatedAt',
      type: 'date',
      sortable: true,
      width: '130px',
    },
  ];
}

export function buildDossierListingConfig() {
  return buildListingConfig<DossierEtude>(
    {
      entityName: "Étude / AO",
      entityNamePlural: "Études / appels d'offres",
      columns: buildColumns(),
      routes: DOSSIER_ROUTES,
      permissionPrefix: 'etude',
    },
    {
      // Le travail en cours d'abord : c'est ce qu'on vient rouvrir.
      defaultSort: { column: 'updatedAt', direction: 'desc' },
      features: {
        search: true,
        filters: false,
        columnToggle: true,
        viewModeToggle: false,
        refresh: true,
      },
      pagination: {
        defaultPageSize: 20,
        pageSizeOptions: [20],
      },
      emptyState: {
        icon: 'calculate',
        title: "Aucune étude / appel d'offres",
        message:
          "Créez un dossier pour un marché entrant : pièces (CPS, bordereau), chiffrage et devis.",
        actionLabel: 'Nouvelle étude',
        actionId: 'create',
      },
    },
  );
}
