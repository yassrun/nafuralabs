import type { BusinessContextManifest, BusinessContextNavigationItem, NafuraManifest } from './manifest';

export type ManifestValidationIssueCode =
  | 'duplicate-manifest-id'
  | 'duplicate-capability-provider'
  | 'missing-required-capability'
  | 'incompatible-capability-version'
  | 'dependency-cycle'
  | 'unknown-business-context'
  | 'route-prefix-collision'
  | 'permission-outside-namespace'
  | 'notification-outside-namespace'
  | 'notification-without-channel'
  | 'notification-duplicate'
  | 'role-unknown-permission'
  | 'navigation-outside-prefix'
  | 'navigation-unknown-permission'
  | 'navigation-invalid-node'
  | 'role-unknown-reference'
  | 'duplicate-role-code';

export interface ManifestValidationIssue {
  code: ManifestValidationIssueCode;
  message: string;
}

type Version = [major: number, minor: number, patch: number];

function parseVersion(value: string, allowCaret = false): Version | null {
  const match = value.match(allowCaret ? /^\^(\d+)\.(\d+)\.(\d+)$/ : /^(\d+)\.(\d+)\.(\d+)$/);
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
}

function compareVersions(left: Version, right: Version): number {
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return 0;
}

function satisfiesCaretVersion(actualValue: string, rangeValue: string): boolean {
  const actual = parseVersion(actualValue);
  const range = parseVersion(rangeValue, true);
  if (!actual || !range || compareVersions(actual, range) < 0) return false;

  if (range[0] > 0) return actual[0] === range[0];
  if (range[1] > 0) return actual[0] === 0 && actual[1] === range[1];
  return actual[0] === 0 && actual[1] === 0 && actual[2] === range[2];
}

function normalizeRoute(route: string): string {
  return route.length > 1 ? route.replace(/\/+$/, '') : route;
}

function isUnderPrefix(route: string, prefix: string): boolean {
  const normalized = normalizeRoute(route);
  return normalized === prefix || normalized.startsWith(prefix + '/');
}

/** `bc.achats` owns permissions `achats.*`. */
export function businessContextPermissionNamespace(id: string): string {
  return id.slice(id.indexOf('.') + 1) + '.';
}

