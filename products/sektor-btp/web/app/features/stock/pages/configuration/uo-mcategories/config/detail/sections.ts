/**
 * UoMCategory Detail Sections — Auto-generated from uo-mcategory.entity.json
 */

import type { DetailSectionConfig } from '@lib/anatomy/types';
import type { UoMCategory } from '../../models';

export const SECTIONS: DetailSectionConfig<UoMCategory>[] = [
  {
    id: 'general',
    title: 'common.sections.general',
    fields: ['code', 'name', 'description', 'isActive'],
    columns: 2,
  },
];
