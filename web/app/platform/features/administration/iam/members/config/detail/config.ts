import { buildDetailConfig } from '@lib/anatomy';
import type { DetailPageConfig } from '@lib/anatomy/types';

import type { Member } from '../../models';
import { FIELDS } from './fields';
import { ROUTES } from './routes';
import { SECTIONS } from './sections';

const CREATE_FIELDS = FIELDS.filter((field) => field.key !== 'status');
const CREATE_SECTIONS = SECTIONS.filter((section) => section.id !== 'status');

export const MEMBER_DETAIL_CONFIG: DetailPageConfig<Member> =
  buildDetailConfig<Member>(
    {
      entityName: 'Member',
      permissionPrefix: 'administration.members',
      fields: FIELDS,
      routes: ROUTES,
    },
    {
      sections: SECTIONS,
      actions: {
        hideActions: ['delete', 'duplicate'],
      },
      saveSuccessMessage: 'Member saved successfully',
      saveErrorMessage: 'Failed to save member',
    }
  );

export const MEMBER_DETAIL_CREATE_CONFIG: DetailPageConfig<Member> =
  buildDetailConfig<Member>(
    {
      entityName: 'Member',
      permissionPrefix: 'administration.members',
      fields: CREATE_FIELDS,
      routes: ROUTES,
    },
    {
      sections: CREATE_SECTIONS,
      actions: {
        hideActions: ['delete', 'duplicate'],
      },
      saveSuccessMessage: 'Invitation sent successfully',
      saveErrorMessage: 'Failed to invite member',
    }
  );
