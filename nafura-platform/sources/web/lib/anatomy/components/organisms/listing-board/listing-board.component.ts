import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { BadgeComponent } from '../../atoms/badge';
import { ButtonComponent } from '../../atoms/button';
import type { BadgeVariant } from '../../../types';

export interface ListingBoardCard {
  title: string;
  subtitle?: string;
  badge?: string;
  meta?: string;
}

export interface ListingBoardColumn<T = unknown> {
  id: string;
  label: string;
  tone?: BadgeVariant;
  total: number;
  rows: T[];
  reachable: boolean;
  hasMore: boolean;
}

export interface ListingBoardMove {
  id: string;
  label: string;
}

/**
 * Columns of a lifecycle, one state each. Used only by `nf-listing-page`.
 * Drag fires a transition; under 768 px a « Move to » action replaces the drag.
 */
@Component({
  selector: 'nf-listing-board',
  standalone: true,
  imports: [TranslateModule, BadgeComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="nf-board"
      role="region"
      [attr.aria-label]="'Board' | translate"
      (keydown)="onKey($event)">
      @for (column of columns(); track column.id) {
        <section
          class="nf-board__column"
          [class.nf-board__column--on]="dragging() && column.reachable"
          [class.nf-board__column--off]="dragging() && !column.reachable"
          [attr.aria-label]="column.label"
          (dragover)="onDragOver($event, column)"
          (drop)="onDrop($event, column)">
          <header class="nf-board__head">
            <nf-badge [variant]="column.tone ?? 'default'" size="sm" rounded>{{ column.label | translate }}</nf-badge>
            <span class="nf-board__count">{{ column.total }}</span>
          </header>
          <ul class="nf-board__cards" role="list">
            @for (row of column.rows; track track()(row); let index = $index) {
              <li
                class="nf-board__card"
                role="listitem"
                tabindex="0"
                [attr.draggable]="narrow() ? null : true"
                [attr.aria-grabbed]="draggingId() === track()(row)"
                [class.nf-board__card--selected]="selected() === track()(row)"
                (dragstart)="onDragStart($event, row)"
                (dragend)="onDragEnd()"
                (click)="open.emit(row)"
                (keydown.enter)="onEnter($event, row, column)">
                <strong>{{ text(row, card().title) }}</strong>
                @if (card().subtitle) {
                  <span class="nf-board__sub">{{ text(row, card().subtitle!) }}</span>
                }
                @if (card().badge) {
                  <span class="nf-board__meta">{{ text(row, card().badge!) }}</span>
                }
                @if (pending(row)) {
                  <span class="nf-board__approval">{{ 'In approval' | translate }}</span>
                }
                @if (narrow()) {
                  <nf-button variant="secondary" size="sm" (clicked)="askMove(row, $event)">{{ 'Move to' | translate }}</nf-button>
                }
                @if ((promptId() ?? menuFor()) === track()(row) && moves().length) {
                  <div class="nf-board__menu" role="menu">
                    @for (move of moves(); track move.id) {
                      <button type="button" role="menuitem" (click)="choose(row, move, $event)">{{ move.label | translate }}</button>
                    }
                  </div>
                }
              </li>
            }
          </ul>
          @if (column.hasMore) {
            <button type="button" class="nf-board__more" (click)="more.emit(column.id)">{{ 'Show more' | translate }}</button>
          }
        </section>
      }
      <div class="nf-board__live" aria-live="polite">{{ live() }}</div>
    </div>
  `,
  styles: `
    :host { display: block; height: 100%; min-height: 0; }
    .nf-board {
      display: flex;
      gap: 12px;
      height: 100%;
      min-height: 280px;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      padding-bottom: 8px;
    }
    .nf-board__column {
      flex: 1 0 260px;
      max-width: 360px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
      border: 1px solid var(--nf-border-default, #e5e7eb);
      border-radius: var(--nf-radius-lg, 12px);
      background: var(--nf-surface-section, #fff);
      scroll-snap-align: center;
    }
    .nf-board__column--on { outline: 2px solid var(--nf-color-primary-500, #6366f1); }
    .nf-board__column--off { opacity: 0.45; }
    .nf-board__head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .nf-board__count { font-size: 0.8125rem; color: var(--nf-text-muted, #6b7280); }
    .nf-board__cards { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; overflow: auto; }
    .nf-board__card {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 10px 12px;
      border: 1px solid var(--nf-border-default, #e5e7eb);
      border-radius: 10px;
      background: var(--nf-surface-card, #fff);
      cursor: pointer;
      text-align: left;
    }
    .nf-board__card--selected { outline: 2px solid var(--nf-color-primary-500, #6366f1); }
    .nf-board__sub, .nf-board__meta { font-size: 0.8125rem; color: var(--nf-text-muted, #6b7280); }
    .nf-board__approval { font-size: 0.75rem; color: var(--nf-color-warning-700, #b45309); }
    .nf-board__more {
      border: 0;
      background: transparent;
      color: var(--nf-text-secondary, #374151);
      cursor: pointer;
      text-align: left;
      padding: 4px;
    }
    .nf-board__menu { display: flex; flex-direction: column; gap: 4px; }
    .nf-board__menu button {
      text-align: left;
      border: 1px solid var(--nf-border-default, #e5e7eb);
      background: var(--nf-surface-card, #fff);
      border-radius: 6px;
      padding: 6px 8px;
      cursor: pointer;
    }
    .nf-board__live { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
    @media (max-width: 767px) {
      .nf-board__column { flex-basis: 88%; max-width: 88%; }
    }
  `,
})
export class ListingBoardComponent<T extends Record<string, unknown> = Record<string, unknown>> {
  readonly columns = input.required<ListingBoardColumn<T>[]>();
  readonly card = input.required<ListingBoardCard>();
  readonly track = input<(row: T) => string>((row) => String(row['id'] ?? ''));
  /** Rows whose last transition opened an approval. */
  readonly pendingIds = input<readonly string[]>([]);
  /** Transitions offered after a drop that can reach the column in more than one way. */
  readonly moves = input<ListingBoardMove[]>([]);
  /** Row whose move menu is open (several transitions reach the same column). */
  readonly promptId = input<string | null>(null);

  readonly open = output<T>();
  readonly dragRow = output<T | null>();
  readonly dropOn = output<{ row: T; to: string }>();
  readonly move = output<{ row: T; transition: string }>();
  readonly more = output<string>();
  readonly ask = output<T>();

  readonly draggingId = signal<string | null>(null);
  readonly selected = signal<string | null>(null);
  readonly menuFor = signal<string | null>(null);
  readonly armed = signal<string | null>(null);
  readonly live = signal('');
  private readonly width = signal(typeof window === 'undefined' ? 1200 : window.innerWidth);

  readonly dragging = computed(() => this.draggingId() != null);
  readonly narrow = computed(() => this.width() < 768);

  constructor() {
    if (typeof window !== 'undefined') {
      const onResize = () => this.width.set(window.innerWidth);
      window.addEventListener('resize', onResize);
    }
  }

  text(row: T, field: string): string {
    const value = row[field];
    return value == null || value === '' ? '—' : String(value);
  }

  pending(row: T): boolean {
    return this.pendingIds().includes(this.track()(row));
  }

  onDragStart(event: DragEvent, row: T): void {
    if (this.narrow()) {
      event.preventDefault();
      return;
    }
    this.draggingId.set(this.track()(row));
    this.dragRow.emit(row);
    event.dataTransfer?.setData('text/plain', this.track()(row));
  }

  onDragEnd(): void {
    this.draggingId.set(null);
    this.dragRow.emit(null);
  }

  onDragOver(event: DragEvent, column: ListingBoardColumn<T>): void {
    if (!this.dragging() || !column.reachable) return;
    event.preventDefault();
  }

  onDrop(event: DragEvent, column: ListingBoardColumn<T>): void {
    event.preventDefault();
    const id = this.draggingId();
    this.onDragEnd();
    if (!id || !column.reachable) return;
    const row = this.columns().flatMap((item) => item.rows).find((item) => this.track()(item) === id);
    if (!row) return;
    this.dropOn.emit({ row, to: column.id });
    this.live.set(column.label);
  }

  askMove(row: T, event: Event): void {
    event.stopPropagation();
    this.menuFor.set(this.track()(row));
    this.ask.emit(row);
  }

  choose(row: T, move: ListingBoardMove, event: Event): void {
    event.stopPropagation();
    this.menuFor.set(null);
    this.move.emit({ row, transition: move.id });
  }

  onEnter(event: Event, row: T, column: ListingBoardColumn<T>): void {
    const target = this.armed();
    if (target && target !== column.id) {
      event.preventDefault();
      event.stopPropagation();
      this.dropOn.emit({ row, to: target });
      this.armed.set(null);
      return;
    }
  }

  onKey(event: KeyboardEvent): void {
    const columns = this.columns();
    const id = this.selected();
    const located = this.locate(id);
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      if (!located) {
        const first = columns[0]?.rows[0];
        if (first) this.selected.set(this.track()(first));
        return;
      }
      const step = event.key === 'ArrowRight' ? 1 : -1;
      const nextIndex = located.column + step;
      const next = columns[nextIndex];
      if (!next) return;
      if (this.draggingId() || event.shiftKey) {
        this.armed.set(next.id);
        this.live.set(next.label);
        return;
      }
      const row = next.rows[0];
      if (row) this.selected.set(this.track()(row));
    }
  }

  private locate(id: string | null): { column: number } | null {
    if (!id) return null;
    const index = this.columns().findIndex((column) => column.rows.some((row) => this.track()(row) === id));
    return index < 0 ? null : { column: index };
  }
}
