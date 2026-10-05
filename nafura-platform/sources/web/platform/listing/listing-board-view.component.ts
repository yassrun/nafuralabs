import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import { PermissionService } from '../../core/security/services/permission.service';
import {
  ListingBoardComponent,
  type ListingBoardColumn,
  type ListingBoardMove,
} from '../../lib/anatomy/components/organisms/listing-board';
import { ConfirmDialogService } from '../../lib/anatomy/components/services/confirm-dialog.service';
import { ToastService } from '../../lib/anatomy/components/services/toast.service';
import type { FormFieldConfig } from '../../lib/anatomy/types';
import { LISTING_PAGE, rowsOf } from './listing-page.context';
import type { Row } from './listing-page.types';
import { allOf } from './listing-properties';

interface LifecycleTransition {
  id: string;
  label?: string;
  from: string[];
  to: string;
  permission?: string;
  system?: boolean;
  requires?: string[];
  approval?: { title?: string } | null;
}

/**
 * The board layout of `nf-listing-page`: one column per value of the grouping property, cards moved by firing the
 * lifecycle transitions. Internal to `platform/listing`; loaded on first use of a board view.
 */
@Component({
  selector: 'nf-listing-board-view',
  standalone: true,
  imports: [ListingBoardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nf-listing-board
      [columns]="columns()"
      [card]="cardKeys"
      [pendingIds]="pending()"
      [moves]="moves()"
      [promptId]="promptId()"
      (open)="page.open($event)"
      (dragRow)="onDrag($event)"
      (dropOn)="onDrop($event)"
      (move)="fireMove($event.row, $event.transition)"
      (ask)="onAsk($event)"
      (more)="more($event)" />
  `,
  styles: `
    :host { display: contents; }
    nf-listing-board { flex: 1 1 auto; min-height: 0; overflow: auto; }
  `,
})
export class ListingBoardViewComponent {
  protected readonly page = inject(LISTING_PAGE);
  private readonly http = inject(HttpClient);
  private readonly permissions = inject(PermissionService);
  private readonly dialogs = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  protected readonly cardKeys = { title: '__title', subtitle: '__subtitle', badge: '__badge', meta: '__meta' };
  protected readonly columns = signal<ListingBoardColumn<Row>[]>([]);
  protected readonly pending = signal<string[]>([]);
  protected readonly moves = signal<ListingBoardMove[]>([]);
  protected readonly promptId = signal<string | null>(null);
  private readonly transitions = signal<LifecycleTransition[]>([]);
  private transitionsRequested = false;

  constructor() {
    effect(() => {
      if (this.page.loadTick() === 0) return;
      untracked(() => void this.load());
    });
  }

  protected onDrag(row: Row | null): void {
    const status = String(row?.['status'] ?? '');
    this.columns.update((columns) =>
      columns.map((column) => ({ ...column, reachable: !!row && this.reachable(status, column.id).length > 0 })),
    );
  }

  protected onDrop(event: { row: Row; to: string }): void {
    const choices = this.reachable(String(event.row['status'] ?? ''), event.to);
    if (choices.length === 0) return;
    if (choices.length === 1) {
      void this.fireMove(event.row, choices[0].id);
      return;
    }
    this.moves.set(choices);
    this.promptId.set(String(event.row['id']));
  }

  protected onAsk(row: Row): void {
    const targets = this.transitions()
      .filter((transition) => this.movesByStatus() && this.canFire(transition, String(row['status'] ?? '')))
      .map((transition) => ({ id: transition.id, label: transition.label || transition.to }));
    this.moves.set(targets);
    this.promptId.set(String(row['id']));
  }

  protected async more(value: string): Promise<void> {
    const column = this.columns().find((item) => item.id === value);
    if (!column) return;
    const page = Math.ceil(column.rows.length / (this.page.config().pageSize ?? 25));
    const body = await this.page.fetchPage(allOf(this.page.filter(), { [this.page.view().groupBy!]: { is: value } }), page);
    const rows = rowsOf(body).map((row) => this.toCard(row));
    this.columns.update((columns) =>
      columns.map((item) =>
        item.id === value
          ? { ...item, rows: [...item.rows, ...rows], total: body.totalElements ?? item.total, hasMore: item.rows.length + rows.length < (body.totalElements ?? 0) }
          : item,
      ),
    );
  }

  protected async fireMove(row: Row, transitionId: string): Promise<void> {
    this.promptId.set(null);
    this.moves.set([]);
    const endpoint = this.page.config().endpoint;
    const transition = this.transitions().find((item) => item.id === transitionId);
    try {
      const updated = await firstValueFrom(this.http.post<Row>(this.page.url(`${endpoint}/${row['id']}/transitions/${transitionId}`), {}));
      if (transition?.approval && updated['status'] === transition.to) {
        this.pending.update((ids) => [...new Set([...ids, String(updated['id'])])]);
      }
      this.toast.success(this.translate.instant('record.transitioned', { state: '' }));
      await this.load();
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 422 && transition?.requires?.length) {
        const filled = await this.askRequired(transition.requires);
        if (!filled) {
          await this.load();
          return;
        }
        try {
          await firstValueFrom(this.http.put(this.page.url(`${endpoint}/${row['id']}`), { ...plain(row), ...filled }));
          await firstValueFrom(this.http.post(this.page.url(`${endpoint}/${row['id']}/transitions/${transitionId}`), {}));
          this.toast.success(this.translate.instant('record.transitioned', { state: '' }));
        } catch (again) {
          this.toast.error(this.page.message(again));
        }
      } else {
        this.toast.error(this.page.message(error));
      }
      await this.load();
    }
  }

  private async load(): Promise<void> {
    if (!this.transitionsRequested) {
      this.transitionsRequested = true;
      void this.loadTransitions();
    }
    const view = this.page.view();
    const property = this.page.properties()[view.groupBy ?? ''];
    const hidden = new Set(view.hide ?? []);
    const values = (property?.values ?? []).filter((value) => !hidden.has(value.id));
    const filter = this.page.filter();
    const columns = await Promise.all(
      values.map(async (value) => {
        const body = await this.page.fetchPage(allOf(filter, { [view.groupBy!]: { is: value.id } }), 0);
        const rows = rowsOf(body).map((row) => this.toCard(row));
        const total = body.totalElements ?? rows.length;
        return { id: value.id, label: value.label, tone: value.tone, total, rows, reachable: false, hasMore: rows.length < total } satisfies ListingBoardColumn<Row>;
      }),
    );
    this.columns.set(columns);
  }

  private async loadTransitions(): Promise<void> {
    if (this.page.properties()['status']?.type !== 'status') return;
    try {
      const lifecycle = await firstValueFrom(
        this.http.get<{ transitions?: LifecycleTransition[] }>(this.page.url(`${this.page.config().endpoint}/lifecycle`)),
      );
      this.transitions.set(lifecycle.transitions ?? []);
    } catch {
      this.transitions.set([]);
    }
  }

  /** A board card: the row plus its formatted texts (title, subtitle, badge, meta). */
  private toCard(row: Row): Row {
    const [title, subtitle, badge, meta] = this.page.view().card ?? [];
    return {
      ...row,
      __title: this.page.text(title, row) || String(row['id']),
      __subtitle: subtitle ? this.page.text(subtitle, row) : undefined,
      __badge: badge ? this.page.text(badge, row) : undefined,
      __meta: meta ? this.page.text(meta, row) : undefined,
    };
  }

  private movesByStatus(): boolean {
    return this.page.view().layout === 'board' && this.page.view().groupBy === 'status';
  }

  private reachable(from: string, to: string): ListingBoardMove[] {
    if (!this.movesByStatus()) return [];
    return this.transitions()
      .filter((transition) => this.canFire(transition, from) && transition.to === to)
      .map((transition) => ({ id: transition.id, label: transition.label || transition.to }));
  }

  private canFire(transition: LifecycleTransition, from: string): boolean {
    return !transition.system && (transition.from ?? []).includes(from) && !!transition.permission && this.permissions.hasPermission(transition.permission);
  }

  private async askRequired(fields: string[]): Promise<Record<string, unknown> | null> {
    const form: FormFieldConfig[] = fields.map((field) => {
      const property = this.page.properties()[field];
      const numeric = property?.type === 'number' || property?.type === 'money';
      return {
        key: field,
        field,
        label: property?.label ?? field,
        type: numeric ? 'number' : property?.type === 'date' ? 'date' : 'text',
        required: true,
      } as FormFieldConfig;
    });
    const labels = form.map((field) => field.label).join(', ');
    return this.dialogs.form({ title: this.translate.instant('record.requiredFields', { fields: labels }), fields: form });
  }
}

/** A row without the board's formatted texts, to send back to the API. */
function plain(row: Row): Row {
  const { __title, __subtitle, __badge, __meta, ...rest } = row;
  return rest;
}
