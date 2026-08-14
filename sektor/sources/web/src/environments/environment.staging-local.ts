/** Mode B — front local (ng serve) + back local, infra staging (IAM / données). */
export const environment = {
  production: false,
  publicWebOrigin: 'http://localhost:4200',
  apiBaseUrl: 'http://localhost:8082',
  keycloakUrl: 'http://iam.nafuralabs.staging',
  keycloakRealm: 'iam-portal',
  keycloakClientId: 'erp-web',
  onboardingV2Enabled: true,
  directKeycloakLogin: true,
  cursorAuthAutoLogin: false,
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
