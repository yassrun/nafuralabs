/** Mode B + Cursor QA — front local, back local, skip Keycloak (HS256 cursor session). */
export const environment = {
  production: false,
  publicWebOrigin: 'http://127.0.0.1:4200',
  apiBaseUrl: 'http://localhost:8082',
  keycloakUrl: 'http://iam.nafuralabs.staging',
  keycloakRealm: 'iam-portal',
  keycloakClientId: 'erp-web',
  onboardingV2Enabled: true,
  directKeycloakLogin: false,
  /** Auto POST /api/public/dev/cursor-session on boot (requires NAFURA_DEV_CURSOR_AUTH_ENABLED). */
  cursorAuthAutoLogin: true,
  devAuthBypass: false,
  devAuthEagerBootstrap: false,
  devInAppAuth: {
    password: '',
    totp: '',
  },
  devAuthUser: {
    id: '',
    email: '',
    firstName: '',
    lastName: '',
    tenantId: '',
    tenantName: '',
    tenantSlug: '',
  },
};
