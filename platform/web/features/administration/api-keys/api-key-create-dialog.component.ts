import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import type { CreateApiKeyPayload } from './api-keys-api.service';

@Component({
  selector: 'app-api-key-create-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="api-key-dialog">
      <h3>{{ 'administration.apiKeys.dialog.createTitle' | translate }}</h3>

      <label>
        {{ 'administration.apiKeys.fields.name' | translate }}
        <input [(ngModel)]="name" />
      </label>

      <label>
        {{ 'administration.apiKeys.fields.permissions' | translate }}
        <input [(ngModel)]="permissionsRaw" placeholder="inventory.item.read,inventory.item.write" />
      </label>

      <label>
        {{ 'administration.apiKeys.fields.expiry' | translate }}
        <select [(ngModel)]="expiryPreset">
          <option value="never">{{ 'administration.apiKeys.expiry.never' | translate }}</option>
          <option value="30d">{{ 'administration.apiKeys.expiry.30d' | translate }}</option>
          <option value="90d">{{ 'administration.apiKeys.expiry.90d' | translate }}</option>
          <option value="1y">{{ 'administration.apiKeys.expiry.1y' | translate }}</option>
          <option value="custom">{{ 'administration.apiKeys.expiry.custom' | translate }}</option>
        </select>
      </label>

      <label *ngIf="expiryPreset === 'custom'">
        {{ 'administration.apiKeys.fields.expiresAt' | translate }}
        <input type="datetime-local" [(ngModel)]="customExpiry" />
      </label>

      <div class="api-key-dialog__actions">
        <button type="button" (click)="cancelled.emit()">
          {{ 'common.actions.cancel' | translate }}
        </button>
        <button
          type="button"
          [disabled]="name.trim().length === 0 || saving()"
          (click)="submit()">
          {{ saving() ? ('administration.apiKeys.creating' | translate) : ('administration.apiKeys.actions.create' | translate) }}
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .api-key-dialog {
        border: 1px solid var(--nf-border-default, #e5e7eb);
        border-radius: 12px;
        padding: 1rem;
        display: grid;
        gap: 0.75rem;
      }
      .api-key-dialog label {
        display: grid;
        gap: 0.35rem;
      }
      .api-key-dialog__actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
      }
    `,
  ],
})
export class ApiKeyCreateDialogComponent {
  readonly saving = input(false);

  readonly saved = output<CreateApiKeyPayload>();
  readonly cancelled = output<void>();

  name = '';
  permissionsRaw = '';
  expiryPreset: 'never' | '30d' | '90d' | '1y' | 'custom' = 'never';
  customExpiry = '';

  submit(): void {
    const permissions = this.permissionsRaw
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    let expiresAt: string | null = null;
    const now = new Date();
    if (this.expiryPreset === '30d') {
      expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    } else if (this.expiryPreset === '90d') {
      expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
    } else if (this.expiryPreset === '1y') {
      expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
    } else if (this.expiryPreset === 'custom' && this.customExpiry) {
      expiresAt = new Date(this.customExpiry).toISOString();
    }

    this.saved.emit({
      name: this.name.trim(),
      permissions,
      expiresAt,
    });
  }
}
