import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';

import { PlatformNotificationsService } from './notifications.service';

@Component({
  selector: 'nf-platform-notification-center',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="nf-platform-notification-center">
      <header class="nf-platform-notification-center__header">
        <div>
          <p class="nf-platform-notification-center__eyebrow">Platform</p>
          <h1>Notifications</h1>
          <p class="nf-platform-notification-center__subtitle">
            Retrouvez vos alertes et les événements importants.
          </p>
        </div>
        <div class="nf-platform-notification-center__summary">
          {{ notifications.unreadCount() }} non lue(s)
        </div>
      </header>

      <div class="nf-platform-notification-center__toolbar">
        <button
          type="button"
          [disabled]="notifications.unreadCount() === 0"
          (click)="markAllRead()">
          Tout marquer comme lu
        </button>
        <button type="button" class="nf-platform-notification-center__secondary" (click)="retry()">
          Actualiser
        </button>
      </div>

      @if (notifications.loading()) {
        <p class="nf-platform-notification-center__state">Chargement des notifications...</p>
      } @else if (notifications.error()) {
        <div class="nf-platform-notification-center__state nf-platform-notification-center__state--error">
          <p>{{ notifications.error() }}</p>
          <button type="button" (click)="retry()">Réessayer</button>
        </div>
      } @else if (notifications.notifications().length === 0) {
        <p class="nf-platform-notification-center__state">Aucune notification.</p>
      } @else {
        <div class="nf-platform-notification-center__list">
          @for (notification of notifications.notifications(); track notification.id) {
            <article
              class="nf-platform-notification-center__item"
              [class.nf-platform-notification-center__item--unread]="!notification.read">
              <div class="nf-platform-notification-center__item-content">
                <h2>{{ notification.title }}</h2>
                @if (notification.message) {
                  <p>{{ notification.message }}</p>
                }
                @if (notification.createdAt) {
                  <time>{{ notification.createdAt | date: 'medium' }}</time>
                }
              </div>
              @if (!notification.read) {
                <button type="button" (click)="markRead(notification.id)">Marquer lu</button>
              }
            </article>
          }
        </div>
      }
    </section>
  `,
  styles: [`
    :host { display: block; min-height: 100%; }
    .nf-platform-notification-center { max-width: 980px; margin: 0 auto; padding: 32px; }
    .nf-platform-notification-center__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; margin-bottom: 24px; }
    .nf-platform-notification-center__eyebrow { margin: 0 0 6px; color: var(--nf-color-primary-700, #1d4ed8); font-size: .75rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
    h1 { margin: 0; font-size: 1.75rem; }
    .nf-platform-notification-center__subtitle { margin: 8px 0 0; color: var(--nf-text-muted, #64748b); }
    .nf-platform-notification-center__summary { color: var(--nf-text-muted, #64748b); font-size: .875rem; }
    .nf-platform-notification-center__toolbar { display: flex; gap: 8px; margin-bottom: 16px; }
    button { border: 0; border-radius: 6px; padding: 8px 12px; color: #fff; background: var(--nf-color-primary-600, #2563eb); cursor: pointer; font: inherit; font-size: .8125rem; }
    button:disabled { cursor: not-allowed; opacity: .5; }
    .nf-platform-notification-center__secondary { color: var(--nf-text-primary, #172033); background: var(--nf-surface-hover, #f1f5f9); }
    .nf-platform-notification-center__state { padding: 40px 16px; border: 1px dashed var(--nf-border-default, #cbd5e1); border-radius: 8px; color: var(--nf-text-muted, #64748b); text-align: center; }
    .nf-platform-notification-center__state--error { color: var(--nf-color-danger-700, #b91c1c); }
    .nf-platform-notification-center__list { display: grid; gap: 8px; }
    .nf-platform-notification-center__item { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px; border: 1px solid var(--nf-border-default, #e2e8f0); border-radius: 8px; background: var(--nf-color-surface, #fff); }
    .nf-platform-notification-center__item--unread { border-inline-start: 3px solid var(--nf-color-primary-600, #2563eb); background: var(--nf-color-primary-50, #eff6ff); }
    .nf-platform-notification-center__item h2 { margin: 0; font-size: .9375rem; }
    .nf-platform-notification-center__item p { margin: 5px 0 0; color: var(--nf-text-muted, #64748b); font-size: .8125rem; }
    .nf-platform-notification-center__item time { display: block; margin-top: 8px; color: var(--nf-text-muted, #94a3b8); font-size: .6875rem; }
    @media (max-width: 600px) { .nf-platform-notification-center { padding: 20px 12px; } .nf-platform-notification-center__header { flex-direction: column; gap: 8px; } .nf-platform-notification-center__item { align-items: flex-start; flex-direction: column; } }
  `],
})
export class PlatformNotificationCenterComponent {
  readonly notifications = inject(PlatformNotificationsService);

  constructor() {
    this.notifications.initialize();
  }

  retry(): void { void this.notifications.load(); }
  markAllRead(): void { void this.notifications.markAllRead(); }
  markRead(id: string): void { void this.notifications.markRead(id); }
}
