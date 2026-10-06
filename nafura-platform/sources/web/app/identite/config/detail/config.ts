import { buildDetailConfig } from '@lib/anatomy';
import type { DetailActionConfig, DetailPageConfig } from '@lib/anatomy/types';

import type { Member } from '../../models';
import { FIELDS, INVITE_MESSAGE_FIELD } from './fields';
import { ROUTES } from './routes';
import { SECTIONS } from './sections';

const MEMBER_LIFECYCLE_ACTIONS: DetailActionConfig<Member>[] = [
  {
    id: 'resend-invitation',
    label: 'administration.members.detail.actions.resend',
    icon: 'mail',
    scope: 'edit',
    variant: 'secondary',
    position: 'right',
    order: 10,
    permission: 'tenant.members.invite',
    visible: (ctx) => ctx.item?.status === 'invited',
  },
  {
    id: 'reactivate',
    label: 'administration.members.detail.actions.reactivate',
    icon: 'user-check',
    scope: 'edit',
    variant: 'primary',
    position: 'right',
    order: 20,
    permission: 'tenant.members.suspend',
    visible: (ctx) => ctx.item?.status === 'suspended',
  },
  {
    id: 'deactivate',
    label: 'administration.members.detail.actions.deactivate',
    icon: 'user-x',
    scope: 'edit',
    variant: 'danger',
    position: 'right',
    order: 30,
    permission: 'tenant.members.suspend',
    visible: (ctx) => ctx.item?.status === 'active',
    confirm: {
      title: 'administration.members.detail.actions.deactivate',
      message: (item) =>
        item
          ? `Suspendre l'accès de ${memberLabel(item)} ?`
          : 'Suspendre l’accès de ce membre ?',
      confirmLabel: 'administration.members.detail.actions.deactivate',
    },
  },
  {
    id: 'remove',
    label: 'administration.members.detail.actions.remove',
    icon: 'trash-2',
    scope: 'edit',
    variant: 'danger',
    position: 'right',
    order: 40,
    permission: 'tenant.members.remove',
    visible: (ctx) => Boolean(ctx.item && ctx.item.status !== 'active'),
    confirm: {
      title: 'administration.members.detail.actions.remove',
      message: (item) =>
        item
          ? `Retirer ${memberLabel(item)} de cette organisation ?`
          : 'Retirer ce membre de cette organisation ?',
      confirmLabel: 'administration.members.detail.actions.remove',
    },
  },
];

function memberLabel(member: Member): string {
  return (
    member.displayName ||
    `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim() ||
    member.email
  );
}

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
        appendActions: MEMBER_LIFECYCLE_ACTIONS,
        overrideActions: {
          save: {
            label: 'administration.members.detail.roles.save',
            permission: 'tenant.members.write',
          },
        },
      },
      saveSuccessMessage: 'administration.members.detail.roles.saved',
      saveErrorMessage: 'administration.members.detail.roles.saveError',
      features: { audit: true },
      entityTypeForAudit: 'tenant-member',
    }
  );

const CREATE_FIELD_KEYS = new Set(['email', 'roleIds', 'message']);
const CREATE_FIELDS = [
  ...FIELDS.filter((field) => CREATE_FIELD_KEYS.has(String(field.key))),
  INVITE_MESSAGE_FIELD,
];
const CREATE_SECTIONS = SECTIONS.map((section) => ({
  ...section,
  fields:
    section.id === 'identity'
      ? ['email', 'message']
      : section.fields.filter((key) => CREATE_FIELD_KEYS.has(String(key))),
}));

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
        overrideActions: {
          save: {
            label: 'administration.members.invite',
            permission: 'tenant.members.invite',
          },
        },
      },
      saveSuccessMessage: 'administration.members.feedback.inviteSuccess',
      saveErrorMessage: 'administration.members.feedback.inviteError',
    }
  );
