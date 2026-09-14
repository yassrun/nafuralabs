import { Component, HostListener, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface StatusHistoryEntryView {
  id: string;
  who: string;
  what: string;
  fromLabel: string;
  toLabel: string;
  when: string;
  whenIso: string;
  motif?: string | null;
}

@Component({
  selector: 'nf-status-history-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (open()) {
      <div class="nf-shd__backdrop" (click)="closed.emit()"></div>
      <div
        class="nf-shd"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nf-shd-title"
        (click)="$event.stopPropagation()"
      >
        <header class="nf-shd__header">
          <div>
            <h2 id="nf-shd-title" class="nf-shd__title">Historique des statuts</h2>
            @if (subtitle()) {
              <p class="nf-shd__subtitle">{{ subtitle() }}</p>
            }
          </div>
          <button type="button" class="nf-shd__close" aria-label="Fermer" (click)="closed.emit()">
            ×
          </button>
        </header>

        <div class="nf-shd__body">
          @if (loading() && entries().length === 0) {
            <p class="nf-shd__empty">Chargement de l’historique…</p>
          } @else if (entries().length === 0) {
            <p class="nf-shd__empty">Aucun changement de statut pour le moment.</p>
          } @else {
            <ol class="nf-shd__list">
              @for (entry of entries(); track entry.id) {
                <li class="nf-shd__row">
                  <p class="nf-shd__what">{{ entry.what }}</p>
                  <p class="nf-shd__shift">
                    @if (entry.fromLabel) {
                      <span>{{ entry.fromLabel }}</span>
                      <span class="nf-shd__arrow" aria-hidden="true">→</span>
                    }
                    <span>{{ entry.toLabel }}</span>
                  </p>
                  <p class="nf-shd__meta">
                    <span class="nf-shd__who">{{ entry.who }}</span>
                    <time [attr.datetime]="entry.whenIso">{{ entry.when }}</time>
                  </p>
                  @if (entry.motif) {
                    <p class="nf-shd__motif">Motif : {{ entry.motif }}</p>
                  }
                </li>
              }
            </ol>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .nf-shd__backdrop {
      position: fixed;
      inset: 0;
      z-index: 80;
      background: rgb(15 23 42 / 0.32);
    }

    .nf-shd {
      position: fixed;
      z-index: 81;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      width: min(36rem, calc(100vw - 2rem));
      max-height: min(36rem, calc(100vh - 4rem));
      background: var(--nf-color-bg-surface, #fff);
      border: 1px solid var(--nf-color-border, #e5e7eb);
      border-radius: 12px;
    }

    .nf-shd__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      padding: 1.1rem 1.25rem 0.85rem;
      border-bottom: 1px solid var(--nf-color-border, #e5e7eb);
    }

    .nf-shd__title {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 650;
      color: var(--nf-color-text-primary, #111827);
    }

    .nf-shd__subtitle {
      margin: 0.2rem 0 0;
      font-size: 0.8125rem;
      color: var(--nf-color-text-secondary, #4b5563);
    }

    .nf-shd__close {
      margin: -0.25rem -0.35rem 0 0;
      padding: 0 0.45rem;
      border: 0;
      background: transparent;
      color: var(--nf-color-text-tertiary, #64748b);
      font-size: 1.5rem;
      line-height: 1;
      cursor: pointer;
    }

    .nf-shd__close:hover { color: var(--nf-color-text-primary, #111827); }

    .nf-shd__body {
      overflow: auto;
      padding: 0.25rem 0;
    }

    .nf-shd__empty {
      margin: 0;
      padding: 1.25rem;
      font-size: 0.875rem;
      color: var(--nf-color-text-secondary, #4b5563);
    }

    .nf-shd__list {
      margin: 0;
      padding: 0.35rem 0;
      list-style: none;
    }

    .nf-shd__row {
      padding: 0.85rem 1.25rem;
      border-bottom: 1px solid var(--nf-color-border, #e5e7eb);
    }

    .nf-shd__row:last-child { border-bottom: 0; }

    .nf-shd__what {
      margin: 0;
      font-size: 0.9375rem;
      font-weight: 650;
      color: var(--nf-color-text-primary, #111827);
    }

    .nf-shd__shift {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.35rem;
      margin: 0.28rem 0 0;
      font-size: 0.8125rem;
      color: var(--nf-color-text-secondary, #4b5563);
    }

    .nf-shd__arrow { opacity: 0.55; }

    .nf-shd__meta {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      justify-content: space-between;
      gap: 0.35rem 1rem;
      margin: 0.4rem 0 0;
      font-size: 0.75rem;
      color: var(--nf-color-text-tertiary, #64748b);
    }

    .nf-shd__who {
      font-weight: 600;
      color: var(--nf-color-text-secondary, #4b5563);
    }

    .nf-shd__motif {
      margin: 0.4rem 0 0;
      font-size: 0.75rem;
      color: var(--nf-color-text-secondary, #4b5563);
    }
  `],
})
export class StatusHistoryDialogComponent {
  readonly open = input(false);
  readonly subtitle = input('');
  readonly loading = input(false);
  readonly entries = input<StatusHistoryEntryView[]>([]);
  readonly closed = output<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) this.closed.emit();
  }
}
