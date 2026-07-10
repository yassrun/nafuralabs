import type { TranslateService } from '@ngx-translate/core';

import type { DetailFieldConfig } from '@lib/anatomy/types';
import type { Materiel } from '../../models';

export function buildMaterielFields(t: TranslateService): DetailFieldConfig<Materiel>[] {
  const tr = (k: string) => t.instant(k);
  return [
    {
      key: 'code',
      label: tr('inventory.catalogue.materiel.fields.code'),
      type: 'text',
      required: true,
      readonlyOnEdit: true,
      width: 'md',
      validators: [{ type: 'maxLength', value: 50 }],
    },
    {
      key: 'name',
      label: tr('inventory.catalogue.materiel.fields.name'),
      type: 'text',
      required: true,
      width: 'md',
      validators: [{ type: 'maxLength', value: 255 }],
    },
    {
      key: 'familleId',
      label: tr('inventory.catalogue.materiel.fields.familleId'),
      type: 'select',
      width: 'md',
      lookupKey: 'famillesArticle',
      lookupEndpoint: '/api/v1/item-categories/lookup',
      lookupDisplayField: 'name',
      lookupValueField: 'id',
      searchable: true,
      clearable: true,
    },
    {
      key: 'description',
      label: tr('inventory.catalogue.materiel.fields.description'),
      type: 'textarea',
      width: 'full',
      validators: [{ type: 'maxLength', value: 2000 }],
    },
    {
      key: 'marque',
      label: tr('inventory.catalogue.materiel.fields.marque'),
      type: 'text',
      width: 'md',
      validators: [{ type: 'maxLength', value: 100 }],
    },
    {
      key: 'modele',
      label: tr('inventory.catalogue.materiel.fields.modele'),
      type: 'text',
      width: 'md',
      validators: [{ type: 'maxLength', value: 100 }],
    },
    {
      key: 'numeroSerie',
      label: tr('inventory.catalogue.materiel.fields.numeroSerie'),
      type: 'text',
      required: true,
      readonlyOnEdit: true,
      width: 'md',
      validators: [{ type: 'maxLength', value: 100 }],
    },
    {
      key: 'anneeMiseEnService',
      label: tr('inventory.catalogue.materiel.fields.anneeMiseEnService'),
      type: 'number',
      width: 'sm',
      validators: [
        { type: 'min', value: 1900 },
        { type: 'max', value: 2100 },
      ],
    },
    {
      key: 'puissanceCapacite',
      label: tr('inventory.catalogue.materiel.fields.puissanceCapacite'),
      type: 'text',
      width: 'md',
      validators: [{ type: 'maxLength', value: 100 }],
    },
    {
      key: 'status',
      label: tr('inventory.catalogue.materiel.fields.status'),
      type: 'select',
      required: true,
      width: 'md',
      options: [
        { value: 'DISPONIBLE', label: tr('inventory.enums.materielStatus.DISPONIBLE') },
        { value: 'AFFECTE', label: tr('inventory.enums.materielStatus.AFFECTE') },
        { value: 'MAINTENANCE', label: tr('inventory.enums.materielStatus.MAINTENANCE') },
        { value: 'HORS_SERVICE', label: tr('inventory.enums.materielStatus.HORS_SERVICE') },
      ],
    },
    {
      key: 'dateDernierEntretien',
      label: tr('inventory.catalogue.materiel.fields.dateDernierEntretien'),
      type: 'date',
      width: 'md',
    },
    {
      key: 'prochaineMaintenance',
      label: tr('inventory.catalogue.materiel.fields.prochaineMaintenance'),
      type: 'date',
      width: 'md',
    },
    {
      key: 'notesMaintenance',
      label: tr('inventory.catalogue.materiel.fields.notesMaintenance'),
      type: 'textarea',
      width: 'full',
      validators: [{ type: 'maxLength', value: 2000 }],
    },
    {
      key: 'isActive',
      label: tr('inventory.catalogue.materiel.fields.isActive'),
      type: 'toggle',
      width: 'sm',
    },
  ];
}
