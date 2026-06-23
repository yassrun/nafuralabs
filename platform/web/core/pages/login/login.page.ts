/**
 * Login Page
 *
 * - Production : redirection automatique vers Keycloak (MFA géré côté IdP).
 * - Dev (`devAuthBypass`) : formulaire mot de passe + OTP mock si `devAuthEagerBootstrap === false` ;
 *   sinon session déjà amorcée par `AuthFacade.initialize` (comportement historique).
 */

import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LookupReferenceNavigationService } from '@lib/anatomy/services/lookup-reference-navigation.service';

import { environment } from '@env';
import { AuthFacade } from '../../security/services/auth.facade';
import { APPLICATION_DEFAULT_ROUTE } from '../../../../applications/routes.generated';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-content">
        <div class="logo">
          <span class="logo-icon">N</span>
          <span class="logo-text">Nafura</span>
        </div>

        @if (useDevWizard()) {
          @if (devStep() === 1) {
            <p class="message">Connexion démo — mot de passe</p>
            <input
              class="field"
              type="password"
              autocomplete="current-password"
              [(ngModel)]="devPassword"
              placeholder="Mot de passe"
              (keyup.enter)="devNext()" />
            <p class="hint">Valeur attendue : <code>{{ devPassHint }}</code> (voir <code>environment.devInAppAuth</code>)</p>
            <button type="button" class="primary-button" (click)="devNext()">Continuer</button>
          } @else {
            <p class="message">Deuxième facteur (démo)</p>
            <input
              class="field"
              type="text"
              inputmode="numeric"
              maxlength="8"
              [(ngModel)]="devTotp"
              placeholder="Code à 6 chiffres"
              (keyup.enter)="devSubmit()" />
            <p class="hint">OTP simulé : <code>{{ devTotpHint }}</code> — en production, Keycloak exige TOTP/WebAuthn/e-mail selon politique IAM.</p>
            <div class="row">
              <button type="button" class="secondary-button" (click)="devStep.set(1)">Retour</button>
              <button type="button" class="primary-button" (click)="devSubmit()">Valider et ouvrir la session</button>
            </div>
          }
          @if (devError()) {
            <p class="error">{{ devError() }}</p>
          }
        } @else {
          <p class="message">{{ message }}</p>
          <p class="submessage">{{ submessage }}</p>
          <button type="button" class="primary-button" (click)="signIn()">
            Continuer vers la connexion sécurisée (SSO)
          </button>
          @if (showRetry) {
            <button type="button" class="retry-button" (click)="signIn()">
              Réessayer
            </button>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #0f766e 0%, #134e4a 100%);
      padding: 1.5rem;
    }
    .login-content {
      width: 100%;
      max-width: 400px;
      text-align: center;
      background: rgba(255,255,255,0.96);
      border-radius: 16px;
      padding: 2rem 1.75rem;
      box-shadow: 0 20px 50px rgba(0,0,0,0.18);
    }
    .logo { margin-bottom: 1.5rem; }
    .logo-icon {
      display: inline-flex;
      justify-content: center;
      align-items: center;
      width: 56px;
      height: 56px;
      background: #0d9488;
      color: white;
      font-size: 26px;
      font-weight: 800;
      border-radius: 14px;
      margin-bottom: 10px;
    }
    .logo-text {
      display: block;
      color: #0f172a;
      font-size: 1.35rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .message {
      color: #334155;
      font-size: 15px;
      margin: 0 0 0.75rem;
      font-weight: 600;
    }
    .submessage {
      color: #64748b;
      font-size: 13px;
      line-height: 1.45;
      margin: 0 0 1.25rem;
      text-align: left;
    }
    .field {
      width: 100%;
      box-sizing: border-box;
      padding: 10px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 14px;
      margin-bottom: 0.75rem;
    }
    .hint {
      font-size: 12px;
      color: #64748b;
      text-align: left;
      margin: 0 0 1rem;
      line-height: 1.4;
    }
    .hint code { font-size: 11px; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
    .row { display: flex; gap: 10px; justify-content: center; margin-top: 0.5rem; flex-wrap: wrap; }
    .primary-button {
      width: 100%;
      margin-top: 4px;
      background: #0d9488;
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
    .primary-button:hover { background: #0f766e; }
    .secondary-button {
      flex: 1;
      min-width: 100px;
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #e2e8f0;
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .error { color: #b91c1c; font-size: 13px; margin-top: 0.75rem; }
    .retry-button {
      margin-top: 12px;
      width: 100%;
      background: white;
      color: #0d9488;
      border: 1px solid #0d9488;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
  `]
})
export class LoginPage implements OnInit {
  private readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly lookupRefNav = inject(LookupReferenceNavigationService);

  message = 'Authentification unique (SSO)';
  submessage =
    'La vraie authentification multi-facteurs est appliquée par Keycloak (OTP application, e-mail ou WebAuthn selon la politique du realm). Cliquez pour ouvrir la page de connexion hébergée.';
  showRetry = false;

  readonly useDevWizard = signal(false);
  readonly devStep = signal<1 | 2>(1);
  readonly devError = signal<string | null>(null);

  devPassword = '';
  devTotp = '';

  readonly devPassHint = (environment as { devInAppAuth?: { password: string } }).devInAppAuth?.password ?? 'demo';
  readonly devTotpHint = (environment as { devInAppAuth?: { totp: string } }).devInAppAuth?.totp ?? '123456';

  private async navigateToApplicationShell(): Promise<void> {
    const defaultRoute = APPLICATION_DEFAULT_ROUTE || 'feature-unavailable/unknown';
    const segments = defaultRoute.split('/').filter(Boolean);
    await this.router.navigate(['/', ...segments]);
  }

  ngOnInit(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrl?.startsWith('/')) {
      this.lookupRefNav.rememberPostAuthRedirect(returnUrl);
    }

    if (this.auth.isAuthenticated()) {
      void this.navigateToApplicationShell();
      return;
    }

    const devBypass = environment.devAuthBypass;
    const eager = (environment as { devAuthEagerBootstrap?: boolean }).devAuthEagerBootstrap !== false;

    if (devBypass && eager) {
      void this.auth.login();
      return;
    }

    if (devBypass && !eager) {
      this.useDevWizard.set(true);
      return;
    }

    this.useDevWizard.set(false);
    void this.auth.login();
  }

  signIn(): void {
    this.showRetry = false;
    void this.auth.login();
  }

  devNext(): void {
    this.devError.set(null);
    if (!this.devPassword.trim()) {
      this.devError.set('Saisissez le mot de passe démo.');
      return;
    }
    const ref = (environment as { devInAppAuth?: { password: string } }).devInAppAuth;
    const exp = ref?.password ?? 'demo';
    if (this.devPassword !== exp) {
      this.devError.set('Mot de passe incorrect.');
      return;
    }
    this.devStep.set(2);
  }

  async devSubmit(): Promise<void> {
    this.devError.set(null);
    const ref = (environment as { devInAppAuth?: { totp: string } }).devInAppAuth;
    const exp = ref?.totp ?? '123456';
    if (this.devTotp.trim() !== exp) {
      this.devError.set('Code OTP incorrect.');
      return;
    }
    const res = await this.auth.completeDevInAppAuth(this.devPassword, this.devTotp.trim());
    if (res === 'bad_password' || res === 'bad_totp') {
      this.devError.set('Identifiants invalides.');
      return;
    }
    if (res === 'disabled') {
      this.devError.set('Connexion démo indisponible.');
      return;
    }
    await this.navigateToApplicationShell();
  }
}
