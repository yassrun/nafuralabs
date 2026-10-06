import type { DetailSectionConfig } from '@lib/anatomy/types';

import type { Member } from '../../models';

export const SECTIONS: DetailSectionConfig<Member>[] = [
  {
    id: 'identity',
    title: 'administration.members.sections.identity',
    fields: ['email', 'displayName', 'status', 'invitationEmailStatus', 'joinedAt', 'lastActivityAt'],
    columns: 2,
  },
  {
    id: 'access',
    title: 'administration.members.sections.access',
    fields: ['roleIds'],
    columns: 1,
  },
];
