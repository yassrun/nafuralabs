export {
  ApplicationContextService,
} from './application-context.service';
export { APPLICATION_KEY } from './application-context.token';
export type { ApplicationKey } from './application-key';
export {
  applicationCanMatch,
  applicationDefaultRedirectGuard,
  applicationFeatureCanMatch,
} from './application-route.guards';
export * from './product-shell.tokens';
export { registerApplicationConfig } from './application-config';
