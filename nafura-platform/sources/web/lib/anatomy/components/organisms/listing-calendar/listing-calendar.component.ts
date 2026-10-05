import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from '../../atoms/button';

/** A row placed on a day: `date` is `YYYY-MM-DD`; texts are already formatted by the host. */
export interface ListingCalendarItem<T = unknown> {
  id: string;
  date: string;
  title: string;
  subtitle?: string;
  row: T;
}

interface CalendarDay<T> {
  iso: string;
  day: number;
  inMonth: boolean;
  today: boolean;
  items: ListingCalendarItem<T>[];
}

/**
 * Month grid of a list (`layout: 'calendar'`), Monday first. Used only by `nf-listing-page`, which loads the rows of
 * the shown month and formats the cards. A click on a card emits `open`; the arrows emit `monthChange`.
 */
@Component({
  selector: 'nf-listing-calendar',
  standalone: true,
  imports: [TranslateModule, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="nf-calendar" role="region" [attr.aria-label]="title()">
      <header class="nf-calendar__head">
        <nf-button variant="secondary" size="xs" iconLibrary="lucide" icon="chevron-left"
          [attr.aria-label]="'Previous month' | translate" (clicked)="shift(-1)" />
        <h3 class="nf-calendar__title">{{ title() }}</h3>
        <nf-button variant="secondary" size="xs" iconLibrary="lucide" icon="chevron-right"
          [attr.aria-label]="'Next month' | translate" (clicked)="shift(1)" />
        <nf-button variant="ghost" size="xs" (clicked)="thisMonth()">{{ 'Today' | translate }}</nf-button>
      </header>
      <div class="nf-calendar__grid" role="grid">
        @for (name of weekdays(); track name) {
          <div class="nf-calendar__weekday" role="columnheader">{{ name }}</div>
        }
        @for (day of days(); track day.iso) {
          <div class="nf-calendar__day" role="gridcell"
            [class.nf-calendar__day--out]="!day.inMonth"
            [class.nf-calendar__day--today]="day.today">
            <span class="nf-calendar__number">{{ day.day }}</span>
            @for (item of day.items; track item.id) {
              <button type="button" class="nf-calendar__card" (click)="open.emit(item.row)">
                <strong>{{ item.title }}</strong>
                @if (item.subtitle) {
                  <span>{{ item.subtitle }}</span>
                }
              </button>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    :host { display: block; }
    .nf-calendar__head { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
    .nf-calendar__title { margin: 0 8px; font-size: 15px; font-weight: 600; text-transform: capitalize; min-width: 160px; text-align: center; }
    .nf-calendar__grid {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      border-top: 1px solid var(--nf-border-default, #e5e7eb);
      border-left: 1px solid var(--nf-border-default, #e5e7eb);
    }
    .nf-calendar__weekday {
      padding: 6px 8px;
      font-size: 12px;
      color: var(--nf-text-secondary, #6b7280);
      text-transform: capitalize;
      border-right: 1px solid var(--nf-border-default, #e5e7eb);
      border-bottom: 1px solid var(--nf-border-default, #e5e7eb);
    }
    .nf-calendar__day {
      min-height: 96px;
      padding: 4px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      border-right: 1px solid var(--nf-border-default, #e5e7eb);
      border-bottom: 1px solid var(--nf-border-default, #e5e7eb);
      background: var(--nf-surface-card, #fff);
    }
    .nf-calendar__day--out { background: var(--nf-surface-muted, #f9fafb); }
    .nf-calendar__day--out .nf-calendar__number { color: var(--nf-text-tertiary, #9ca3af); }
    .nf-calendar__day--today .nf-calendar__number {
      background: var(--nf-color-primary-500, #6366f1);
      color: #fff;
      border-radius: 999px;
      padding: 0 6px;
    }
    .nf-calendar__number { align-self: flex-start; font-size: 12px; }
    .nf-calendar__card {
      display: flex;
      flex-direction: column;
      gap: 2px;
      text-align: left;
      font: inherit;
      font-size: 12px;
      padding: 4px 6px;
      border-radius: 6px;
      border: 1px solid var(--nf-border-default, #e5e7eb);
      background: var(--nf-color-primary-50, #eef2ff);
      cursor: pointer;
      overflow: hidden;
    }
    .nf-calendar__card strong { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .nf-calendar__card span { color: var(--nf-text-secondary, #6b7280); }
    @media (max-width: 767px) {
      .nf-calendar__day { min-height: 64px; }
      .nf-calendar__card span { display: none; }
    }
  `,
})
export class ListingCalendarComponent<T = unknown> {
  /** First day of the shown month (`YYYY-MM-01`). */
  readonly month = input.required<string>();
  readonly items = input<ListingCalendarItem<T>[]>([]);
  readonly locale = input('fr-MA');

  readonly open = output<T>();
  readonly monthChange = output<string>();

  readonly title = computed(() =>
    new Date(`${this.month()}T00:00:00`).toLocaleDateString(this.locale(), { month: 'long', year: 'numeric' }),
  );

  readonly weekdays = computed(() => {
    const monday = new Date('2024-01-01T00:00:00');
    return Array.from({ length: 7 }, (_, index) =>
      new Date(monday.getTime() + index * 86_400_000).toLocaleDateString(this.locale(), { weekday: 'short' }),
    );
  });

  readonly days = computed((): CalendarDay<T>[] => {
    const first = new Date(`${this.month()}T00:00:00`);
    const start = new Date(first);
    start.setDate(1 - ((first.getDay() + 6) % 7));
    const byDay = new Map<string, ListingCalendarItem<T>[]>();
    for (const item of this.items()) {
      const list = byDay.get(item.date) ?? [];
      list.push(item);
      byDay.set(item.date, list);
    }
    const today = iso(new Date());
    const days: CalendarDay<T>[] = [];
    for (let index = 0; index < 42; index++) {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = iso(date);
      days.push({ iso: key, day: date.getDate(), inMonth: date.getMonth() === first.getMonth(), today: key === today, items: byDay.get(key) ?? [] });
    }
    return days;
  });

  shift(months: number): void {
    const date = new Date(`${this.month()}T00:00:00`);
    date.setMonth(date.getMonth() + months, 1);
    this.monthChange.emit(iso(date));
  }

  thisMonth(): void {
    const date = new Date();
    date.setDate(1);
    this.monthChange.emit(iso(date));
  }
}

function iso(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
