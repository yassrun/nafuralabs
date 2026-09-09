import type { TranslateService } from '@ngx-translate/core';

import { buildDetailConfig } from '@platform/lib/anatomy';
import type { DetailFieldConfig, DetailRouteConfig, DetailSectionConfig } from '@platform/lib/anatomy/types';
import type { RhNomenclature } from '@app/rh/models';

import type { RhNomenclatureKind } from './listing';

function i18nPrefix(kind: RhNomenclatureKind): string {
  return kind === 'poste' ? 'rh.poste' : 'rh.departement';
}

function path(kind: RhNomenclatureKind): string {
  return kind === 'poste' ? '/rh/postes' : '/rh/departements';
}

export function buildNomenclatureDetailRoutes(
  kind: RhNomenclatureKind,
): DetailRouteConfig<{ id: string }> {
  const base = path(kind);
  return {
    list: [base],
    edit: (item) => [base, item.id],
    view: (item) => [base, item.id],
  };
}

export function buildNomenclatureFields(
  t: TranslateService,
  kind: RhNomenclatureKind,
): DetailFieldConfig[] {
  const tr = (k: string) => t.instant(k);
  const p = i18nPrefix(kind);
  return [
    { key: 'code', label: tr(`${p}.fields.code`), type: 'text' },
    { key: 'libelle', label: tr(`${p}.fields.libelle`), type: 'text', required: true },
    { key: 'actif', label: tr(`${p}.fields.actif`), type: 'toggle', defaultValue: true },
  ];
}

export function buildNomenclatureSections(
  t: TranslateService,
  kind: RhNomenclatureKind,
): DetailSectionConfig[] {
  const tr = (k: string) => t.instant(k);
  const p = i18nPrefix(kind);
  return [
    {
      id: 'identite',
      title: tr(`${p}.sections.identite`),
      icon: 'list',
      fields: ['code', 'libelle', 'actif'],
      columns: 2,
    },
  ];
}

export function buildNomenclatureDetailConfig(t: TranslateService, kind: RhNomenclatureKind) {
  const tr = (k: string) => t.instant(k);
  const p = i18nPrefix(kind);
  return buildDetailConfig<RhNomenclature>(
    {
      entityName: tr(`${p}.titleSingular`),
      icon: 'list',
      permissionPrefix: kind === 'poste' ? 'rh.postes' : 'rh.departements',
      fields: buildNomenclatureFields(t, kind),
      routes: buildNomenclatureDetailRoutes(kind),
    },
    {
      sections: buildNomenclatureSections(t, kind),
      saveSuccessMessage: (item) =>
        t.instant(`${p}.toasts.saved`, { libelle: (item as RhNomenclature).libelle }),
      deleteConfirm: {
        title: tr(`${p}.deleteConfirm.title`),
        message: (item) =>
          t.instant(`${p}.deleteConfirm.message`, { libelle: (item as RhNomenclature).libelle }),
      },
    },
  );
}
