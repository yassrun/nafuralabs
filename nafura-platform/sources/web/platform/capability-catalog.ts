import type { NafuraManifest } from './manifest';

const platformCapability = (id: string, route: string): NafuraManifest => ({
  apiVersion: 'nafura.io/v1',
  kind: 'capability',
  metadata: {
    id,
    version: '0.1.0',
    owner: 'nafura-platform',
    lifecycle: 'experimental',
    labels: { webRoute: route },
  },
  spec: { provides: [{ id, version: '0.1.0' }] },
});

export const PLATFORM_CAPABILITY_MANIFESTS: NafuraManifest[] = [
  platformCapability('cap.approvals', 'approvals'),
  platformCapability('cap.administration', 'administration'),
  platformCapability('cap.user-settings', 'user-settings'),
  platformCapability('cap.app-settings', 'organization/settings'),
  platformCapability('cap.organization-identity', 'organization/identity'),
  platformCapability('cap.notifications', 'notifications'),
];