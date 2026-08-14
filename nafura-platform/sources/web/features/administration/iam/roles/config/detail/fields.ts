import type { DetailFieldConfig } from '@lib/anatomy/types';

import type { Role } from '../../models';

export const FIELDS: DetailFieldConfig<Role>[] = [
  {
    key: 'roleCode',
    label: 'administration.roles.fields.roleCode',
    type: 'text',
    required: true,
    width: 'md',
    validators: [{ type: 'maxLength', value: 50 }],
    visible: (ctx) => !(ctx as Partial<Role & { id?: string }>).id,
  },
  {
    key: 'name',
    label: 'administration.roles.fields.name',
    type: 'text',
    required: true,
    width: 'md',
    validators: [{ type: 'maxLength', value: 120 }],
  },
  {
    key: 'description',
    label: 'administration.roles.fields.description',
    type: 'textarea',
    width: 'full',
    validators: [{ type: 'maxLength', value: 1000 }],
  },
  {
    key: 'priority',
    label: 'administration.roles.fields.priority',
    type: 'number',
    width: 'sm',
  },
];
