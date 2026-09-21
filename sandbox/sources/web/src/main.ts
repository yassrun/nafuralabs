import { bootstrapApplication } from '@angular/platform-browser';

import { SandboxShellComponent } from './app/sandbox-shell.component';
import { appConfig } from './app/app.config';

bootstrapApplication(SandboxShellComponent, appConfig).catch((err) => console.error(err));
