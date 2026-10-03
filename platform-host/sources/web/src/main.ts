import { bootstrapApplication } from '@angular/platform-browser';
import { NafuraHostRootComponent, provideNafuraHost } from '@platform/platform/host';

import app from '../../../app.nafura.json';
import { businessContexts } from './business-contexts.generated';

bootstrapApplication(NafuraHostRootComponent, { providers: [provideNafuraHost(app, businessContexts)] }).catch((err) =>
  console.error(err),
);
