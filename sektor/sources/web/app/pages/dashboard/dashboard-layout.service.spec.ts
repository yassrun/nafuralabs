import { TestBed } from '@angular/core/testing';

import {
  DashboardLayoutService,
  DASHBOARD_WIDGET_IDS,
} from './dashboard-layout.service';

describe('DashboardLayoutService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('resetToPreset restores default order for DG', () => {
    const svc = TestBed.inject(DashboardLayoutService);
    svc.reorder(0, 3);
    expect(svc.orderedWidgets()[0]).not.toBe(DASHBOARD_WIDGET_IDS[0]);
    svc.resetToPreset();
    expect(svc.orderedWidgets()).toEqual([...DASHBOARD_WIDGET_IDS]);
  });

  it('setPersona loads preset order when no custom storage', () => {
    const svc = TestBed.inject(DashboardLayoutService);
    svc.setPersona('comptable');
    expect(svc.orderedWidgets()[0]).toBe('kpi-finance');
    svc.setPersona('conducteur');
    expect(svc.orderedWidgets()[0]).toBe('kpi-chantiers');
  });

  it('persists reorder to localStorage for current persona', () => {
    const svc = TestBed.inject(DashboardLayoutService);
    svc.setPersona('dg');
    svc.reorder(0, 1);
    const raw = localStorage.getItem('erp.dashboard.widgetOrder.v1.dg');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!) as string[];
    expect(parsed[0]).toBe(DASHBOARD_WIDGET_IDS[1]);
  });
});
