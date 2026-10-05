import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked } from '@angular/core';

import { ListingCalendarComponent, type ListingCalendarItem } from '../../lib/anatomy/components/organisms/listing-calendar';
import { LISTING_PAGE, rowsOf } from './listing-page.context';
import type { Row } from './listing-page.types';
import { allOf } from './listing-properties';

const ALL = 500;

/**
 * The calendar layout of `nf-listing-page`: the rows of the shown month on the day of their date property.
 * Internal to `platform/listing`; loaded on first use of a calendar view.
 */
@Component({
  selector: 'nf-listing-calendar-view',
  standalone: true,
  imports: [ListingCalendarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nf-listing-calendar [month]="month()" [items]="items()" (open)="page.open($event)" (monthChange)="setMonth($event)" />
  `,
  styles: `
    :host { display: contents; }
    nf-listing-calendar { flex: 1 1 auto; min-height: 0; overflow: auto; }
  `,
})
export class ListingCalendarViewComponent {
  protected readonly page = inject(LISTING_PAGE);

  protected readonly month = signal(firstOfMonth(new Date()));
  protected readonly items = signal<ListingCalendarItem<Row>[]>([]);

  constructor() {
    effect(() => {
      if (this.page.loadTick() === 0) return;
      untracked(() => void this.load());
    });
  }

  protected setMonth(month: string): void {
    this.month.set(month);
    void this.load();
  }

  private async load(): Promise<void> {
    const view = this.page.view();
    const date = view.date!;
    const start = this.month();
    const body = await this.page.fetchPage(allOf(this.page.filter(), { [date]: { between: [start, lastOfMonth(start)] } }), 0, ALL);
    const card = view.card ?? [];
    this.items.set(
      rowsOf(body)
        .filter((row) => row[date] != null)
        .map((row) => ({
          id: String(row['id']),
          date: String(row[date]).slice(0, 10),
          title: this.page.text(card[0], row) || String(row['id']),
          subtitle: card[1] ? this.page.text(card[1], row) : undefined,
          row,
        })),
    );
  }
}

function firstOfMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

function lastOfMonth(first: string): string {
  const date = new Date(`${first}T00:00:00`);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`;
}
