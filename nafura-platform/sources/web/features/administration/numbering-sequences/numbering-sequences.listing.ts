import type { FormFieldConfig } from '../../../lib/anatomy/types';
import type { ListingPageConfig } from '../../../platform/listing';

interface NumberingSequence extends Record<string, unknown> {
  name: string;
  code: string;
  prefix: string | null;
  separator: string | null;
  yearFormat: string | null;
  resetPolicy: string | null;
  currentNumber: number;
  incrementBy: number;
  padLength: number;
}

/** The next number as documents will show it: PREFIX-2026-0042. */
const preview = (sequence: NumberingSequence): string => {
  const year = new Date().getFullYear();
  const yearPart = !sequence.yearFormat ? '' : sequence.yearFormat.toUpperCase() === 'YY' ? String(year % 100).padStart(2, '0') : String(year);
  const number = String(sequence.currentNumber).padStart(sequence.padLength, '0');
  return [sequence.prefix ?? '', yearPart, number].filter(Boolean).join(sequence.separator ?? '');
};

const t = (key: string) => `administration.numberingSequences.${key}`;
const option = (value: string, label: string) => ({ value, label });

const FIELDS: FormFieldConfig[] = [
  { key: 'name', field: 'name', label: t('fields.name'), type: 'text', required: true },
  { key: 'code', field: 'code', label: t('fields.code'), type: 'text', required: true, placeholder: 'INVOICE' },
  { key: 'prefix', field: 'prefix', label: t('fields.prefix'), type: 'text', placeholder: 'FAC' },
  { key: 'separator', field: 'separator', label: t('fields.separator'), type: 'select', options: [option('', t('none')), option('-', '-'), option('/', '/'), option('.', '.')] },
  { key: 'yearFormat', field: 'yearFormat', label: t('fields.yearFormat'), type: 'select', options: [option('', t('none')), option('YYYY', 'AAAA'), option('YY', 'AA')] },
  { key: 'padLength', field: 'padLength', label: t('fields.padLength'), type: 'number', required: true, validation: { min: 1, max: 12 } },
  { key: 'incrementBy', field: 'incrementBy', label: t('fields.incrementBy'), type: 'number', required: true, validation: { min: 1 } },
  { key: 'currentNumber', field: 'currentNumber', label: t('fields.currentNumber'), type: 'number', required: true, validation: { min: 0 } },
  { key: 'resetPolicy', field: 'resetPolicy', label: t('fields.resetPolicy'), type: 'select', options: ['NEVER', 'YEARLY', 'MONTHLY'].map((value) => option(value, t(`resetPolicy.${value}`))) },
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

export const NUMBERING_SEQUENCES_LISTING: ListingPageConfig<NumberingSequence> = {
  title: t('title'),
  subtitle: t('subtitle'),
  icon: 'repeat',
  endpoint: '/api/v1/numbering-sequences',
  emptyMessage: t('empty'),
  searchFields: ['name', 'code', 'prefix'],
  columns: [
    { key: 'name', field: 'name', label: t('columns.name'), sortable: true },
    { key: 'code', field: 'code', label: t('columns.code'), cssClass: 'nf-cell--mono', sortable: true },
    { key: 'preview', field: 'prefix', label: t('columns.preview'), transform: (_, sequence) => preview(sequence as NumberingSequence), cssClass: 'nf-cell--mono' },
    { key: 'current', field: 'currentNumber', label: t('columns.current'), type: 'number', width: '100px' },
    { key: 'resetPolicy', field: 'resetPolicy', label: t('columns.resetPolicy'), type: 'badge', transform: (policy) => t(`resetPolicy.${policy ?? 'NEVER'}`), width: '170px' },
  ],
  actions: [
    {
      id: 'create',
      label: t('actions.create'),
      icon: 'plus',
      variant: 'primary',
      permission: 'settings.sysconfig.numbering-sequence.create',
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
      permission: 'settings.sysconfig.numbering-sequence.update',
      form: {
        title: t('dialog.editTitle'),
        fields: FIELDS,
        values: (sequence) => ({ ...sequence, separator: sequence?.separator ?? '', yearFormat: sequence?.yearFormat ?? '' }),
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
      permission: 'settings.sysconfig.numbering-sequence.delete',
      confirm: { title: t('actions.delete'), message: t('deleteConfirm'), confirmLabel: t('actions.delete'), danger: true },
      request: { method: 'DELETE' },
      success: t('deleted'),
    },
  ],
};
