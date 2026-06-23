/**
 * Item Detail Sections — Auto-generated from item.entity.json
 */

import type { DetailSectionConfig } from '@lib/anatomy/types';
import type { Item } from '../../models';

export const SECTIONS: DetailSectionConfig<Item>[] = [
  {
    id: 'general',
    title: 'directory.sections.general',
    fields: ['code', 'name', 'description', 'sku'],
    columns: 2,
  },
  {
    id: 'classification',
    title: 'directory.sections.classification',
    fields: ['itemTypeId', 'itemCategoryId'],
    columns: 2,
  },
  {
    id: 'measurement',
    title: 'directory.sections.measurement',
    fields: ['unitOfMeasureId'],
    columns: 2,
  },
  {
    id: 'status',
    title: 'directory.sections.status',
    fields: ['isActive'],
    columns: 1,
  },
];
