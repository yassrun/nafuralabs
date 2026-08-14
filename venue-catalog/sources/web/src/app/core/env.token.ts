import { InjectionToken } from '@angular/core';

export interface AppEnvironment {
  production: boolean;
  publicWebOrigin: string;
  apiBaseUrl: string;
  keycloakUrl: string;
  keycloakRealm: string;
  keycloakClientId: string;
  directKeycloakLogin: boolean;
  useDevJwt: boolean;
  devJwtSecret: string;
}

export const APP_ENV = new InjectionToken<AppEnvironment>('APP_ENV');
