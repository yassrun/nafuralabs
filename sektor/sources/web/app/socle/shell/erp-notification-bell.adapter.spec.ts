import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { ApiConfigService } from '@platform/core/config/api-config.service';
import { NotificationStreamService } from '@platform/app/notification/services/notification-stream.service';
import { NotificationUnreadService } from '@platform/app/notification/services/notification-unread.service';

import { ErpChromeSnapshotService } from './erp-chrome-snapshot.service';
import { ErpNotificationBellAdapter } from './erp-notification-bell.adapter';
import { ErpNotificationsService } from './erp-notifications.service';

describe('ErpNotificationBellAdapter', () => {
  let http: HttpTestingController;
  let adapter: ErpNotificationBellAdapter;
  let stream: { subscribe: jasmine.Spy; connect: jasmine.Spy };
  let erp: ErpNotificationsService;

  beforeEach(() => {
    stream = {
      subscribe: jasmine.createSpy('subscribe').and.returnValue(() => undefined),
      connect: jasmine.createSpy('connect'),
    };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ErpNotificationBellAdapter,
        ErpNotificationsService,
        ErpChromeSnapshotService,
        NotificationUnreadService,
        { provide: NotificationStreamService, useValue: stream },
        { provide: ApiConfigService, useValue: { apiBaseUrl: () => 'http://api' } },
        { provide: Router, useValue: { navigateByUrl: () => Promise.resolve(true) } },
        {
          provide: TranslateService,
          useValue: { instant: (key: string) => key },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    adapter = TestBed.inject(ErpNotificationBellAdapter);
    erp = TestBed.inject(ErpNotificationsService);
  });

  afterEach(() => {
    erp.stopPolling();
    http.verify();
  });

  function flushRefresh(unread: number, alerts: number): void {
    http.expectOne('http://api/api/v1/erp/chrome').flush({
      completeness: null,
      alerts: Array.from({ length: alerts }, (_, i) => ({
        id: `a-${i}`,
        type: 'PILOTAGE',
        titre: 'Alerte',
        detail: '',
        urgence: 'NORMALE',
        route: '/',
        date: '2026-09-16',
      })),
    });
    http
      .expectOne('http://api/api/v1/platform/collaboration/notifications/unread-count')
      .flush({ count: unread });
  }

  it('starts at 0 until refresh (badge hidden until the count is fetched)', () => {
    expect(adapter.count()).toBe(0);
  });

  it('refresh hydrates badge count and starts live updates once', async () => {
    const pending = adapter.refresh();
    flushRefresh(4, 8);
    await pending;

    expect(adapter.count()).toBe(12);
    expect(stream.subscribe).toHaveBeenCalledTimes(1);
    expect(stream.connect).toHaveBeenCalledTimes(1);

    const again = adapter.refresh();
    flushRefresh(1, 1);
    await again;
    expect(adapter.count()).toBe(2);
    expect(stream.subscribe).toHaveBeenCalledTimes(1);
    expect(stream.connect).toHaveBeenCalledTimes(1);
    expect(erp.totalCount()).toBe(1);
  });
});
