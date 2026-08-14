export const environment = {
  production: false,
  publicWebOrigin: 'http://127.0.0.1:4210',
  apiBaseUrl: '',
  keycloakUrl: 'http://iam.nafuralabs.staging',
  keycloakRealm: 'iam-portal',
  keycloakClientId: 'venue-catalog-web',
  directKeycloakLogin: true,
  /** Local Mode B / smoke: HS256 JWT accepted by venue-catalog.dev-jwt */
  useDevJwt: true,
  devJwtSecret: 'venue-catalog-local-jwt-secret-32-chars-min',
};
