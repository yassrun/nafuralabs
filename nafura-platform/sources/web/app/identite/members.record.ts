import type { ListingPageConfig, Row } from '@platform/platform/listing';
import type { RecordPageConfig } from '@platform/platform/record';

const MEMBERS = '/api/v1/platform/admin/members';
const route = (id: string) => `/administration/members/${id}`;

export const MEMBERS_LISTING: ListingPageConfig = {
  title: 'administration.navigation.members',
  icon: 'users',
  endpoint: MEMBERS,
  quickFilters: [
    { id: 'active', label: 'administration.members.status.active', filter: { status: { is: 'active' } } },
    { id: 'invited', label: 'administration.members.status.invited', filter: { status: { is: 'invited' } } },
    { id: 'suspended', label: 'administration.members.status.suspended', filter: { status: { is: 'suspended' } } },
  ],
  views: [
    { id: 'all', label: 'Tous', layout: 'table', show: ['email', 'displayName', 'status', 'joinedAt', 'lastActivityAt'] },
    { id: 'active', label: 'Actifs', layout: 'table', filter: { status: { is: 'active' } }, show: ['email', 'displayName', 'joinedAt'] },
    { id: 'invited', label: 'Invités', layout: 'table', filter: { status: { is: 'invited' } }, show: ['email', 'displayName', 'invitationEmailStatus'] },
  ],
  emptyState: {
    icon: 'users',
    title: 'administration.members.empty',
    message: 'administration.members.empty',
  },
  open: (member) => route(String(member['id'])),
  actions: [
    {
      id: 'invite',
      label: 'administration.members.invite',
      icon: 'user-plus',
      variant: 'primary',
      permission: 'tenant.members.invite',
      form: {
        title: 'administration.members.invite',
        fields: [
          { key: 'email', field: 'email', label: 'administration.members.fields.email', type: 'email', required: true },
          {
            key: 'roles',
            field: 'roles',
            label: 'administration.members.fields.roles',
            type: 'multiselect',
            lookupKey: 'roles',
            required: true,
          },
          {
            key: 'message',
            field: 'message',
            label: 'administration.members.fields.message',
            type: 'textarea',
            validation: { maxLength: 500 },
          },
        ],
        lookups: { roles: '/api/v1/platform/admin/roles/options' },
        body: (values) => ({
          email: String(values['email'] ?? '').trim(),
          roles: Array.isArray(values['roles']) ? values['roles'] : [values['roles']].filter(Boolean),
          message: values['message'] ? String(values['message']).trim() : null,
        }),
      },
      request: { method: 'POST', url: `${MEMBERS}/invite` },
      success: 'administration.members.feedback.inviteSuccess',
    },
    {
      id: 'deactivate',
      row: true,
      label: 'administration.members.actions.deactivate',
      icon: 'user-x',
      variant: 'danger',
      permission: 'tenant.members.suspend',
      when: (member: Row) => member['status'] === 'active',
      confirm: {
        title: 'administration.members.deactivate.confirm.title',
        message: 'administration.members.deactivate.confirm.message',
        confirmLabel: 'administration.members.actions.deactivate',
        danger: true,
      },
      request: { method: 'POST', url: `${MEMBERS}/{id}/deactivate` },
      success: 'administration.members.feedback.deactivateSuccess',
    },
    {
      id: 'reactivate',
      row: true,
      label: 'administration.members.actions.reactivate',
      icon: 'user-check',
      permission: 'tenant.members.suspend',
      when: (member: Row) => member['status'] === 'suspended',
      request: { method: 'POST', url: `${MEMBERS}/{id}/reactivate` },
      success: 'administration.members.feedback.reactivateSuccess',
    },
  ],
};

export const MEMBER_RECORD: RecordPageConfig = {
  title: (member) =>
    String(member['displayName'] || member['email'] || 'administration.members.detail.title'),
  createTitle: 'administration.members.invite',
  icon: 'users',
  endpoint: MEMBERS,
  back: { label: 'administration.navigation.members', route: '/administration/members' },
  route,
  lookups: { roles: '/api/v1/platform/admin/roles/options' },
  permissions: {
    update: 'tenant.members.write',
    delete: 'tenant.members.remove',
  },
  layout: {
    kind: 'sections',
    sections: [
      {
        title: 'administration.members.sections.identity',
        fields: [
          { key: 'email', field: 'email', label: 'administration.members.fields.email', type: 'email', readonly: true },
          { key: 'displayName', field: 'displayName', label: 'administration.members.fields.displayName', type: 'text', readonly: true },
          {
            key: 'status',
            field: 'status',
            label: 'administration.members.fields.status',
            type: 'select',
            readonly: true,
            options: [
              { value: 'active', label: 'administration.members.status.active' },
              { value: 'invited', label: 'administration.members.status.invited' },
              { value: 'suspended', label: 'administration.members.status.suspended' },
            ],
          },
          { key: 'joinedAt', field: 'joinedAt', label: 'administration.members.detail.joined', type: 'text', readonly: true },
          { key: 'lastActivityAt', field: 'lastActivityAt', label: 'administration.members.detail.lastActivity', type: 'text', readonly: true },
        ],
      },
      {
        title: 'administration.members.fields.roles',
        fields: [
          {
            key: 'roleIds',
            field: 'roleIds',
            label: 'administration.members.fields.roles',
            type: 'multiselect',
            lookupKey: 'roles',
            required: true,
            wide: true,
          },
        ],
      },
    ],
  },
  actions: [
    {
      id: 'resend-invitation',
      label: 'administration.members.actions.resendInvitation',
      icon: 'mail',
      permission: 'tenant.members.invite',
      when: (member) => member['status'] === 'invited',
      request: { method: 'POST', url: `${MEMBERS}/{id}/resend-invitation` },
      result: 'none',
      success: 'administration.members.feedback.resendInvitationSuccess',
    },
    {
      id: 'deactivate',
      label: 'administration.members.actions.deactivate',
      icon: 'user-x',
      variant: 'danger',
      permission: 'tenant.members.suspend',
      when: (member) => member['status'] === 'active',
      confirm: {
        title: 'administration.members.deactivate.confirm.title',
        message: 'administration.members.deactivate.confirm.message',
        confirmLabel: 'administration.members.actions.deactivate',
        danger: true,
      },
      request: { method: 'POST', url: `${MEMBERS}/{id}/deactivate` },
      result: 'record',
      success: 'administration.members.feedback.deactivateSuccess',
    },
    {
      id: 'reactivate',
      label: 'administration.members.actions.reactivate',
      icon: 'user-check',
      permission: 'tenant.members.suspend',
      when: (member) => member['status'] === 'suspended',
      request: { method: 'POST', url: `${MEMBERS}/{id}/reactivate` },
      result: 'record',
      success: 'administration.members.feedback.reactivateSuccess',
    },
  ],
  messages: {
    saved: 'administration.members.detail.roles.saved',
    deleted: 'administration.members.feedback.removeSuccess',
    deleteConfirm: 'administration.members.remove.confirm.message',
  },
};
