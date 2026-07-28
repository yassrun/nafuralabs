import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { AuthFacade } from '@core/security/services/auth.facade';
import { SignupPage } from './signup.page';

describe('SignupPage', () => {
  let auth: jasmine.SpyObj<AuthFacade>;
  let router: jasmine.SpyObj<Router>;

  function createPage(): SignupPage {
    const fixture = TestBed.createComponent(SignupPage);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthFacade>('AuthFacade', ['register', 'loginWithReturnUrl']);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl', 'navigate']);

    TestBed.configureTestingModule({
      imports: [SignupPage, TranslateModule.forRoot()],
      providers: [
        { provide: AuthFacade, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('keeps the submit CTA disabled when the form is empty', () => {
    const page = createPage();
    expect(page.canSubmit()).toBeFalse();
  });

  it('rejects an invalid email and keeps CTA disabled', () => {
    const page = createPage();
    page.form.setValue({
      email: 'TESTONBOARDING',
      password: 'Password1',
      firstName: 'Yassine',
      lastName: 'Karkafi',
      locale: 'fr',
    });
    expect(page.form.controls.email.invalid).toBeTrue();
    expect(page.canSubmit()).toBeFalse();
  });

  it('rejects a password that does not meet the policy', () => {
    const page = createPage();
    page.form.setValue({
      email: 'yassine@atlas.ma',
      password: 'short1',
      firstName: 'Yassine',
      lastName: 'Karkafi',
      locale: 'fr',
    });
    expect(page.form.controls.password.invalid).toBeTrue();
    expect(page.canSubmit()).toBeFalse();
  });

  it('enables submit when all fields are valid', () => {
    const page = createPage();
    page.form.setValue({
      email: 'yassine@atlas.ma',
      password: 'Password1',
      firstName: 'Yassine',
      lastName: 'Karkafi',
      locale: 'fr',
    });
    expect(page.canSubmit()).toBeTrue();
  });

  it('does not call register when the form is invalid', async () => {
    const page = createPage();
    page.form.patchValue({ email: 'bad', password: 'x' });
    await page.submit();
    expect(auth.register).not.toHaveBeenCalled();
    expect(page.form.controls.email.touched).toBeTrue();
  });

  it('registers when the form is valid', async () => {
    auth.register.and.resolveTo({
      success: true,
      message: 'ok',
      emailVerificationRequired: true,
    });
    const page = createPage();
    page.form.setValue({
      email: 'yassine@atlas.ma',
      password: 'Password1',
      firstName: 'Yassine',
      lastName: 'Karkafi',
      locale: 'fr',
    });

    await page.submit();

    expect(auth.register).toHaveBeenCalledWith({
      email: 'yassine@atlas.ma',
      password: 'Password1',
      firstName: 'Yassine',
      lastName: 'Karkafi',
      preferredLocale: 'fr',
    });
    expect(router.navigate).toHaveBeenCalled();
  });
});
