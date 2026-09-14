import type {
  ResolvedStatusAction,
  StatusAccessFn,
  StatusActionBarConfig,
  StatusActionContext,
} from '../types';
import type { ButtonVariant } from '../components/atoms/button';

const VARIANT_ORDER: Record<string, number> = {
  ghost: 0,
  tertiary: 1,
  stroked: 2,
  secondary: 3,
  danger: 4,
  primary: 5,
};

export function hasRoles(...roles: string[]): StatusAccessFn<StatusActionContext> {
  const expected = roles.map((role) => role.toUpperCase());
  return (ctx) => {
    const current = (ctx.roles ?? []).map((role) => role.toUpperCase());
    return expected.some((role) => current.includes(role));
  };
}

export function and<T>(...fns: Array<StatusAccessFn<T>>): StatusAccessFn<T> {
  return (ctx) => fns.every((fn) => fn(ctx));
}

export function or<T>(...fns: Array<StatusAccessFn<T>>): StatusAccessFn<T> {
  return (ctx) => fns.some((fn) => fn(ctx));
}

function matchesFrom(from: string | string[], status: string): boolean {
  return Array.isArray(from) ? from.includes(status) : from === status;
}

function allowed(fn: StatusAccessFn<unknown> | undefined, ctx: unknown, fallback: boolean): boolean {
  if (!fn) return fallback;
  return fn(ctx);
}

/**
 * Filters the matrix + commands for the current status and access rules.
 * Ghost / secondary first, primary last (rightmost).
 */
export function resolveStatusActions<TStatus extends string, TCtx extends { status: string }>(
  config: StatusActionBarConfig<TStatus, TCtx>,
  ctx: TCtx,
): ResolvedStatusAction[] {
  const status = ctx.status;
  const out: ResolvedStatusAction[] = [];

  for (const transition of config.transitions) {
    if (!matchesFrom(transition.from, status)) continue;
    if (!allowed(transition.isVisible as StatusAccessFn<unknown> | undefined, ctx, true)) continue;
    if (!allowed(transition.hasAccess as StatusAccessFn<unknown>, ctx, false)) continue;
    out.push({
      action: transition.action,
      actionLabel: transition.actionLabel,
      variant: (transition.variant ?? 'secondary') as ButtonVariant,
      kind: 'transition',
      to: transition.to,
      disabled: false,
      testId: transition.testId,
    });
  }

  for (const command of config.commands ?? []) {
    if (!allowed(command.isVisible as StatusAccessFn<unknown> | undefined, ctx, true)) continue;
    if (!allowed(command.hasAccess as StatusAccessFn<unknown> | undefined, ctx, true)) continue;
    out.push({
      action: command.action,
      actionLabel: command.actionLabel,
      variant: (command.variant ?? 'ghost') as ButtonVariant,
      kind: 'command',
      disabled: allowed(command.disabled as StatusAccessFn<unknown> | undefined, ctx, false),
      testId: command.testId,
    });
  }

  return out.sort((a, b) => (VARIANT_ORDER[a.variant] ?? 3) - (VARIANT_ORDER[b.variant] ?? 3));
}

export function resolveStatusDef<TStatus extends string, TCtx>(
  config: StatusActionBarConfig<TStatus, TCtx>,
  status: string,
): { label: string; variant: import('../types').BadgeVariant } | null {
  const def = (config.statuses as Record<string, { label: string; variant: import('../types').BadgeVariant }>)[status];
  return def ?? (status ? { label: status, variant: 'default' } : null);
}
