import type { DetailSectionConfig } from '@lib/anatomy/types';

import type { Role } from '../../models';

export const SECTIONS: DetailSectionConfig<Role>[] = [
  {
    id: 'general',
    title: 'common.sections.general',
    fields: ['name', 'description', 'priority'],
    columns: 2,
  },
  {
    id: 'permissions',
    title: 'administration.roles.sections.permissions',
    fields: ['permissions'],
    columns: 1,
  },
];