function validateBusinessContexts(
  manifests: readonly NafuraManifest[],
  issues: ManifestValidationIssue[],
): void {
  const contexts = manifests.filter(
    (manifest): manifest is BusinessContextManifest => manifest.kind === 'business-context',
  );
  const contextIds = new Set(contexts.map((context) => context.metadata.id));

  for (const manifest of manifests) {
    if (manifest.kind !== 'application') continue;
    for (const reference of manifest.spec.businessContexts ?? []) {
      if (!contextIds.has(reference)) {
        issues.push({
          code: 'unknown-business-context',
          message: `Application "${manifest.metadata.id}" references unknown business context "${reference}".`,
        });
      }
    }
  }

  const prefixed = contexts.filter((context) => context.spec.routesPrefix);
  prefixed.forEach((left, leftIndex) => {
    for (const right of prefixed.slice(leftIndex + 1)) {
      const leftPrefix = normalizeRoute(left.spec.routesPrefix!);
      const rightPrefix = normalizeRoute(right.spec.routesPrefix!);
      if (isUnderPrefix(leftPrefix, rightPrefix) || isUnderPrefix(rightPrefix, leftPrefix)) {
        issues.push({
          code: 'route-prefix-collision',
          message:
            `Business contexts "${left.metadata.id}" (${leftPrefix}) and ` +
            `"${right.metadata.id}" (${rightPrefix}) share a route prefix.`,
        });
      }
    }
  });

  for (const context of contexts) {
    const id = context.metadata.id;
    const namespace = businessContextPermissionNamespace(id);
    const declared = new Set((context.spec.permissions ?? []).map((permission) => permission.id));

    for (const permission of declared) {
      if (!permission.startsWith(namespace)) {
        issues.push({
          code: 'permission-outside-namespace',
          message: `Business context "${id}" declares "${permission}" outside "${namespace}".`,
        });
      }
    }

    const events = new Set<string>();
    for (const notification of context.spec.notifications ?? []) {
      if (!notification.id.startsWith(namespace)) {
        issues.push({
          code: 'notification-outside-namespace',
          message: `Business context "${id}" declares notification "${notification.id}" outside "${namespace}".`,
        });
      }
      if (notification.channels.length === 0) {
        issues.push({
          code: 'notification-without-channel',
          message: `Notification "${notification.id}" of "${id}" has no channel.`,
        });
      }
      if (events.has(notification.id)) {
        issues.push({
          code: 'notification-duplicate',
          message: `Business context "${id}" declares notification "${notification.id}" twice.`,
        });
      }
      events.add(notification.id);
    }

    for (const role of context.spec.defaultRoles ?? []) {
      for (const permission of role.permissions) {
        if (!declared.has(permission)) {
          issues.push({
            code: 'role-unknown-permission',
            message: `Role "${role.code}" of "${id}" grants undeclared permission "${permission}".`,
          });
        }
      }
    }

    const prefix = context.spec.routesPrefix ? normalizeRoute(context.spec.routesPrefix) : null;
    const visit = (item: BusinessContextNavigationItem): void => {
      if (item.route !== undefined && (!prefix || !isUnderPrefix(item.route, prefix))) {
        issues.push({
          code: 'navigation-outside-prefix',
          message: `Navigation "${item.id}" of "${id}" routes to "${item.route}" outside ${prefix ?? 'any prefix'}.`,
        });
      }
      if (item.permission !== undefined && !declared.has(item.permission)) {
        issues.push({
          code: 'navigation-unknown-permission',
          message: `Navigation "${item.id}" of "${id}" requires undeclared permission "${item.permission}".`,
        });
      }
      if ((item.route === undefined) === !item.children?.length) {
        issues.push({
          code: 'navigation-invalid-node',
          message: `Navigation "${item.id}" of "${id}" must have either a route or children.`,
        });
      }
      item.children?.forEach(visit);
    };
    (context.spec.navigation ?? []).forEach(visit);
  }

  validateRoles(manifests, contexts, issues);
}

/** Application roles only compose roles and permissions of the business contexts it embeds. */
function validateRoles(
  manifests: readonly NafuraManifest[],
  contexts: readonly BusinessContextManifest[],
  issues: ManifestValidationIssue[],
): void {
  const byId = new Map(contexts.map((context) => [context.metadata.id, context]));

  for (const manifest of manifests) {
    if (manifest.kind !== 'application') continue;
    const appId = manifest.metadata.id;
    const embedded = (manifest.spec.businessContexts ?? []).map((id) => byId.get(id)).filter((c) => c !== undefined);
    const permissions = new Set(embedded.flatMap((c) => (c.spec.permissions ?? []).map((p) => p.id)));
    const bcRoles = new Set(embedded.flatMap((c) => (c.spec.defaultRoles ?? []).map((r) => `${c.metadata.id}:${r.code}`)));

    const codes = new Map<string, string>();
    const claim = (code: string, owner: string) => {
      const previous = codes.get(code);
      if (previous) {
        issues.push({
          code: 'duplicate-role-code',
          message: `Role code "${code}" is declared by both ${previous} and ${owner}.`,
        });
      } else {
        codes.set(code, owner);
      }
    };
    embedded.forEach((c) => (c.spec.defaultRoles ?? []).forEach((r) => claim(r.code, `"${c.metadata.id}"`)));

    for (const role of manifest.spec.roles ?? []) {
      claim(role.code, `application "${appId}"`);
      for (const reference of role.includes ?? []) {
        if (!bcRoles.has(reference)) {
          issues.push({
            code: 'role-unknown-reference',
            message: `Role "${role.code}" of "${appId}" includes "${reference}", not a role of an embedded business context.`,
          });
        }
      }
      for (const permission of role.permissions ?? []) {
        if (!permissions.has(permission)) {
          issues.push({
            code: 'role-unknown-permission',
            message: `Role "${role.code}" of "${appId}" grants "${permission}", declared by no embedded business context.`,
          });
        }
      }
    }
  }
}

