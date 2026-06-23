import {
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { BadgeComponent } from '../../atoms/badge';
import { ButtonComponent } from '../../atoms/button';
import { StatusTransitionDialogService } from '../../services/status-transition-dialog.service';
import type { ButtonVariant } from '../../atoms/button';
import type { BadgeVariant, StatusMachineConfig, StatusTransitionEvent } from '../../../types';
import { PermissionService } from '../../../../../core/security/services/permission.service';

/**
 * Status Machine Component
 *
 * Renders the current status as a badge and shows available transition
 * action buttons based on the state machine configuration.
 *
 * Status changes are emitted as `transitionRequest` events — never
 * executed inline. The parent component handles the actual API call.
 *
 * @example
 * <nf-status-machine
 *   [config]="config.statusMachine"
 *   [item]="item()"
 *   (transitionRequest)="onTransition($event)">
 * </nf-status-machine>
 */
@Component({
  selector: 'nf-status-machine',
  standalone: true,
  imports: [CommonModule, BadgeComponent, ButtonComponent],
  template: `
    @if (config()) {
      <div class="nf-sm">
        <!-- Current status badge -->
        @if (currentStatusDef(); as def) {
          <nf-badge [variant]="def.variant" size="md" rounded>
            {{ def.label }}
          </nf-badge>
        }

        <!-- Available transitions -->
        @for (t of availableTransitions(); track t.action) {
          <nf-button
            [variant]="t.variant ?? 'secondary'"
            size="sm"
            [disabled]="disabled()"
            (clicked)="onTransitionClick(t)">
            {{ t.label }}
          </nf-button>
        }
      </div>
    }
  `,
  styles: [`
    :host { display: block; }

    .nf-sm {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
  `],
})
export class StatusMachineComponent {
  private readonly transitionDialog = inject(StatusTransitionDialogService);
  private readonly permissionService = inject(PermissionService);

  // ── Inputs ──────────────────────────────────────────────────────────────────
  config   = input<StatusMachineConfig | undefined>(undefined);
  item     = input<unknown>(null);
  disabled = input<boolean>(false);

  // ── Outputs ─────────────────────────────────────────────────────────────────
  transitionRequest = output<StatusTransitionEvent>();

  // ── Computed ────────────────────────────────────────────────────────────────
  readonly currentStatus = computed<string>(() => {
    const cfg = this.config();
    const itm = this.item() as Record<string, unknown> | null;
    if (!cfg || !itm) return '';
    return String(itm[cfg.field] ?? '');
  });

  readonly currentStatusDef = computed<{ label: string; variant: BadgeVariant } | null>(() => {
    const cfg = this.config();
    const status = this.currentStatus();
    if (!cfg || !status) return null;
    return (cfg.statuses as Record<string, { label: string; variant: BadgeVariant }>)[status] ?? null;
  });

  readonly availableTransitions = computed(() => {
    const cfg = this.config();
    const status = this.currentStatus();
    const itm = this.item();
    if (!cfg || !status) return [];

    return cfg.transitions.filter((t) => {
      const fromStatuses = Array.isArray(t.from) ? t.from : [t.from];
      if (!fromStatuses.includes(status)) return false;
      if (t.permission && !this.permissionService.hasPermission(t.permission)) return false;
      if (t.conditions && itm && !t.conditions(itm)) return false;
      return true;
    });
  });

  // ── Actions ─────────────────────────────────────────────────────────────────
  async onTransitionClick(transition: StatusMachineConfig['transitions'][number]): Promise<void> {
    const { confirm, action, endpoint, to, label, variant } = transition;

    // No confirmation needed
    if (!confirm) {
      this.transitionRequest.emit({ action, endpoint, toStatus: to });
      return;
    }

    // Simple boolean confirm
    if (confirm === true) {
      const result = await this.transitionDialog.open({
        title: `${label} ?`,
        message: 'Confirmez-vous cette action ?',
        confirmLabel: label,
        variant: (variant as ButtonVariant) ?? 'primary',
      });
      if (result.confirmed) {
        this.transitionRequest.emit({ action, endpoint, toStatus: to, note: result.note });
      }
      return;
    }

    // Full confirm config
    const item = this.item();
    const message = typeof confirm.message === 'function' ? confirm.message(item) : confirm.message;

    const result = await this.transitionDialog.open({
      title: confirm.title,
      message,
      confirmLabel: confirm.confirmLabel ?? label,
      variant: (variant as ButtonVariant) ?? 'primary',
      requireNote: confirm.requireNote ?? false,
      notePlaceholder: confirm.notePlaceholder,
    });

    if (result.confirmed) {
      this.transitionRequest.emit({ action, endpoint, toStatus: to, note: result.note });
    }
  }
}
