export const environment = {
  production: false,
  apiBaseUrl: 'http://api.nafura.local',
  keycloakUrl: 'http://iam.nafura.local',
  keycloakRealm: 'iam-portal',
  keycloakClientId: 'nafura-frontend',

  // Dev-only: bypass Keycloak and auto-login with a fake super-admin user.
  // MUST stay false in production environments (environment.prod.ts, etc.).
  devAuthBypass: false,
  /**
   * Si true (défaut) : premier chargement restaure une session dev ou appelle le bypass sans passer par /login.
   * Si false : session dev uniquement après le parcours login in-app (mot de passe + OTP mock).
   */
  devAuthEagerBootstrap: true,
  /** Identifiants du formulaire login démo (uniquement si devAuthBypass). */
  devInAppAuth: {
    password: 'demo',
    totp: '123456',
  },
  /** Feature flag: agentic onboarding v2 (/signup, /onboarding). */
  onboardingV2Enabled: true,

  devAuthUser: {
    id: 'dev-user',
    email: 'dev@nafura.local',
    firstName: 'Dev',
    lastName: 'User',
    tenantId: 'dev-tenant',
    tenantName: 'Dev Tenant',
    tenantSlug: 'dev',
  },
};
