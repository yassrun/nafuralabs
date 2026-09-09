// Shared platform sources must resolve Angular to the application's runtime.
const assert = require('node:assert/strict');
const path = require('node:path');
const esbuild = require('esbuild');
const root = path.resolve(__dirname, '..');

esbuild.build({
  absWorkingDir: root,
  stdin: {
    contents: `
      import { HttpClient } from '@angular/common/http';
      import { toSignal } from '@angular/core/rxjs-interop';
      import { MatMenuModule } from '@angular/material/menu';
      import { Overlay } from '@angular/cdk/overlay';
      import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
      import { LucideAngularModule } from 'lucide-angular';
      import { BaseChartDirective } from 'ng2-charts';
      console.log(HttpClient, toSignal, MatMenuModule, Overlay, provideAnimationsAsync, LucideAngularModule, BaseChartDirective);
    `,
    resolveDir: path.resolve(root, '../../../nafura-platform/sources/web'),
  },
  bundle: true,
  write: false,
  platform: 'browser',
  metafile: true,
  tsconfig: path.join(root, 'tsconfig.json'),
}).then(result => {
  const inputs = Object.keys(result.metafile.inputs);
  const angular = inputs.filter(file => file.includes('/@angular/'));
  assert(angular.length > 0);
  assert(angular.every(file => !file.includes('nafura-platform')), 'Shared sources pulled in a second Angular runtime');
  assert.equal(inputs.filter(file => file.endsWith('/@angular/core/fesm2022/core.mjs')).length, 1);
  console.log('Angular runtime: one application copy for shared HTTP, signals, Material, CDK, animations, icons and charts.');
}).catch(error => { console.error(error); process.exitCode = 1; });
