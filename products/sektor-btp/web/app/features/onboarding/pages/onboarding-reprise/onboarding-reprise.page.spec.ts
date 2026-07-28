import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { ToastService } from '@lib/anatomy';
import { SmartImportTriggerComponent } from '@platform/features/documents/smart-import';
import { ClientImportService } from '@app/shared/smart-import/handlers/client-import.handler';
import { FournisseurImportService } from '@app/shared/smart-import/handlers/fournisseur-import.handler';
import { EmployeImportService } from '@app/shared/smart-import/handlers/employe-import.handler';
import { OnboardingApiService } from '../../services/onboarding-api.service';
import { OnboardingReprisePage } from './onboarding-reprise.page';

@Component({
  selector: 'nf-smart-import-trigger',
  standalone: true,
  template: '',
})
class SmartImportTriggerStubComponent {}

describe('OnboardingReprisePage', () => {
  let api: jasmine.SpyObj<OnboardingApiService>;
  let router: jasmine.SpyObj<Router>;
  let clientImport: jasmine.SpyObj<ClientImportService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<OnboardingApiService>('OnboardingApiService', ['getState', 'saveState']);
    api.getState.and.resolveTo({
      currentStep: 5,
      answers: {},
      tenantId: 't-1',
      completed: true,
    });
    api.saveState.and.resolveTo({
      currentStep: 5,
      answers: {},
      tenantId: 't-1',
      completed: true,
    });
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    clientImport = jasmine.createSpyObj<ClientImportService>('ClientImportService', ['import']);
    clientImport.import.and.resolveTo({ created: 2, skippedDuplicates: 1 });

    TestBed.configureTestingModule({
      imports: [OnboardingReprisePage, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: OnboardingApiService, useValue: api },
        { provide: Router, useValue: router },
        { provide: ClientImportService, useValue: clientImport },
        {
          provide: FournisseurImportService,
          useValue: jasmine.createSpyObj('FournisseurImportService', ['import']),
        },
        {
          provide: EmployeImportService,
          useValue: jasmine.createSpyObj('EmployeImportService', ['import']),
        },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['success', 'error']) },
      ],
    }).overrideComponent(OnboardingReprisePage, {
      remove: { imports: [SmartImportTriggerComponent] },
      add: { imports: [SmartImportTriggerStubComponent] },
    });
  });

  it('skips the current step and advances', async () => {
    const fixture = TestBed.createComponent(OnboardingReprisePage);
    const page = fixture.componentInstance;
    await page.ngOnInit();
    await fixture.whenStable();

    expect(page.stepIndex()).toBe(0);
    await page.skipStep();

    expect(page.stepIndex()).toBe(1);
    expect(page.isPassed('clients')).toBeTrue();
    expect(api.saveState).toHaveBeenCalled();
  });

  it('finishes all remaining steps and goes to the dashboard', async () => {
    const fixture = TestBed.createComponent(OnboardingReprisePage);
    const page = fixture.componentInstance;
    await page.ngOnInit();
    await fixture.whenStable();

    await page.finishAll();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
    const saved = api.saveState.calls.mostRecent().args[0];
    expect((saved.answers as { reprise: { terminee: boolean } }).reprise.terminee).toBeTrue();
  });

  it('imports clients then advances', async () => {
    const fixture = TestBed.createComponent(OnboardingReprisePage);
    const page = fixture.componentInstance;
    await page.ngOnInit();
    await fixture.whenStable();

    await page.onImportCompleted({ data: { clients: [] } } as never);

    expect(clientImport.import).toHaveBeenCalled();
    expect(page.stepIndex()).toBe(1);
  });
});
