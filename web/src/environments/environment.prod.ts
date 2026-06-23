export const environment = {
  production: true,
  apiBaseUrl: 'https://api.sektor.nafuralabs.com',
  keycloakUrl: 'https://iam.nafuralabs.com',
  keycloakRealm: 'iam-portal',
  keycloakClientId: 'erp-web',

  onboardingV2Enabled: true,

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
