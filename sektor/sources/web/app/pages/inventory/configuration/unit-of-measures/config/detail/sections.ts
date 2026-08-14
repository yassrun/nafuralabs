/**
 * UnitOfMeasure Detail Sections
 */

import type { DetailSectionConfig } from '@lib/anatomy/types';
import type { UnitOfMeasure } from '../../models';

export const SECTIONS: DetailSectionConfig<UnitOfMeasure>[] = [
  {
    id: 'general',
    title: 'common.sections.general',
    fields: ['code', 'name', 'uomCategoryId', 'facteurVersBase', 'estBase', 'description', 'isActive'],
    columns: 2,
  },
];
