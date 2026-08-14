/** Mode B — front local + backend local (8085), IAM staging. */
export const environment = {
  production: false,
  publicWebOrigin: 'http://127.0.0.1:4210',
  /** Empty = same-origin / proxy during ng serve */
  apiBaseUrl: '',
  keycloakUrl: 'http://iam.nafuralabs.staging',
  keycloakRealm: 'iam-portal',
  keycloakClientId: 'venue-catalog-web',
  directKeycloakLogin: true,
  useDevJwt: true,
  devJwtSecret: 'venue-catalog-local-jwt-secret-32-chars-min',
};
