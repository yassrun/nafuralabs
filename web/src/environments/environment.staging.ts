/** Staging (local K8s overlay or staging.sektor.nafuralabs.com). */
export const environment = {
  production: true,
  apiBaseUrl: 'http://api.staging.sektor.nafuralabs.com',
  keycloakUrl: 'http://iam.nafura.local',
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
