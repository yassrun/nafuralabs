export interface NumberingSequenceColumnConfig {
  key: string;
  labelKey: string;
}

export const NUMBERING_SEQUENCES_COLUMNS: NumberingSequenceColumnConfig[] = [
  { key: 'name', labelKey: 'administration.numberingSequences.columns.name' },
  { key: 'code', labelKey: 'administration.numberingSequences.columns.code' },
  { key: 'prefix', labelKey: 'administration.numberingSequences.columns.prefix' },
  { key: 'currentNumber', labelKey: 'administration.numberingSequences.columns.current' },
  { key: 'preview', labelKey: 'administration.numberingSequences.columns.preview' },
  { key: 'resetPolicy', labelKey: 'administration.numberingSequences.columns.resetPolicy' },
];
