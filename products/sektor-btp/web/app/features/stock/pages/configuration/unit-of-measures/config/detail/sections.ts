/**
 * UnitOfMeasure Detail Sections — Auto-generated from unit-of-measure.entity.json
 */

import type { DetailSectionConfig } from '@lib/anatomy/types';
import type { UnitOfMeasure } from '../../models';

export const SECTIONS: DetailSectionConfig<UnitOfMeasure>[] = [
  {
    id: 'general',
    title: 'common.sections.general',
    fields: ['code', 'name', 'uomCategoryId', 'description', 'isActive'],
    columns: 2,
  },
];
