/**
 * Import / Export Dialog Data
 *
 * Passed to ImportExportModalComponent via MAT_DIALOG_DATA.
 * Config + handlers provided by the listing page.
 */

import type { ImportExportConfig, ImportResult } from '@lib/anatomy/types';

export interface ImportExportDialogData {
  config: ImportExportConfig;
  /** Generate and download CSV template (stable column keys). */
  downloadTemplate: () => void;
  /**
   * Run import by sending the raw file to the backend (preferred).
   * Backend parses, validates, and returns ImportResult.
   */
  importFile?: (file: File) => Promise<ImportResult>;
  /**
   * @deprecated Prefer importFile. Run import with client-parsed rows (fallback when no backend).
   */
  importRows?: (rows: Record<string, string>[]) => Promise<ImportResult>;
  /** Export current view (filters + sort). Uses backend export when available. */
  exportView: () => Promise<void>;
  /** Export selected rows only (if selection exists). Client-side only. */
  exportSelection?: () => Promise<void>;
  /** Whether there are selected rows (for Export tab option). */
  hasSelection?: () => boolean;
}
