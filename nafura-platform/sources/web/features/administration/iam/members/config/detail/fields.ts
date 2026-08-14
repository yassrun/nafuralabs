import type { DetailFieldConfig } from '@lib/anatomy/types';

import type { Member } from '../../models';

export const FIELDS: DetailFieldConfig<Member>[] = [
  {
    key: 'firstName',
    label: 'administration.members.fields.firstName',
    type: 'text',
    required: true,
    width: 'md',
    validators: [{ type: 'maxLength', value: 120 }],
  },
  {
    key: 'lastName',
    label: 'administration.members.fields.lastName',
    type: 'text',
    required: true,
    width: 'md',
    validators: [{ type: 'maxLength', value: 120 }],
  },
  {
    key: 'email',
    label: 'administration.members.fields.email',
    type: 'email',
    required: true,
    readonlyOnEdit: true,
    width: 'md',
    validators: [{ type: 'email' }],
  },
  {
    key: 'displayName',
    label: 'administration.members.fields.displayName',
    type: 'text',
    width: 'md',
    validators: [{ type: 'maxLength', value: 255 }],
  },
  {
    key: 'roleIds',
    label: 'administration.members.fields.roles',
    type: 'multi-select',
    width: 'full',
    lookupKey: 'roles',
    lookupEndpoint: '/api/tenants/{tenantId}/roles',
    lookupDisplayField: 'name',
    lookupValueField: 'id',
  },
  {
    key: 'status',
    label: 'administration.members.fields.status',
    type: 'select',
    width: 'md',
    options: [
      { label: 'administration.members.status.active', value: 'active' },
      { label: 'administration.members.status.invited', value: 'invited' },
      { label: 'administration.members.status.suspended', value: 'suspended' },
    ],
  },
];
