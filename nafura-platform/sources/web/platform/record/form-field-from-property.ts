import type { FormFieldConfig, FormFieldType } from '../../lib/anatomy/types';
import type { RecordProperties, RecordPropertyView } from '../listing/listing-properties';
import type { RecordField } from './record-page.types';

/**
 * Fills a record form field from `GET {endpoint}/properties` when `type` is omitted.
 * An explicit `type` always wins. Currency for `money`: field → property → MAD.
 */
export function resolveRecordField(
  field: RecordField,
  properties: RecordProperties = {},
): FormFieldConfig {
  const property = properties[field.field] ?? properties[field.key];
  const type = field.type ?? typeFromProperty(property);
  const resolved: FormFieldConfig = {
    ...field,
    type,
  };

  if (type === 'money') {
    resolved.currency = field.currency ?? property?.currency ?? 'MAD';
  }

  if (!field.options?.length && property?.values?.length && (type === 'select' || type === 'multiselect' || type === 'radio')) {
    resolved.options = property.values.map((value) => ({ label: value.label, value: value.id }));
  }

  if (!field.lookupKey && !resolved.options?.length && property?.type === 'relation' && type === 'select') {
    resolved.lookupKey = field.key;
  }

  return resolved;
}

function typeFromProperty(property: RecordPropertyView | undefined): FormFieldType {
  if (!property) return 'text';
  switch (property.type) {
    case 'money':
      return 'money';
    case 'number':
      return 'number';
    case 'date':
      return 'date';
    case 'boolean':
      return 'checkbox';
    case 'select':
    case 'status':
    case 'relation':
    case 'person':
      return 'select';
    default:
      return 'text';
  }
}
