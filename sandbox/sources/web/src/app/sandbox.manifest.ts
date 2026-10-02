import type { NafuraManifest } from '@platform/platform/manifest';

export const SANDBOX_MANIFEST: NafuraManifest = {
  apiVersion: 'nafura.io/v1',
  kind: 'application',
  metadata: {
    id: 'app.anatomy-sandbox',
    version: '0.0.1',
    owner: 'nafuralabs',
    lifecycle: 'experimental',
  },
  spec: {
    i18n: { namespace: 'app.anatomy-sandbox', locales: ['fr'] },
  },
};