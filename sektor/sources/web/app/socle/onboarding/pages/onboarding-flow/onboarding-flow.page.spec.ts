import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { AuthFacade } from '@platform/core/security/services/auth.facade';
import { OnboardingApiService } from '../../services/onboarding-api.service';
import { OnboardingFlowPage } from './onboarding-flow.page';

describe('OnboardingFlowPage', () => {
  let api: jasmine.SpyObj<OnboardingApiService>;
  let auth: jasmine.SpyObj<AuthFacade>;
  let router: jasmine.SpyObj<Router>;

  function createPage(): OnboardingFlowPage {
    const fixture = TestBed.createComponent(OnboardingFlowPage);
    return fixture.componentInstance;
  }

  beforeEach(() => {
    api = jasmine.createSpyObj<OnboardingApiService>('OnboardingApiService', [
      'getState',
      'saveState',
      'createTenant',
      'normalizePreset',
      'applyPreset',
    ]);
    api.getState.and.resolveTo({ currentStep: 0, answers: {}, tenantId: null, completed: false });
    api.saveState.and.resolveTo({ currentStep: 0, answers: {}, tenantId: null, completed: false });
    auth = jasmine.createSpyObj<AuthFacade>('AuthFacade', ['attachOnboardingTenant']);
    auth.attachOnboardingTenant.and.resolveTo();
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);

    TestBed.configureTestingModule({
      imports: [OnboardingFlowPage, TranslateModule.forRoot()],
      providers: [
        { provide: OnboardingApiService, useValue: api },
        { provide: AuthFacade, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('blocks step 0 without a company name', () => {
    const page = createPage();
    page.companyInput = '';
    expect(page.canAdvance()).toBeFalse();

    page.companyInput = 'Atlas Construction';
    expect(page.canAdvance()).toBeTrue();
  });

  it('accepts an empty ICE but rejects a partial one', () => {
    const page = createPage();
    page.companyInput = 'Atlas Construction';

    page.ice = '';
    expect(page.canAdvance()).toBeTrue();

    page.ice = '1234';
    expect(page.canAdvance()).toBeFalse();

    page.ice = '123456789012345';
    expect(page.canAdvance()).toBeTrue();
  });

  it('creates the tenant without ICE and advances to the profile questions', async () => {
    api.createTenant.and.resolveTo({
      tenantId: 't-1',
      tenantKey: 'atlas',
      tenantName: 'Atlas Construction',
    });
    const page = createPage();
    page.companyInput = 'Atlas Construction';

    await page.advance();

    expect(api.createTenant).toHaveBeenCalledWith({
      companyName: 'Atlas Construction',
      ice: undefined,
      legalForm: 'SARL',
    });
    expect(auth.attachOnboardingTenant).toHaveBeenCalled();
    expect(page.step()).toBe(1);
  });

  it('profile questions never block navigation', () => {
    const page = createPage();
    page.step.set(2);
    expect(page.canAdvance()).toBeTrue();
  });

  it('finishes with Sektor recommendations and shows the real prepared steps', async () => {
    api.normalizePreset.and.resolveTo({
      societe: { nom: 'Atlas Construction', ice: null, forme: 'SARL' },
      secteur: 'BATIMENT',
      taille: 'M',
      marches: 'MIXTE',
      compta: 'INTERNE',
    });
    api.applyPreset.and.resolveTo({
      tenantId: 't-1',
      applied: true,
      completedSteps: [
        'identity',
        'domains',
        'fiscal',
        'referenceData',
        'chartOfAccounts-skipped',
        'numbering',
        'articles',
        'meta',
      ],
      durationMs: 1200,
    });
    const page = createPage();
    page.tenantId.set('t-1');
    page.companyName.set('Atlas Construction');
    page.step.set(1);

    await page.finishWithRecommended();

    expect(api.normalizePreset).toHaveBeenCalled();
    expect(api.applyPreset).toHaveBeenCalledWith('t-1', jasmine.anything());
    expect(page.phase()).toBe('done');
    // « chartOfAccounts-skipped » compte comme préparé ; « meta » n'est pas affiché.
    expect(page.preparedSteps()).toEqual([
      'identity',
      'domains',
      'fiscal',
      'referenceData',
      'chartOfAccounts',
      'numbering',
      'articles',
    ]);
  });

  it('marks onboarding completed after the preset is applied', async () => {
    api.normalizePreset.and.resolveTo({
      societe: { nom: 'Atlas', ice: null, forme: 'SARL' },
      secteur: 'BATIMENT',
      taille: 'M',
      marches: 'MIXTE',
      compta: 'INTERNE',
    });
    api.applyPreset.and.resolveTo({
      tenantId: 't-1',
      applied: true,
      completedSteps: ['identity'],
      durationMs: 10,
    });
    const page = createPage();
    page.tenantId.set('t-1');
    page.companyName.set('Atlas');
    page.step.set(4);

    await page.advance();

    const lastSave = api.saveState.calls.mostRecent().args[0];
    expect(lastSave.currentStep).toBe(5);
  });
});
