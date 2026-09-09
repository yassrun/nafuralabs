import type { TranslateService } from '@ngx-translate/core';

import { buildListingConfig } from '@platform/lib/anatomy';
import type { ColumnConfig, FilterFieldConfig, ListingRouteConfig } from '@platform/lib/anatomy/types';
import type { RhNomenclature } from '@app/rh/models';

export type RhNomenclatureKind = 'poste' | 'departement';

function i18nPrefix(kind: RhNomenclatureKind): string {
  return kind === 'poste' ? 'rh.poste' : 'rh.departement';
}

function path(kind: RhNomenclatureKind): string {
  return kind === 'poste' ? '/rh/postes' : '/rh/departements';
}

export function buildNomenclatureListingRoutes(
  kind: RhNomenclatureKind,
): ListingRouteConfig<{ id: string }> {
  const base = path(kind);
  return {
    detail: (item) => [base, item.id],
    create: [`${base}/new`],
    list: [base],
  };
}

export function buildNomenclatureColumns(t: TranslateService, kind: RhNomenclatureKind): ColumnConfig[] {
  const tr = (k: string) => t.instant(k);
  const p = i18nPrefix(kind);
  return [
    { key: 'code', label: tr(`${p}.columns.code`), field: 'code', type: 'text', sortable: true, width: '140px' },
    { key: 'libelle', label: tr(`${p}.columns.libelle`), field: 'libelle', type: 'text', sortable: true },
    {
      key: 'actif',
      label: tr(`${p}.columns.actif`),
      field: 'actif',
      type: 'badge',
      width: '100px',
      badgeVariant: (v: unknown) => (v ? 'success' : 'default'),
      transform: (v: unknown) => (v ? tr('rh.nomenclature.actif') : tr('rh.nomenclature.inactif')),
    },
  ];
}

export function buildNomenclatureFilters(t: TranslateService, kind: RhNomenclatureKind): FilterFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  const p = i18nPrefix(kind);
  return [
    { key: 'code', label: tr(`${p}.columns.code`), type: 'text' },
    { key: 'libelle', label: tr(`${p}.columns.libelle`), type: 'text' },
  ];
}

export function buildNomenclatureListingConfig(t: TranslateService, kind: RhNomenclatureKind) {
  const tr = (k: string) => t.instant(k);
  const p = i18nPrefix(kind);
  return buildListingConfig<RhNomenclature>(
    {
      entityName: tr(`${p}.titleSingular`),
      entityNamePlural: tr(`${p}.title`),
      columns: buildNomenclatureColumns(t, kind),
      routes: buildNomenclatureListingRoutes(kind),
      permissionPrefix: kind === 'poste' ? 'rh.postes' : 'rh.departements',
    },
    {
      filters: buildNomenclatureFilters(t, kind),
      defaultSort: { column: 'libelle', direction: 'asc' },
      features: { search: true, filters: true, refresh: true },
      emptyState: {
        icon: 'list',
        title: tr(`${p}.listing.emptyState.title`),
        message: tr(`${p}.listing.emptyState.message`),
        actionLabel: tr(`${p}.listing.emptyState.actionLabel`),
        actionId: 'create',
      },
    },
  );
}
