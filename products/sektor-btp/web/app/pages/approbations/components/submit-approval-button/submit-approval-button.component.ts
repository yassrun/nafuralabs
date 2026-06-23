/**
 * Submit-for-approval Button
 *
 * Reusable button + status pill that any business detail page can drop in
 * to expose its entity to the approval workflow. Once submitted, the button
 * morphs into a status pill ("En attente d'approbation" / "Approuvé" / "Rejeté")
 * with a link to the approbations inbox row.
 */

import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ToastService } from '@lib/anatomy/components/services/toast.service';

import { ApprobationsApiService } from '../../services/approbations-api.service';
import type { ApprovalEntityType, ApprovalRequest } from '../../models';

import { ButtonComponent } from '@lib/anatomy';

@Component({
  selector: 'app-submit-approval-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, TranslateModule, ButtonComponent],
  template: `
    @if (request(); as r) {
      <a class="approval-pill" [class]="'approval-pill--' + r.status.toLowerCase()"
         [routerLink]="['/approbations']" [queryParams]="{ highlight: r.id }"
         [attr.aria-label]="'dashboard.approbations.card.viewLinkAria' | translate: { id: r.id }">
        <span class="approval-pill__dot"></span>
        <span class="approval-pill__label">{{ pillLabel() | translate }}</span>
        @if (r.etapes && r.etapes.length > 1) {
          <span class="approval-pill__step">{{ 'dashboard.approbations.card.etape' | translate: { current: r.etapeCourante + 1, total: r.etapes.length } }}</span>
        }
      </a>
    } @else {
      <nf-button type="button" class="approval-btn"
              [disabled]="disabled()"
              (clicked)="onSubmit()" variant="secondary">
        <span aria-hidden="true">📤</span>
        <span>{{ 'dashboard.approbations.actions.submit' | translate }}</span>
      </nf-button>
    }
  `,
  styles: [`
    :host { display: inline-block; }

    .approval-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.55rem 1rem;
      border-radius: 0.5rem;
      border: 1px solid var(--nf-color-primary-600);
      background: var(--nf-color-primary-600);
      color: white;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      transition: background 120ms, border-color 120ms;
    }
    .approval-btn:hover:not(:disabled) { background: var(--nf-color-primary-700); border-color: var(--nf-color-primary-700); }
    .approval-btn:disabled { opacity: 0.55; cursor: not-allowed; }

    .approval-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0.75rem;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
      text-decoration: none;
      border: 1px solid;
    }
    .approval-pill__dot {
      width: 0.5rem; height: 0.5rem; border-radius: 50%;
      background: currentColor;
    }
    .approval-pill__step {
      font-size: 0.7rem;
      opacity: 0.75;
      font-weight: 500;
      padding-left: 0.4rem;
      border-left: 1px solid currentColor;
      margin-left: 0.2rem;
    }
    .approval-pill--en_attente { color: var(--nf-color-warning-700); background: var(--nf-color-warning-100); border-color: var(--nf-color-warning-200); }
    .approval-pill--approuve { color: var(--nf-color-success-700); background: var(--nf-color-success-100); border-color: var(--nf-color-success-200); }
    .approval-pill--rejete { color: var(--nf-color-danger-700); background: var(--nf-color-danger-100); border-color: var(--nf-color-danger-200); }
    .approval-pill--expire { color: var(--nf-color-text-secondary); background: var(--nf-color-bg-muted); border-color: var(--nf-color-border); }
  `],
})
export class SubmitApprovalButtonComponent {
  private readonly approbations = inject(ApprobationsApiService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly entityType = input.required<ApprovalEntityType>();
  readonly entityId = input.required<string>();
  readonly entityRef = input.required<string>();
  readonly entitySummary = input<string>('');
  readonly montantConcerne = input<number | undefined>(undefined);
  readonly chantierId = input<string | undefined>(undefined);
  readonly chantierCode = input<string | undefined>(undefined);
  readonly urgence = input<'NORMALE' | 'HAUTE' | 'CRITIQUE'>('NORMALE');
  readonly disabled = input<boolean>(false);

  readonly submitted = output<ApprovalRequest>();

  readonly request = computed(() => {
    return this.approbations.requests().find(
      (r) => r.entityType === this.entityType() && r.entityId === this.entityId(),
    );
  });

  private readonly loadOnInit = effect(() => {
    void this.approbations.ensureLoaded();
  });

  pillLabel(): string {
    const r = this.request();
    if (!r) return '';
    switch (r.status) {
      case 'EN_ATTENTE': return 'dashboard.approbations.pill.enAttente';
      case 'APPROUVE': return 'dashboard.approbations.pill.approuve';
      case 'REJETE': return 'dashboard.approbations.pill.rejete';
      case 'EXPIRE': return 'dashboard.approbations.pill.expire';
    }
  }

  async onSubmit(): Promise<void> {
    if (this.disabled()) return;
    const summary = this.entitySummary() || `${this.entityRef()}`;
    const created = await this.approbations.submit({
      entityType: this.entityType(),
      entityId: this.entityId(),
      entityRef: this.entityRef(),
      entitySummary: summary,
      montantConcerne: this.montantConcerne(),
      chantierId: this.chantierId(),
      chantierCode: this.chantierCode(),
      urgence: this.urgence(),
    });
    this.submitted.emit(created);
    this.toast.success(this.translate.instant('dashboard.approbations.toasts.submitted', { ref: this.entityRef() }));
  }
}