export function validateNafuraManifests(
  manifests: readonly NafuraManifest[],
): ManifestValidationIssue[] {
  const issues: ManifestValidationIssue[] = [];
  const manifestsById = new Map<string, number[]>();
  const providersByCapability = new Map<string, number[]>();
  const dependencies = manifests.map(() => new Set<number>());

  manifests.forEach((manifest, index) => {
    const manifestIndexes = manifestsById.get(manifest.metadata.id) ?? [];
    manifestIndexes.push(index);
    manifestsById.set(manifest.metadata.id, manifestIndexes);

    for (const capability of manifest.spec.provides ?? []) {
      const providerIndexes = providersByCapability.get(capability.id) ?? [];
      providerIndexes.push(index);
      providersByCapability.set(capability.id, providerIndexes);
    }
  });

  for (const [id, indexes] of manifestsById) {
    if (indexes.length > 1) {
      issues.push({
        code: 'duplicate-manifest-id',
        message: `Manifest id "${id}" is declared more than once.`,
      });
    }
  }

  for (const [capabilityId, indexes] of providersByCapability) {
    if (indexes.length > 1) {
      const owners = indexes.map((index) => manifests[index].metadata.id).join(', ');
      issues.push({
        code: 'duplicate-capability-provider',
        message: `Capability "${capabilityId}" has multiple providers: ${owners}.`,
      });
    }
  }

  manifests.forEach((manifest, consumerIndex) => {
    for (const requirement of manifest.spec.requires ?? []) {
      const providers = providersByCapability.get(requirement.id) ?? [];
      if (providers.length === 0) {
        if (!requirement.optional) {
          issues.push({
            code: 'missing-required-capability',
            message: `Manifest "${manifest.metadata.id}" requires missing capability "${requirement.id}".`,
          });
        }
        continue;
      }

      const providerIndex = providers[0];
      dependencies[consumerIndex].add(providerIndex);
      const provider = manifests[providerIndex];
      const capability = provider.spec.provides?.find((item) => item.id === requirement.id);
      if (capability && !satisfiesCaretVersion(capability.version, requirement.version)) {
        issues.push({
          code: 'incompatible-capability-version',
          message:
            `Manifest "${manifest.metadata.id}" requires "${requirement.id}" ${requirement.version}, ` +
            `but "${provider.metadata.id}" provides ${capability.version}.`,
        });
      }
    }
  });

  const visited = new Set<number>();
  const activePath: number[] = [];
  const activeIndexes = new Map<number, number>();
  const reportedCycles = new Set<string>();

  const visit = (index: number): void => {
    const activeIndex = activeIndexes.get(index);
    if (activeIndex !== undefined) {
      const cycle = activePath.slice(activeIndex);
      const cycleKey = [...cycle].sort((left, right) => left - right).join(',');
      if (!reportedCycles.has(cycleKey)) {
        reportedCycles.add(cycleKey);
        const path = [...cycle, index].map((item) => manifests[item].metadata.id).join(' -> ');
        issues.push({ code: 'dependency-cycle', message: `Manifest dependency cycle: ${path}.` });
      }
      return;
    }
    if (visited.has(index)) return;

    activeIndexes.set(index, activePath.length);
    activePath.push(index);
    for (const dependencyIndex of dependencies[index]) visit(dependencyIndex);
    activePath.pop();
    activeIndexes.delete(index);
    visited.add(index);
  };

  manifests.forEach((_, index) => visit(index));
  validateBusinessContexts(manifests, issues);
  return issues;
}

export function assertNafuraManifestsValid(manifests: readonly NafuraManifest[]): void {
  const issues = validateNafuraManifests(manifests);
  if (issues.length > 0) {
    throw new Error(issues.map((issue) => issue.message).join('\n'));
  }
}