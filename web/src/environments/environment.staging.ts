/** Staging cluster — sektor.nafuralabs.staging (HTTP only; IAM is HTTP too). */
export const environment = {
  production: true,
  /** Pin OAuth redirect URIs to HTTP even if the browser cached HSTS for HTTPS. */
  publicWebOrigin: 'http://sektor.nafuralabs.staging',
  apiBaseUrl: 'http://api.sektor.nafuralabs.staging',
  keycloakUrl: 'http://iam.nafuralabs.staging',
  keycloakRealm: 'iam-portal',
  keycloakClientId: 'erp-web',
  onboardingV2Enabled: true,
  /** Skip in-app /login splash; guards redirect straight to Keycloak. */
  directKeycloakLogin: true,
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
