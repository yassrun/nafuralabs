import type { DetailSectionConfig } from '@lib/anatomy/types';

import type { Member } from '../../models';

export const SECTIONS: DetailSectionConfig<Member>[] = [
  {
    id: 'identity',
    title: 'administration.members.sections.identity',
    fields: ['firstName', 'lastName', 'email', 'displayName'],
    columns: 2,
  },
  {
    id: 'access',
    title: 'administration.members.sections.access',
    fields: ['roleIds'],
    columns: 1,
  },
  {
    id: 'status',
    title: 'common.sections.status',
    fields: ['status'],
    columns: 1,
  },
];
