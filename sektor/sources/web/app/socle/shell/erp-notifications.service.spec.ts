import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { ApiConfigService } from '@platform/core/config/api-config.service';

import { ErpChromeSnapshotService } from './erp-chrome-snapshot.service';
import { ErpNotificationsService } from './erp-notifications.service';

describe('ErpNotificationsService — chrome snapshot', () => {
  let http: HttpTestingController;
  let svc: ErpNotificationsService;
  let chrome: ErpChromeSnapshotService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ErpNotificationsService,
        ErpChromeSnapshotService,
        { provide: ApiConfigService, useValue: { apiBaseUrl: () => 'http://api' } },
        { provide: Router, useValue: { navigateByUrl: () => Promise.resolve(true) } },
        {
          provide: TranslateService,
          useValue: {
            instant: (key: string, params?: Record<string, unknown>) =>
              `${key}:${params?.['numero'] ?? ''}:${params?.['count'] ?? ''}`,
          },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    svc = TestBed.inject(ErpNotificationsService);
    chrome = TestBed.inject(ErpChromeSnapshotService);
  });

  afterEach(() => http.verify());

  it('refresh hydrates alerts and completeness from a single GET /erp/chrome', async () => {
    const pending = svc.refresh();
    const req = http.expectOne('http://api/api/v1/erp/chrome');
    expect(req.request.method).toBe('GET');
    req.flush({
      completeness: { score: 100, sections: [] },
      alerts: [
        {
          id: 'facture-1',
          type: 'FACTURE_RETARD',
          titreKey: 'shared.alerts.factureLate',
          titreParams: { numero: 'FAC-1', count: 4 },
          detail: 'Client : MOA',
          urgence: 'NORMALE',
          route: '/marches/factures/1',
          date: '2026-08-01',
        },
      ],
    });
    await pending;
    expect(svc.alerts()[0].titre).toBe('shared.alerts.factureLate:FAC-1:4');
    expect(chrome.completeness()?.score).toBe(100);
  });
});
