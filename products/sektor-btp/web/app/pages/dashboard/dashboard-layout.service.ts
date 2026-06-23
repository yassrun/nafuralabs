import { Injectable, computed, signal } from '@angular/core';

/** Persona presets (DG / conducteur de travaux / comptable). */
export type DashboardPersona = 'dg' | 'conducteur' | 'comptable';

/** Draggable dashboard blocks (KPI groups + analytics strip). */
export const DASHBOARD_WIDGET_IDS = [
  'kpi-chantiers',
  'kpi-finance',
  'charts-analytics',
  'kpi-achats',
  'kpi-rh',
  'kpi-hse',
] as const;

export type DashboardWidgetId = (typeof DASHBOARD_WIDGET_IDS)[number];

const STORAGE_PERSONA = 'erp.dashboard.persona.v1';

function orderStorageKey(persona: DashboardPersona): string {
  return `erp.dashboard.widgetOrder.v1.${persona}`;
}

const PRESETS: Record<DashboardPersona, DashboardWidgetId[]> = {
  dg: [...DASHBOARD_WIDGET_IDS],
  conducteur: [
    'kpi-chantiers',
    'charts-analytics',
    'kpi-achats',
    'kpi-hse',
    'kpi-finance',
    'kpi-rh',
  ],
  comptable: [
    'kpi-finance',
    'kpi-achats',
    'charts-analytics',
    'kpi-rh',
    'kpi-chantiers',
    'kpi-hse',
  ],
};

function isValidOrder(ids: unknown): ids is DashboardWidgetId[] {
  if (!Array.isArray(ids) || ids.length !== DASHBOARD_WIDGET_IDS.length) return false;
  const set = new Set(ids);
  return DASHBOARD_WIDGET_IDS.every((id) => set.has(id));
}

function loadPersona(): DashboardPersona {
  try {
    const raw = localStorage.getItem(STORAGE_PERSONA);
    if (raw === 'dg' || raw === 'conducteur' || raw === 'comptable') return raw;
  } catch {
    /* ignore */
  }
  return 'dg';
}

function loadOrder(persona: DashboardPersona): DashboardWidgetId[] {
  try {
    const raw = localStorage.getItem(orderStorageKey(persona));
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (isValidOrder(parsed)) return parsed;
    }
  } catch {
    /* ignore */
  }
  return [...PRESETS[persona]];
}

@Injectable({ providedIn: 'root' })
export class DashboardLayoutService {
  private readonly persona = signal<DashboardPersona>(loadPersona());
  private readonly widgetOrder = signal<DashboardWidgetId[]>(loadOrder(loadPersona()));

  readonly currentPersona = this.persona.asReadonly();
  readonly orderedWidgets = this.widgetOrder.asReadonly();

  readonly isCustomOrder = computed(() => {
    const p = this.persona();
    const preset = PRESETS[p];
    const cur = this.widgetOrder();
    return !preset.every((id, i) => id === cur[i]);
  });

  setPersona(p: DashboardPersona): void {
    this.persona.set(p);
    try {
      localStorage.setItem(STORAGE_PERSONA, p);
    } catch {
      /* ignore */
    }
    this.widgetOrder.set(loadOrder(p));
  }

  reorder(previousIndex: number, currentIndex: number): void {
    const copy = [...this.widgetOrder()];
    const [moved] = copy.splice(previousIndex, 1);
    if (moved === undefined) return;
    copy.splice(currentIndex, 0, moved);
    this.widgetOrder.set(copy);
    this.persistOrder();
  }

  resetToPreset(): void {
    const p = this.persona();
    try {
      localStorage.removeItem(orderStorageKey(p));
    } catch {
      /* ignore */
    }
    this.widgetOrder.set([...PRESETS[p]]);
  }

  private persistOrder(): void {
    try {
      localStorage.setItem(
        orderStorageKey(this.persona()),
        JSON.stringify(this.widgetOrder()),
      );
    } catch {
      /* ignore */
    }
  }
}
