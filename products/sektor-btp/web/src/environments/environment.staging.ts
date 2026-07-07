/** Staging cluster — sektor.nafuralabs.staging */
export const environment = {
  production: true,
  apiBaseUrl: 'http://api.sektor.nafuralabs.staging',
  keycloakUrl: 'http://iam.nafuralabs.staging',
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
