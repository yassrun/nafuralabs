/**
 * ItemType Detail Sections — Auto-generated from item-type.entity.json
 */

import type { DetailSectionConfig } from '@lib/anatomy/types';
import type { ItemType } from '../../models';

export const SECTIONS: DetailSectionConfig<ItemType>[] = [
  {
    id: 'general',
    title: 'directory.sections.general',
    fields: ['code', 'name', 'description', 'isActive'],
    columns: 2,
  },
];
