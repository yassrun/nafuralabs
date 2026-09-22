import { Injectable, computed, signal } from '@angular/core';

import {
  AppShellContextAdmin,
  AppShellContextRailConfig,
  AppShellContextSlot,
} from './app-shell.types';

/**
 * Business-context activation for one generated app.
 * `enabled` is a Nafura setting. `storageKey` is the sandbox stand-in for that API.
 */
@Injectable()
export class AppShellContextRailService {
  private readonly state = signal<Required<Pick<AppShellContextRailConfig, 'enabled' | 'slots'>> & {
    admin: AppShellContextAdmin | null;
    storageKey: string;
  }>({
    enabled: false,
    admin: null,
    slots: [],
    storageKey: '',
  });

  readonly railEnabled = computed(() => this.state().enabled);
  readonly admin = computed(() => this.state().admin);
  readonly slots = computed(() => this.state().slots);
  readonly visibleSlots = computed(() => this.slots().filter((slot) => slot.enabled));

  load(config: AppShellContextRailConfig | undefined): void {
    const storageKey = config?.storageKey ?? '';
    const slots = applyStored(config?.slots ?? [], storageKey);
    this.state.set({
      enabled: config?.enabled ?? false,
      admin: config?.admin ?? null,
      slots,
      storageKey,
    });
  }

  isEnabled(id: string): boolean {
    return this.slots().some((slot) => slot.id === id && slot.enabled);
  }

  setEnabled(id: string, enabled: boolean): void {
    const next = this.slots().map((slot) => (slot.id === id ? { ...slot, enabled } : slot));
    this.state.update((current) => ({ ...current, slots: next }));
    persist(this.state().storageKey, next);
  }
}

function applyStored(
  slots: readonly AppShellContextSlot[],
  storageKey: string,
): AppShellContextSlot[] {
  const stored = readStored(storageKey);
  return slots.map((slot) =>
    stored && slot.id in stored ? { ...slot, enabled: stored[slot.id] } : { ...slot },
  );
}

function readStored(storageKey: string): Record<string, boolean> | null {
  if (!storageKey || typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function persist(storageKey: string, slots: readonly AppShellContextSlot[]): void {
  if (!storageKey || typeof localStorage === 'undefined') return;
  const payload: Record<string, boolean> = {};
  for (const slot of slots) payload[slot.id] = slot.enabled;
  localStorage.setItem(storageKey, JSON.stringify(payload));
}
