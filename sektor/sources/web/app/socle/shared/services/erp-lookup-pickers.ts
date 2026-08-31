import { MatDialog } from '@angular/material/dialog';

import type { LookupPickerFn } from '@platform/lib/anatomy';

import { openCatalogItemPicker } from '@app/etudes/dossiers/components/catalog-item-pick-dialog/catalog-item-pick-dialog.component';

/**
 * Overlay pickers for keys excluded from combobox typeahead (AC article / AC-11).
 */
export function buildErpLookupPickers(dialog: MatDialog): Readonly<Record<string, LookupPickerFn>> {
  const items: LookupPickerFn = async () => {
    const result = await openCatalogItemPicker(dialog, { context: 'lookup', uniteOptions: [] });
    if (!result?.itemId) return null;
    return {
      value: result.itemId,
      label: [result.code, result.name].filter(Boolean).join(' — ') || result.name,
    };
  };

  return { items };
}
