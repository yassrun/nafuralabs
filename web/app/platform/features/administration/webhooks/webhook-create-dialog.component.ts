import { CommonModule } from '@angular/common';
import { Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import type { WebhookConfigItem, WebhookUpsertPayload } from './webhooks-api.service';

@Component({
  selector: 'app-webhook-create-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="webhook-dialog">
      <h3>
        {{
          modelId()
            ? ('administration.webhooks.dialog.editTitle' | translate)
            : ('administration.webhooks.dialog.createTitle' | translate)
        }}
      </h3>

      <label>
        {{ 'administration.webhooks.form.name' | translate }}
        <input [(ngModel)]="name" />
      </label>

      <label>
        {{ 'administration.webhooks.form.url' | translate }}
        <input [(ngModel)]="url" type="url" />
        <span *ngIf="urlInvalid()" class="webhook-dialog__error">{{ 'common.validation.required' | translate }}</span>
      </label>

      <label>
        {{ 'administration.webhooks.form.secret' | translate }}
        <div class="webhook-dialog__secret-row">
          <input [(ngModel)]="secret" />
          <button type="button" (click)="generateSecret()">
            {{ 'administration.webhooks.form.generateSecret' | translate }}
          </button>
        </div>
      </label>

      <div class="webhook-dialog__events">
        <span>{{ 'administration.webhooks.form.events' | translate }}</span>
        <label *ngFor="let event of allEvents">
          <input
            type="checkbox"
            [checked]="events().includes(event)"
            (change)="toggleEvent(event)" />
          {{ event }}
        </label>
      </div>

      <label class="webhook-dialog__active">
        <input type="checkbox" [(ngModel)]="active" />
        {{ 'administration.webhooks.form.active' | translate }}
      </label>

      <div class="webhook-dialog__actions">
        <button type="button" (click)="cancelled.emit()">
          {{ 'common.actions.cancel' | translate }}
        </button>
        <button
          type="button"
          [disabled]="!canSubmit() || saving()"
          (click)="submit()">
          {{ saving() ? ('administration.webhooks.saving' | translate) : ('common.actions.save' | translate) }}
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .webhook-dialog {
        border: 1px solid var(--nf-border-default, #e5e7eb);
        border-radius: 12px;
        padding: 1rem;
        display: grid;
        gap: 0.75rem;
        background: var(--nf-color-surface, #fff);
      }
      .webhook-dialog label {
        display: grid;
        gap: 0.35rem;
        font-size: 0.9rem;
      }
      .webhook-dialog input[type='text'],
      .webhook-dialog input:not([type]) {
        width: 100%;
      }
      .webhook-dialog__secret-row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 0.5rem;
      }
      .webhook-dialog__events {
        display: grid;
        gap: 0.35rem;
      }
      .webhook-dialog__events label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .webhook-dialog__active {
        display: flex !important;
        align-items: center;
        gap: 0.5rem;
      }
      .webhook-dialog__actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
      }
      .webhook-dialog__error {
        font-size: 0.8rem;
        color: var(--nf-color-danger-600, #b91c1c);
      }
    `,
  ],
})
export class WebhookCreateDialogComponent {
  readonly model = input<WebhookConfigItem | null>(null);
  readonly saving = input(false);

  readonly saved = output<{ id: string | null; payload: WebhookUpsertPayload }>();
  readonly cancelled = output<void>();

  name = '';
  url = '';
  secret = '';
  active = true;
  readonly events = signal<string[]>([]);

  readonly allEvents: string[] = [
    'ENTITY_CREATED',
    'ENTITY_UPDATED',
    'ENTITY_DELETED',
    'APPROVAL_REQUESTED',
    'APPROVAL_APPROVED',
    'APPROVAL_REJECTED',
    'MEMBER_INVITED',
    'MEMBER_ACTIVATED',
    'DOMAIN_ACTIVATED',
  ];

  readonly modelId = signal<string | null>(null);

  constructor() {
    effect(() => {
      const model = this.model();
      if (!model) {
        this.modelId.set(null);
        this.name = '';
        this.url = '';
        this.secret = '';
        this.active = true;
        this.events.set(['ENTITY_UPDATED']);
        return;
      }
      this.modelId.set(model.id);
      this.name = model.name;
      this.url = model.url;
      this.secret = '';
      this.active = model.active;
      this.events.set(Array.isArray(model.events) ? [...model.events] : []);
    });
  }

  urlInvalid(): boolean {
    const u = this.url.trim();
    if (u.length === 0) return false;
    try {
      new URL(u);
      return false;
    } catch {
      return true;
    }
  }

  canSubmit(): boolean {
    return (
      this.name.trim().length > 0 &&
      this.url.trim().length > 0 &&
      !this.urlInvalid() &&
      this.secret.trim().length > 0 &&
      this.events().length > 0
    );
  }

  toggleEvent(event: string): void {
    const next = new Set(this.events());
    if (next.has(event)) {
      next.delete(event);
    } else {
      next.add(event);
    }
    this.events.set(Array.from(next));
  }

  generateSecret(): void {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    this.secret = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  submit(): void {
    const payload: WebhookUpsertPayload = {
      name: this.name.trim(),
      url: this.url.trim(),
      secret: this.secret.trim(),
      events: this.events(),
      active: this.active,
    };
    this.saved.emit({ id: this.modelId(), payload });
  }
}
