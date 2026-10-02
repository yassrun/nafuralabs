import { bootstrapApplication } from '@angular/platform-browser';
import { NafuraHostRootComponent, provideNafuraHost } from '@platform/platform/host';

import app from '../../../app.nafura.json';
import { demoBusinessContext } from '../../../bcs/demo/web';

bootstrapApplication(NafuraHostRootComponent, { providers: [provideNafuraHost(app, [demoBusinessContext])] }).catch((err) =>
  console.error(err),
);
