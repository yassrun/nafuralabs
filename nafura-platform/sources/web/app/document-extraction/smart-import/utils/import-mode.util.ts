import type { SmartImportMode } from '../models/smart-import.model';

export function buildInstructionsForMode(
  baseInstructions: string | undefined,
  arrayPath: string,
  mode: SmartImportMode,
): string | undefined {
  const modeHint =
    mode === 'single'
      ? [
          'IMPORT MODE: SINGLE RECORD.',
          `Output the "${arrayPath}" array with one item when the source is a single fiche, form, or product sheet.`,
          'If the file is clearly a multi-row table, still extract all rows.',
        ].join('\n')
      : [
          'IMPORT MODE: BULK TABLE.',
          `Extract every data row into the "${arrayPath}" array from spreadsheets or multi-line lists.`,
          'Do not stop after the first row when more rows are present.',
        ].join('\n');

  if (!baseInstructions?.trim()) {
    return modeHint;
  }
  return `${baseInstructions.trim()}\n\n${modeHint}`;
}
