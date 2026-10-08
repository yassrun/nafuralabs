import type { FormFieldConfig } from '../../../lib/anatomy/types';
import type { ListingPageConfig } from '../../../platform/listing/listing-page.types';

const ENDPOINT = '/api/v1/numbering-sequences';
const PERMISSION = 'settings.sysconfig.numbering-sequence';
const COLUMNS = ['name', 'code', 'preview', 'currentNumber', 'resetLabel'];
const t = (key: string) => `administration.numberingSequences.${key}`;
const option = (value: string, label: string) => ({ value, label });

const FIELDS: FormFieldConfig[] = [
  { key: 'name', field: 'name', label: t('fields.name'), type: 'text', required: true },
  { key: 'code', field: 'code', label: t('fields.code'), type: 'text', required: true, placeholder: 'INVOICE' },
  { key: 'prefix', field: 'prefix', label: t('fields.prefix'), type: 'text', placeholder: 'FAC' },
  {
    key: 'separator',
    field: 'separator',
    label: t('fields.separator'),
    type: 'select',
    options: [option('', t('none')), option('-', '-'), option('/', '/'), option('.', '.')],
  },
  {
    key: 'yearFormat',
    field: 'yearFormat',
    label: t('fields.yearFormat'),
    type: 'select',
    options: [option('', t('none')), option('YYYY', 'AAAA'), option('YY', 'AA')],
  },
  { key: 'padLength', field: 'padLength', label: t('fields.padLength'), type: 'number', required: true, validation: { min: 1, max: 12 } },
  { key: 'incrementBy', field: 'incrementBy', label: t('fields.incrementBy'), type: 'number', required: true, validation: { min: 1 } },
  { key: 'currentNumber', field: 'currentNumber', label: t('fields.currentNumber'), type: 'number', required: true, validation: { min: 0 } },
  {
    key: 'resetPolicy',
    field: 'resetPolicy',
    label: t('fields.resetPolicy'),
    type: 'select',
    options: ['NEVER', 'YEARLY', 'MONTHLY'].map((value) => option(value, t(`resetPolicy.${value}`))),
  },
];

const body = (values: Record<string, unknown>) => ({
  ...values,
  prefix: String(values['prefix'] ?? '').trim() || null,
  separator: values['separator'] || null,
  yearFormat: values['yearFormat'] || null,
  padLength: Number(values['padLength']),
  incrementBy: Number(values['incrementBy']),
  currentNumber: Number(values['currentNumber']),
});

/** Numbering sequences: a record. Preview and reset label are computed on the server. */
export const NUMBERING_SEQUENCES_LISTING: ListingPageConfig = {
  title: t('title'),
  subtitle: t('subtitle'),
  icon: 'repeat',
  endpoint: ENDPOINT,
  quickFilters: [{ property: 'resetLabel' }],
  views: [{ id: 'all', label: t('views.all'), layout: 'table', show: COLUMNS }],
  emptyState: { icon: 'repeat', title: t('empty'), message: t('emptyHint') },
  actions: [
    {
      id: 'create',
      label: t('actions.create'),
      icon: 'plus',
      variant: 'primary',
      permission: `${PERMISSION}.create`,
      form: {
        title: t('dialog.createTitle'),
        fields: FIELDS,
        values: () => ({ separator: '-', yearFormat: 'YYYY', padLength: 4, incrementBy: 1, currentNumber: 1, resetPolicy: 'YEARLY' }),
        body,
      },
      request: { method: 'POST' },
      success: t('saved'),
    },
    {
      id: 'edit',
      row: true,
      label: t('actions.edit'),
      icon: 'pencil',
      permission: `${PERMISSION}.update`,
      form: {
        title: t('dialog.editTitle'),
        fields: FIELDS,
        values: (sequence) => ({ ...sequence, separator: sequence?.['separator'] ?? '', yearFormat: sequence?.['yearFormat'] ?? '' }),
        body,
      },
      request: { method: 'PUT' },
      success: t('saved'),
    },
    {
      id: 'delete',
      row: true,
      label: t('actions.delete'),
      icon: 'trash-2',
      variant: 'danger',
      permission: `${PERMISSION}.delete`,
      confirm: { title: t('actions.delete'), message: t('deleteConfirm'), confirmLabel: t('actions.delete'), danger: true },
      request: { method: 'DELETE' },
      success: t('deleted'),
    },
  ],
};
