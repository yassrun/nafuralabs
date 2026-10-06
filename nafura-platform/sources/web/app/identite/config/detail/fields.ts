import type { DetailFieldConfig } from '@lib/anatomy/types';

import type { Member } from '../../models';

/** Fields for the member detail (edit). Create uses a subset + invite message. */
export const FIELDS: DetailFieldConfig<Member>[] = [
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
    readonly: true,
    width: 'md',
  },
  {
    key: 'status',
    label: 'administration.members.fields.status',
    type: 'select',
    readonly: true,
    width: 'md',
    options: [
      { label: 'administration.members.status.active', value: 'active' },
      { label: 'administration.members.status.invited', value: 'invited' },
      { label: 'administration.members.status.suspended', value: 'suspended' },
    ],
  },
  {
    key: 'invitationEmailStatus',
    label: 'administration.members.fields.invitationEmailStatus',
    type: 'select',
    readonly: true,
    width: 'md',
    visible: (value) => value['status'] === 'invited',
    options: [
      { label: 'administration.members.emailStatus.sent', value: 'sent' },
      { label: 'administration.members.emailStatus.failed', value: 'failed' },
      { label: 'administration.members.emailStatus.pending', value: 'pending' },
    ],
  },
  {
    key: 'joinedAt',
    label: 'administration.members.detail.joined',
    type: 'text',
    readonly: true,
    width: 'md',
  },
  {
    key: 'lastActivityAt',
    label: 'administration.members.detail.lastActivity',
    type: 'text',
    readonly: true,
    width: 'md',
  },
  {
    key: 'roleIds',
    label: 'administration.members.fields.roles',
    type: 'multi-select',
    required: true,
    width: 'full',
    lookupKey: 'roles',
    lookupEndpoint: '/api/tenants/{tenantId}/roles',
    lookupDisplayField: 'name',
    lookupValueField: 'id',
    searchable: true,
  },
];

export const INVITE_MESSAGE_FIELD: DetailFieldConfig<Member> = {
  key: 'message',
  label: 'administration.members.fields.message',
  type: 'textarea',
  width: 'full',
  validators: [{ type: 'maxLength', value: 500 }],
};
