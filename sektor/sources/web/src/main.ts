/**
 * Application Entry Point
 * 
 * Bootstrap the Angular application with standalone components.
 */

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from '../app/socle/app.component';
import { appConfig } from '../app/socle/app.config';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
