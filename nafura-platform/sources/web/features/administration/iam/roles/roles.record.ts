import type { ListingPageConfig, Row } from '@platform/platform/listing';
import type { RecordPageConfig, RecordSection } from '@platform/platform/record';

const ROLES = '/api/v1/platform/admin/roles';
const MEMBERS_BY_ROLE = '/api/v1/platform/admin/members/by-role';
const route = (id: string) => `/administration/roles/${id}`;

const IDENTITY: RecordSection = {
  title: 'administration.roles.title',
  fields: [
    { key: 'roleCode', field: 'roleCode', label: 'administration.roles.fields.roleCode', type: 'text', required: true, validation: { maxLength: 50 } },
    { key: 'name', field: 'name', label: 'administration.roles.fields.name', type: 'text', required: true, validation: { maxLength: 120 } },
    { key: 'description', field: 'description', label: 'administration.roles.fields.description', type: 'textarea', wide: true, validation: { maxLength: 1000 } },
  ],
};

const IDENTITY_EDIT: RecordSection = {
  title: 'administration.roles.title',
  fields: [
    { key: 'id', field: 'id', label: 'administration.roles.fields.roleCode', type: 'text', readonly: true },
    { key: 'name', field: 'name', label: 'administration.roles.fields.name', type: 'text', required: true, validation: { maxLength: 120 } },
    { key: 'description', field: 'description', label: 'administration.roles.fields.description', type: 'textarea', wide: true, validation: { maxLength: 1000 } },
  ],
};

const roleMembersListing = (role: Row): ListingPageConfig => {
  const code = String(role['id']);
  const endpoint = `${MEMBERS_BY_ROLE}/${encodeURIComponent(code)}`;
  return {
    title: 'administration.roles.detail.members.title',
    endpoint,
    pageSize: 20,
    views: [{ id: 'all', label: 'Tous', layout: 'table', show: ['email', 'displayName', 'status', 'joinedAt'] }],
    emptyState: {
      icon: 'users',
      title: 'administration.roles.detail.members.empty',
      message: 'administration.roles.detail.members.empty',
    },
    actions: [
      {
        id: 'add',
        label: 'administration.roles.detail.members.add',
        icon: 'user-plus',
        variant: 'primary',
        permission: 'tenant.roles.write',
        form: {
          title: 'administration.roles.detail.members.add',
          fields: [
            {
              key: 'memberIds',
              field: 'memberIds',
              label: 'administration.roles.detail.members.add',
              type: 'multiselect',
              lookupKey: 'members',
              required: true,
            },
          ],
          lookups: { members: '/api/v1/platform/admin/members/options' },
          body: (values) => ({
            memberIds: Array.isArray(values['memberIds']) ? values['memberIds'] : [values['memberIds']].filter(Boolean),
          }),
        },
        request: { method: 'POST', url: endpoint },
        success: 'administration.roles.detail.members.add',
      },
      {
        id: 'remove',
        row: true,
        label: 'administration.roles.detail.members.remove',
        icon: 'user-minus',
        variant: 'danger',
        permission: 'tenant.roles.write',
        confirm: {
          title: 'administration.roles.detail.members.removeConfirm.title',
          message: 'administration.roles.detail.members.removeConfirm.message',
          confirmLabel: 'administration.roles.detail.members.remove',
          danger: true,
        },
        request: { method: 'DELETE' },
        success: 'administration.roles.detail.members.remove',
      },
    ],
  };
};

export const ROLES_LISTING: ListingPageConfig = {
  title: 'administration.roles.title',
  icon: 'shield-check',
  endpoint: ROLES,
  views: [
    { id: 'all', label: 'Tous', layout: 'table', show: ['id', 'name', 'description', 'isSystem', 'memberCount'] },
    { id: 'custom', label: 'Personnalisés', layout: 'table', filter: { isSystem: { is: false } }, show: ['id', 'name', 'memberCount'] },
    { id: 'system', label: 'Système', layout: 'table', filter: { isSystem: { is: true } }, show: ['id', 'name', 'memberCount'] },
  ],
  emptyState: {
    icon: 'shield-check',
    title: 'Aucun rôle',
    message: 'Les rôles viennent des modules de l’application ; vous pouvez aussi créer des rôles personnalisés.',
  },
  open: (role) => route(String(role['id'])),
  actions: [
    {
      id: 'create',
      label: 'administration.roles.create',
      icon: 'shield-plus',
      variant: 'primary',
      permission: 'tenant.roles.write',
      route: '/administration/roles/new',
    },
    {
      id: 'delete',
      row: true,
      label: 'common.actions.delete',
      icon: 'trash-2',
      variant: 'danger',
      permission: 'tenant.roles.write',
      when: (role: Row) => role['isSystem'] !== true,
      confirm: {
        title: 'Delete Role',
        message: 'Delete this role? This action cannot be undone.',
        confirmLabel: 'common.actions.delete',
        danger: true,
      },
      request: { method: 'DELETE' },
      success: 'Role deleted',
    },
  ],
};

export const ROLE_RECORD: RecordPageConfig = {
  title: (role) => String(role['name'] ?? role['id']),
  createTitle: 'administration.roles.create',
  icon: 'shield-check',
  endpoint: ROLES,
  back: { label: 'administration.roles.title', route: '/administration/roles' },
  route,
  permissions: {
    create: 'tenant.roles.write',
    update: 'tenant.roles.write',
    delete: 'tenant.roles.write',
  },
  readonlyWhen: (role) => role['isSystem'] === true,
  layout: {
    kind: 'sections',
    sections: [
      IDENTITY_EDIT,
      {
        title: 'Permissions',
        kind: 'screen',
        requiresSaved: false,
        loadScreen: () =>
          import('../screens/role-permissions/role-permissions.component').then((m) => m.RolePermissionsSectionComponent),
      },
      {
        title: 'administration.roles.detail.members.title',
        listing: roleMembersListing,
      },
    ],
  },
  createLayout: {
    kind: 'sections',
    sections: [
      IDENTITY,
      {
        title: 'Permissions',
        kind: 'screen',
        requiresSaved: false,
        loadScreen: () =>
          import('../screens/role-permissions/role-permissions.component').then((m) => m.RolePermissionsSectionComponent),
      },
    ],
  },
  defaults: { permissions: [] },
  messages: {
    created: 'Role saved successfully',
    saved: 'Role saved successfully',
    deleted: 'Role deleted',
    deleteConfirm: 'Delete this role? This action cannot be undone.',
  },
};
