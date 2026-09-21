import type { ButtonVariant } from '../../atoms/button';

export type FileSlotDensity = 'comfortable' | 'compact';

/** One named document slot — type + file + built-in actions. */
export interface FileSlotModel {
  id: string;
  /** Badge, e.g. CPS / BDP / PLA. */
  type: string;
  /** Longer title (grouped rows / destination cards). */
  label?: string;
  required?: boolean;
  /**
   * false (default): shown inline by `nf-file-slots`.
   * true: folded into the list’s “other documents” group.
   */
  grouped?: boolean;
  fileId?: string | null;
  fileName?: string | null;
  busy?: boolean;
  opening?: boolean;
  locked?: boolean;
  lockedLabel?: string;
  dropLabel?: string;
  emptyStatus?: string;
  /** Pastille (e.g. IA-proposed slot). */
  hint?: string;
  /** Host may dismiss the slot definition itself (not the file). */
  dismissible?: boolean;
  /**
   * Magical extract / import. Absent / null = no extract control.
   */
  extract?: FileSlotExtract | null;
}

export interface FileSlotExtract {
  label: string;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  variant?: ButtonVariant;
}

export interface FileSlotFileEvent {
  slotId: string;
  file: File;
}

export interface FileSlotIdEvent {
  slotId: string;
}
