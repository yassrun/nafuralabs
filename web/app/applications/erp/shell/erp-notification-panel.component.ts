import { Component, HostListener, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ErpNotificationsService } from './erp-notifications.service';

const TYPE_ICON: Record<string, string> = {
  APPROBATION:    '✅',
  FACTURE_RETARD: '💰',
  CAUTION_EXPIRY: '🛡',
  NC_CRITIQUE:    '⚠️',
  PILOTAGE:       '📊',
};

/**
 * @deprecated Use {@link ErpNotificationBellListComponent} in the shell bell dropdown.
 * Kept for reference; not mounted in the app shell.
 */
import { ButtonComponent } from '@lib/anatomy';

@Component({
  selector: 'app-erp-notification-panel',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonComponent],
  template: `
    <div class="panel-overlay" (click)="close.emit()"></div>
    <div class="panel">
      <div class="panel-header">
        <h2>Notifications</h2>
        @if (svc.totalCount() > 0) {
          <span class="count-badge">{{ svc.totalCount() }}</span>
        }
        <nf-button class="close-btn" (clicked)="close.emit()" variant="secondary">✕</nf-button>
      </div>

      @if (svc.alerts().length === 0) {
        <div class="empty">
          <span class="empty-icon">🎉</span>
          <p>{{ 'shared.alerts.noPendingAlert' | translate }}</p>
        </div>
      } @else {
        <ul class="alerts-list">
          @for (alert of svc.alerts(); track alert.id) {
            <li class="alert-item" [class.alert-item--haute]="alert.urgence === 'HAUTE'" (click)="navigate(alert)">
              <span class="alert-icon">{{ typeIcon(alert.type) }}</span>
              <div class="alert-body">
                <p class="alert-titre">{{ alert.titre }}</p>
                <p class="alert-detail">{{ alert.detail }}</p>
              </div>
              @if (alert.urgence === 'HAUTE') {
                <span class="urgence-dot"></span>
              }
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: [`
    .panel-overlay { position: fixed; inset: 0; z-index: 999; }
    .panel { position: fixed; top: 56px; inset-inline-end: 12px; width: 380px; max-height: 480px; background: white; border: 1px solid var(--nf-color-border); border-radius: 1rem; box-shadow: 0 8px 32px rgba(0,0,0,0.12); z-index: 1000; display: flex; flex-direction: column; overflow: hidden; }
    .panel-header { display: flex; align-items: center; gap: 0.5rem; padding: 1rem 1.1rem; border-bottom: 1px solid var(--nf-color-bg-muted); }
    .panel-header h2 { margin: 0; font-size: 0.95rem; font-weight: 700; color: var(--nf-text-primary); flex: 1; }
    .count-badge { background: var(--nf-color-danger-600); color: white; font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 9999px; min-width: 18px; text-align: center; }
    .close-btn { background: none; border: none; font-size: 1rem; cursor: pointer; color: var(--nf-color-text-secondary); padding: 4px 8px; border-radius: 4px; }
    .close-btn:hover { background: var(--nf-color-bg-muted); }
    .alerts-list { overflow-y: auto; flex: 1; list-style: none; margin: 0; padding: 0.5rem; }
    .alert-item { display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.75rem; border-radius: 0.625rem; cursor: pointer; transition: background 80ms; margin-bottom: 3px; }
    .alert-item:hover { background: var(--nf-color-bg-subtle); }
    .alert-item--haute { border-inline-start: 3px solid var(--nf-color-danger-600); }
    .alert-icon { font-size: 1.25rem; flex-shrink: 0; margin-top: 1px; }
    .alert-body { flex: 1; min-width: 0; }
    .alert-titre { margin: 0 0 2px; font-size: 0.87rem; font-weight: 600; color: var(--nf-text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .alert-detail { margin: 0; font-size: 0.78rem; color: var(--nf-color-text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .urgence-dot { width: 8px; height: 8px; background: var(--nf-color-danger-600); border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
    .empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2.5rem; gap: 0.5rem; }
    .empty-icon { font-size: 2.5rem; }
    .empty p { margin: 0; color: var(--nf-color-text-secondary); font-size: 0.9rem; }
  `],
})
export class ErpNotificationPanelComponent {
  readonly svc = inject(ErpNotificationsService);
  readonly close = output<void>();

  typeIcon(t: string): string { return TYPE_ICON[t] ?? '🔔'; }

  navigate(alert: Parameters<ErpNotificationsService['navigate']>[0]): void {
    this.svc.navigate(alert);
    this.close.emit();
  }
}
