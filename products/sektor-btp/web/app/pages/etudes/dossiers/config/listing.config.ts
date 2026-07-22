import { buildListingConfig } from '@lib/anatomy';
import type { BadgeVariant, ColumnConfig, ListingRouteConfig } from '@lib/anatomy/types';
import { ETAPES_DOSSIER_ETUDE } from '@app/etudes/models';
import type { DossierEtude } from '@app/etudes/models';

import { backendToUiEtape, libelleUiEtape } from '../utils/dossier-etape.util';

export const DOSSIER_ROUTES: ListingRouteConfig<DossierEtude> = {
  detail: (item) => ['/etudes/dossiers', item.id],
  create: ['/etudes/dossiers/new'],
  list: ['/etudes/dossiers'],
};

/** Vert quand c'est acquis, orange quand ça demande une action, rouge quand c'est perdu. */
const STATUT_VARIANTS: Record<string, BadgeVariant> = {
  BROUILLON: 'default',
  EN_ETUDE: 'warning',
  EN_VALIDATION: 'info',
  VALIDEE: 'success',
  DEVIS_GENERE: 'info',
  GAGNE: 'success',
  PERDU: 'danger',
  CONVERTIE: 'success',
  ANNULE: 'default',
};

const STATUT_LABELS: Record<string, string> = {
  BROUILLON: 'Brouillon',
  EN_ETUDE: 'En étude',
  EN_VALIDATION: 'En validation',
  VALIDEE: 'Validée',
  DEVIS_GENERE: 'Devis généré',
  GAGNE: 'Gagné',
  PERDU: 'Perdu',
  CONVERTIE: 'Convertie',
  ANNULE: 'Annulé',
};

function buildColumns(): ColumnConfig[] {
  return [
    { key: 'numero', label: 'N°', field: 'numero', type: 'text', sortable: true, width: '120px' },
    { key: 'objet', label: 'Objet', field: 'objet', type: 'text', sortable: true },
    { key: 'clientNom', label: 'Client', field: 'clientNom', type: 'text', sortable: true },
    {
      key: 'currentStep',
      label: 'Étape',
      field: 'currentStep',
      type: 'text',
      sortable: true,
      width: '220px',
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
      width: '150px',
      badgeVariant: (value: unknown) => STATUT_VARIANTS[String(value)] ?? 'default',
      transform: (value: unknown) => STATUT_LABELS[String(value)] ?? String(value ?? ''),
    },
    {
      key: 'updatedAt',
      label: 'Modifié le',
      field: 'updatedAt',
      type: 'date',
      sortable: true,
      width: '140px',
    },
  ];
}

export function buildDossierListingConfig() {
  return buildListingConfig<DossierEtude>(
    {
      entityName: "Dossier d'étude",
      entityNamePlural: "Dossiers d'étude",
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
        selectionMode: 'none',
        viewModeToggle: false,
        refresh: true,
      },
      emptyState: {
        icon: 'calculate',
        title: "Aucun dossier d'étude",
        message:
          "Un dossier d'étude porte un marché entrant : ses pièces (CPS, bordereau), son chiffrage et son devis.",
        actionLabel: 'Nouveau dossier',
        actionId: 'create',
      },
    },
  );
}
