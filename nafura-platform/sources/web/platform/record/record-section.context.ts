import { InjectionToken, type Signal, type Type } from '@angular/core';

import type { Row } from '../listing/listing-page.types';

/**
 * What a `kind: 'screen'` section receives from `nf-record-page`.
 * The section body only draws content; the platform owns the section chrome, loading and error.
 */
export interface RecordSectionContext<T extends Row = Row> {
  /** The record as shown on screen, draft edits included. */
  readonly record: Signal<T>;
  /** Last saved state, or `null` while creating. */
  readonly saved: Signal<T | null>;
  readonly editable: Signal<boolean>;
  /** Merge into the draft (shows the save bar; Ctrl+S saves). No direct PUT. */
  patch(values: Partial<T>): void;
  /** Reload the record after a section-side action. */
  reload(): Promise<void>;
}

export const RECORD_SECTION = new InjectionToken<RecordSectionContext>('RECORD_SECTION');

/** Lazy loader of a declared screen component (`placement: "section"`). */
export type ScreenLoader = () => Promise<Type<unknown>>;
