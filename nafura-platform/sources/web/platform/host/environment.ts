// Every product web app resolves `@env` here (tsconfig.product.json): host apps sign in as their backend says
// (/api/public/auth/config), the legacy platform code still reads these keys. Names come from app.nafura.json.
export const environment = {
  production: false,
  appName: '',
  apiBaseUrl: '/api',
  keycloakUrl: '',
  keycloakRealm: '',
  keycloakClientId: '',
  devAuthBypass: true,
  devAuthEagerBootstrap: false,
  onboardingV2Enabled: false,
  directKeycloakLogin: false,
  cursorAuthAutoLogin: false,
  devAuthUser: {
    id: 'lab',
    email: 'admin@lab.local',
    firstName: 'Lab',
    lastName: 'Admin',
    tenantId: 'lab',
    tenantName: 'Lab',
    tenantSlug: 'lab',
  },
};
