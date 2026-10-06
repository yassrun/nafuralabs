import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import { EmptyStateComponent } from '../../lib/anatomy/components/molecules/empty-state';
import { LoadingStateComponent } from '../../lib/anatomy/components/molecules/loading-state';
import { NfSelectComponent } from '../../lib/anatomy/components/atoms/select';
import { NfSwitchComponent } from '../../lib/anatomy/components/atoms/switch';
import { UserSettingsApiService } from '../../features/user-settings/models';
import type { DigestFrequency } from '../../features/user-settings/models';
import { PlatformNotificationsApiService } from './notifications-api.service';
import type { NotificationPreferenceSetting } from './notifications-api.types';
import {
  PREFERENCE_CHANNELS,
  channelEnabled,
  channelLocked,
  type PreferenceChannel,
  type PreferenceLayer,
} from './notification-preferences';

const DIGEST_OPTIONS: { value: DigestFrequency; labelKey: string }[] = [
  { value: 'none', labelKey: 'notifications.digest.none' },
  { value: 'daily', labelKey: 'notifications.digest.daily' },
  { value: 'weekly', labelKey: 'notifications.digest.weekly' },
];

@Component({
  selector: 'nf-platform-notification-preferences',
  standalone: true,
  imports: [
    FormsModule,
    TranslateModule,
    EmptyStateComponent,
    LoadingStateComponent,
    NfSelectComponent,
    NfSwitchComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="nf-notification-prefs">
      @if (layer() === 'user') {
        <div class="nf-notification-prefs__digest">
          <nf-select
            [label]="'notifications.digest.label' | translate"
            [options]="digestSelectOptions()"
            [ngModel]="digestFrequency()"
            [disabled]="digestBusy()"
            (ngModelChange)="onDigestChange($event)" />
          <p class="nf-notification-prefs__hint">{{ 'notifications.digest.hint' | translate }}</p>
        </div>
      }

      <p class="nf-notification-prefs__hint">
        {{ (layer() === 'organisation'
          ? 'notifications.preferences.orgHint'
          : 'notifications.preferences.userHint') | translate }}
      </p>

      @if (loading()) {
        <nf-loading-state />
      } @else if (error()) {
        <nf-empty-state
          icon="bell-ring"
          [title]="error()!"
          [actionLabel]="'notifications.center.retry' | translate"
          (action)="reload()" />
      } @else if (rows().length === 0) {
        <nf-empty-state
          icon="bell-ring"
          [title]="'notifications.preferences.empty' | translate" />
      } @else {
        <table class="nf-notification-prefs__table">
          <thead>
            <tr>
              <th>{{ 'notifications.preferences.event' | translate }}</th>
              <th>{{ 'notifications.preferences.inApp' | translate }}</th>
              <th>{{ 'notifications.preferences.email' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track row.event) {
              <tr>
                <td>
                  <span class="nf-notification-prefs__label">{{ row.label }}</span>
                  @if (row.mandatory) {
                    <span class="nf-notification-prefs__mandatory">{{
                      'notifications.preferences.mandatory' | translate
                    }}</span>
                  }
                </td>
                @for (channel of channels; track channel) {
                  <td>
                    <nf-switch
                      [checked]="on(row, channel)"
                      [disabled]="busy() === key(row.event, channel) || locked(row, channel)"
                      (changed)="toggle(row, channel, $event)" />
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      }
    </section>
  `,
  styles: [`
    .nf-notification-prefs { display: grid; gap: 16px; }
    .nf-notification-prefs__digest {
      display: grid;
      gap: 6px;
      max-width: 320px;
    }
    .nf-notification-prefs__hint {
      margin: 0;
      color: var(--nf-text-muted, #64748b);
      font-size: 0.875rem;
    }
    .nf-notification-prefs__table {
      width: 100%;
      border-collapse: collapse;
      background: var(--nf-color-surface, #fff);
      border: 1px solid var(--nf-border-default, #e2e8f0);
      border-radius: 8px;
      overflow: hidden;
    }
    th, td {
      padding: 12px 16px;
      text-align: start;
      border-bottom: 1px solid var(--nf-border-subtle, #f1f5f9);
      vertical-align: middle;
    }
    th {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: .04em;
      text-transform: uppercase;
      color: var(--nf-text-muted, #64748b);
    }
    tr:last-child td { border-bottom: 0; }
    .nf-notification-prefs__label { font-weight: 600; }
    .nf-notification-prefs__mandatory {
      display: inline-block;
      margin-inline-start: 8px;
      padding: 2px 8px;
      border-radius: 999px;
      background: var(--nf-color-primary-50, #eff6ff);
      color: var(--nf-color-primary-700, #1d4ed8);
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: .04em;
      text-transform: uppercase;
    }
  `],
})
export class PlatformNotificationPreferencesComponent implements OnInit {
  private readonly api = inject(PlatformNotificationsApiService);
  private readonly userSettings = inject(UserSettingsApiService);
  private readonly translate = inject(TranslateService);

  readonly layer = input<PreferenceLayer>('user');

  readonly rows = signal<readonly NotificationPreferenceSetting[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly busy = signal<string | null>(null);
  readonly digestFrequency = signal<DigestFrequency>('daily');
  readonly digestBusy = signal(false);
  readonly channels = PREFERENCE_CHANNELS;
  readonly digestSelectOptions = signal<{ value: string; label: string }[]>([]);

  ngOnInit(): void {
    this.digestSelectOptions.set(
      DIGEST_OPTIONS.map((option) => ({
        value: option.value,
        label: this.translate.instant(option.labelKey),
      })),
    );
    void this.reload();
  }

  on(row: NotificationPreferenceSetting, channel: PreferenceChannel): boolean {
    return channelEnabled(row, channel);
  }

  locked(row: NotificationPreferenceSetting, channel: PreferenceChannel): boolean {
    return channelLocked(row, this.layer(), channel);
  }

  key(event: string, channel: string): string {
    return `${event}|${channel}`;
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const prefs = firstValueFrom(this.list());
      if (this.layer() === 'user') {
        const [rows, digest] = await Promise.all([
          prefs,
          firstValueFrom(this.userSettings.getNotificationSettings()),
        ]);
        this.rows.set(rows);
        this.digestFrequency.set(normalizeDigest(digest.digestFrequency));
      } else {
        this.rows.set(await prefs);
      }
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Impossible de charger les préférences.');
    } finally {
      this.loading.set(false);
    }
  }

  async onDigestChange(value: string): Promise<void> {
    const frequency = normalizeDigest(value);
    if (frequency === this.digestFrequency() || this.digestBusy()) return;
    this.digestBusy.set(true);
    this.error.set(null);
    const previous = this.digestFrequency();
    this.digestFrequency.set(frequency);
    try {
      const current = await firstValueFrom(this.userSettings.getNotificationSettings());
      await firstValueFrom(
        this.userSettings.updateNotificationSettings({
          emailNotifications: current.emailNotifications,
          inAppNotifications: current.inAppNotifications,
          digestFrequency: frequency,
        }),
      );
    } catch (error) {
      this.digestFrequency.set(previous);
      this.error.set(error instanceof Error ? error.message : 'Impossible d’enregistrer la fréquence.');
    } finally {
      this.digestBusy.set(false);
    }
  }

  async toggle(
    row: NotificationPreferenceSetting,
    channel: PreferenceChannel,
    enabled: boolean,
  ): Promise<void> {
    if (this.locked(row, channel)) return;
    const id = this.key(row.event, channel);
    this.busy.set(id);
    this.error.set(null);
    try {
      const choice = { event: row.event, channel, enabled };
      this.rows.set(
        await firstValueFrom(
          this.layer() === 'organisation'
            ? this.api.setOrganisationPreference(choice)
            : this.api.setPreference(choice),
        ),
      );
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Impossible d’enregistrer la préférence.');
      await this.reload();
    } finally {
      this.busy.set(null);
    }
  }

  private list() {
    return this.layer() === 'organisation' ? this.api.organisationPreferences() : this.api.preferences();
  }
}

function normalizeDigest(value: string | null | undefined): DigestFrequency {
  if (value === 'none' || value === 'weekly' || value === 'daily') return value;
  return 'daily';
}
