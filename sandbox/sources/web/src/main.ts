import { bootstrapApplication } from '@angular/platform-browser';

import { SandboxRootComponent } from './app/sandbox-root.component';
import { appConfig } from './app/app.config';

bootstrapApplication(SandboxRootComponent, appConfig).catch((err) => console.error(err));
