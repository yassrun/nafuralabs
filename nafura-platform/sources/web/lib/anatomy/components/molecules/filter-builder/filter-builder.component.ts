import { Component, input, output, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import type {
  FilterClause,
  FilterCombinator,
  FilterFieldConfig,
  FilterGroup,
  FilterNode,
  FilterOperator,
  LookupContext,
} from '../../../types';
import { isFilterGroup } from '../../../types';
import { ButtonComponent } from '../../atoms/button';
import {
  defaultOperatorForFilterType,
  emptyFilterGroup,
  FILTER_OPERATOR_LABELS,
  operatorsForFilterType,
} from '../../organisms/listing-flat/listing-query-state.util';

/**
 * Filter Builder (`nf-filter-builder`) — Notion-style rule builder.
 *
 * Rows: Property · Operator · Value. Groups support AND/OR with one nesting level.
 * Apply emits a {@link FilterGroup}; Clear emits empty group via `clear`.
 */
@Component({
  selector: 'nf-filter-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ButtonComponent],
  template: `
    <div class="nf-filter-builder" (click)="$event.stopPropagation()">
      <div class="nf-filter-builder__header">{{ 'Filters' | translate }}</div>

      @if (draft().children.length === 0) {
        <p class="nf-filter-builder__empty">{{ 'No filters yet' | translate }}</p>
      } @else {
        <div class="nf-filter-builder__rows">
          @for (child of draft().children; track $index; let i = $index) {
            @if (i > 0) {
              <div class="nf-filter-builder__combinator">
                @if (advanced()) {
                  <select
                    class="nf-filter-builder__combinator-select"
                    [ngModel]="draft().combinator"
                    (ngModelChange)="setRootCombinator($event)"
                  >
                    <option value="and">AND</option>
                    <option value="or">OR</option>
                  </select>
                } @else {
                  <span class="nf-filter-builder__combinator--nested">{{ 'and' | translate }}</span>
                }
              </div>
            }

            @if (isGroup(child)) {
              <div class="nf-filter-builder__group">
                <div class="nf-filter-builder__group-head">
                  <span class="nf-filter-builder__group-label">{{ 'Group' | translate }}</span>
                  <select
                    class="nf-filter-builder__combinator-select"
                    [ngModel]="child.combinator"
                    (ngModelChange)="setNestedCombinator(i, $event)"
                  >
                    <option value="and">AND</option>
                    <option value="or">OR</option>
                  </select>
                  <button type="button" class="nf-filter-builder__icon-btn" (click)="removeRootChild(i)" aria-label="Remove group">
                    ×
                  </button>
                </div>
                @for (nested of child.children; track $index; let j = $index) {
                  @if (j > 0) {
                    <div class="nf-filter-builder__combinator nf-filter-builder__combinator--nested">
                      {{ child.combinator === 'or' ? 'OR' : 'AND' }}
                    </div>
                  }
                  @if (!isGroup(nested)) {
                    <ng-container
                      *ngTemplateOutlet="clauseRow; context: { $implicit: nested, rootIndex: i, nestedIndex: j }"
                    />
                  }
                }
                <button type="button" class="nf-filter-builder__link" (click)="addNestedClause(i)">
                  + {{ 'Add filter' | translate }}
                </button>
              </div>
            } @else {
              <ng-container
                *ngTemplateOutlet="clauseRow; context: { $implicit: child, rootIndex: i, nestedIndex: null }"
              />
            }
          }
        </div>
      }

      <div class="nf-filter-builder__toolbar">
        <button type="button" class="nf-filter-builder__link" (click)="addRootClause()">
          + {{ 'Add filter' | translate }}
        </button>
        @if (advanced()) {
          <button type="button" class="nf-filter-builder__link" (click)="addRootGroup()">
            + {{ 'Add filter group' | translate }}
          </button>
        }
      </div>

      <div class="nf-filter-builder__actions">
        <nf-button variant="secondary" size="xs" (clicked)="onClear()">{{ 'Clear' | translate }}</nf-button>
        <nf-button variant="primary" size="xs" (clicked)="onApply()">{{ 'Apply' | translate }}</nf-button>
      </div>
    </div>

    <ng-template #clauseRow let-clause let-rootIndex="rootIndex" let-nestedIndex="nestedIndex">
      <div class="nf-filter-builder__row">
        <select
          class="nf-filter-field__control nf-filter-field__control--select nf-filter-builder__prop"
          [ngModel]="clause.field"
          (ngModelChange)="setClauseField(rootIndex, nestedIndex, $event)"
        >
          @for (f of fields(); track f.key) {
            <option [ngValue]="f.key">{{ f.label | translate }}</option>
          }
        </select>
        @if (advanced()) {
          <select
            class="nf-filter-field__control nf-filter-field__control--select nf-filter-builder__op"
            [ngModel]="clause.op"
            (ngModelChange)="setClauseOp(rootIndex, nestedIndex, $event)"
          >
            @for (op of opsForField(clause.field); track op) {
              <option [ngValue]="op">{{ opLabel(op) }}</option>
            }
          </select>
        }
        @if (!isUnary(clause.op)) {
          @if (clause.op === 'between') {
            <div class="nf-filter-builder__between">
              <input
                class="nf-filter-field__control"
                [type]="valueInputType(clause.field)"
                [ngModel]="betweenPart(clause, 0)"
                (ngModelChange)="setBetweenPart(rootIndex, nestedIndex, 0, $event)"
              />
              <span>—</span>
              <input
                class="nf-filter-field__control"
                [type]="valueInputType(clause.field)"
                [ngModel]="betweenPart(clause, 1)"
                (ngModelChange)="setBetweenPart(rootIndex, nestedIndex, 1, $event)"
              />
            </div>
          } @else if (fieldOf(clause.field)?.type === 'select' || fieldOf(clause.field)?.type === 'multiselect') {
            <select
              class="nf-filter-field__control nf-filter-field__control--select nf-filter-builder__value"
              [ngModel]="clause.value"
              (ngModelChange)="setClauseValue(rootIndex, nestedIndex, $event)"
            >
              <option [ngValue]="null">{{ 'All' | translate }}</option>
              @for (opt of fieldOf(clause.field)?.options ?? []; track opt.value) {
                <option [ngValue]="opt.value">{{ opt.label | translate }}</option>
              }
            </select>
          } @else if (fieldOf(clause.field)?.type === 'boolean') {
            <select
              class="nf-filter-field__control nf-filter-field__control--select nf-filter-builder__value"
              [ngModel]="clause.value"
              (ngModelChange)="setClauseValue(rootIndex, nestedIndex, $event)"
            >
              <option [ngValue]="null">{{ 'All' | translate }}</option>
              <option [ngValue]="true">{{ 'Yes' | translate }}</option>
              <option [ngValue]="false">{{ 'No' | translate }}</option>
            </select>
          } @else {
            <input
              class="nf-filter-field__control nf-filter-builder__value"
              [type]="valueInputType(clause.field)"
              [ngModel]="clause.value"
              (ngModelChange)="setClauseValue(rootIndex, nestedIndex, $event)"
              [placeholder]="(fieldOf(clause.field)?.placeholder ?? fieldOf(clause.field)?.label ?? '') | translate"
            />
          }
        }
        <button
          type="button"
          class="nf-filter-builder__icon-btn"
          (click)="removeClause(rootIndex, nestedIndex)"
          aria-label="Remove filter"
        >
          ×
        </button>
      </div>
    </ng-template>
  `,
  styles: [
    `
      .nf-filter-builder {
        display: flex;
        flex-direction: column;
        gap: 0;
        padding: 12px 14px;
        width: max-content;
        min-width: 420px;
        max-width: min(640px, calc(100vw - 32px));
        box-sizing: border-box;
        background: var(--nf-surface-section, #ffffff);
      }
      .nf-filter-builder__header {
        margin: 0 0 10px;
        padding: 0 0 8px;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--nf-text-primary, #111827);
        border-bottom: 1px solid var(--nf-border-default, #e5e7eb);
      }
      .nf-filter-builder__empty {
        margin: 0 0 10px;
        font-size: 0.8125rem;
        color: var(--nf-text-muted, #6b7280);
      }
      .nf-filter-builder__rows {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 10px;
      }
      .nf-filter-builder__row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
      }
      .nf-filter-builder__prop {
        min-width: 120px;
        width: auto;
        flex: 0 1 140px;
      }
      .nf-filter-builder__op {
        min-width: 100px;
        width: auto;
        flex: 0 1 120px;
      }
      .nf-filter-builder__value {
        min-width: 120px;
        flex: 1 1 140px;
      }
      .nf-filter-builder__between {
        display: flex;
        align-items: center;
        gap: 6px;
        flex: 1 1 220px;
        min-width: 200px;
      }
      .nf-filter-builder__between .nf-filter-field__control {
        flex: 1;
        min-width: 0;
        width: auto;
      }
      .nf-filter-field__control {
        height: 30px;
        padding: 0 8px;
        font-size: 0.8125rem;
        font-family: inherit;
        color: var(--nf-text-primary, #111827);
        background: var(--nf-surface-section, #ffffff);
        border: 1px solid var(--nf-border-default, #e5e7eb);
        border-radius: 6px;
        box-sizing: border-box;
        outline: none;
      }
      .nf-filter-field__control--select {
        cursor: pointer;
        appearance: none;
        padding-right: 22px;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
        background-position: right 6px center;
        background-repeat: no-repeat;
      }
      .nf-filter-builder__combinator {
        display: flex;
        align-items: center;
        padding-left: 2px;
      }
      .nf-filter-builder__combinator--nested {
        font-size: 0.7rem;
        font-weight: 600;
        color: var(--nf-primary, #2563eb);
        padding: 2px 0 2px 8px;
      }
      .nf-filter-builder__combinator-select {
        height: 24px;
        padding: 0 6px;
        font-size: 0.7rem;
        font-weight: 600;
        color: var(--nf-primary, #2563eb);
        border: 1px solid var(--nf-border-default, #e5e7eb);
        border-radius: 4px;
        background: var(--nf-primary-light, #eff6ff);
        cursor: pointer;
      }
      .nf-filter-builder__group {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 8px;
        border: 1px solid var(--nf-border-default, #e5e7eb);
        border-radius: 8px;
        background: var(--nf-color-gray-50, #f9fafb);
      }
      .nf-filter-builder__group-head {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .nf-filter-builder__group-label {
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--nf-text-muted, #6b7280);
      }
      .nf-filter-builder__icon-btn {
        width: 24px;
        height: 24px;
        border: none;
        border-radius: 4px;
        background: transparent;
        color: var(--nf-text-muted, #9ca3af);
        cursor: pointer;
        font-size: 16px;
        line-height: 1;
        flex: 0 0 auto;
      }
      .nf-filter-builder__icon-btn:hover {
        background: var(--nf-color-gray-200, #e5e7eb);
        color: var(--nf-text-primary, #111827);
      }
      .nf-filter-builder__toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: 10px;
      }
      .nf-filter-builder__link {
        border: none;
        background: none;
        padding: 0;
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--nf-primary, #2563eb);
        cursor: pointer;
        font-family: inherit;
      }
      .nf-filter-builder__link:hover {
        text-decoration: underline;
      }
      .nf-filter-builder__actions {
        display: flex;
        justify-content: flex-end;
        gap: 6px;
        padding-top: 10px;
        border-top: 1px solid var(--nf-border-default, #e5e7eb);
      }
    `,
  ],
})
export class FilterBuilderComponent {
  /** Field configs available for property picker. */
  filters = input.required<FilterFieldConfig[]>();
  /** @deprecated Prefer `group` — kept for older call sites. */
  values = input<Record<string, unknown>>({});
  lookups = input<LookupContext>({});
  /** Active filter tree. */
  group = input<FilterGroup | null>(null);
  /** Bump when menu opens to resync draft. */
  openCount = input(0);
  /** False: no operator choice, no OR / groups — each row is `field = value`. */
  advanced = input(true);

  /** Emits FilterGroup on Apply. */
  apply = output<FilterGroup>();
  /** Emits when Clear is clicked. */
  clear = output<void>();

  readonly draft = signal<FilterGroup>(emptyFilterGroup());

  readonly fields = computed(() => this.filters());

  constructor() {
    effect(() => {
      this.openCount();
      const incoming = this.group();
      if (incoming) {
        this.draft.set(structuredClone(incoming));
        return;
      }
      // Legacy: build AND group of eq clauses from values map
      const vals = this.values();
      const fields = this.filters();
      const children: FilterClause[] = [];
      for (const f of fields) {
        const v = vals[f.key];
        if (v === undefined || v === null || v === '') continue;
        children.push({ field: f.key, op: defaultOperatorForFilterType(f.type), value: v });
      }
      this.draft.set({ combinator: 'and', children });
    });
  }

  isGroup(node: FilterNode): node is FilterGroup {
    return isFilterGroup(node);
  }

  fieldOf(key: string): FilterFieldConfig | undefined {
    return this.fields().find((f) => f.key === key);
  }

  opsForField(key: string): FilterOperator[] {
    const field = this.fieldOf(key);
    return field?.operators ?? operatorsForFilterType(field?.type);
  }

  opLabel(op: FilterOperator): string {
    return FILTER_OPERATOR_LABELS[op] ?? op;
  }

  isUnary(op: FilterOperator): boolean {
    return op === 'isEmpty' || op === 'isNotEmpty';
  }

  valueInputType(fieldKey: string): string {
    const t = this.fieldOf(fieldKey)?.type;
    if (t === 'number') return 'number';
    if (t === 'date' || t === 'daterange') return 'date';
    return 'text';
  }

  betweenPart(clause: FilterClause, index: 0 | 1): string {
    const v = clause.value;
    if (!Array.isArray(v)) return '';
    return v[index] != null ? String(v[index]) : '';
  }

  private defaultClause(): FilterClause {
    const first = this.fields()[0];
    const field = first?.key ?? 'id';
    const op = defaultOperatorForFilterType(first?.type);
    return { field, op, value: this.isUnary(op) ? undefined : '' };
  }

  addRootClause(): void {
    this.draft.update((g) => ({ ...g, children: [...g.children, this.defaultClause()] }));
  }

  addRootGroup(): void {
    this.draft.update((g) => ({
      ...g,
      children: [...g.children, { combinator: 'or' as const, children: [this.defaultClause()] }],
    }));
  }

  addNestedClause(rootIndex: number): void {
    this.draft.update((g) => {
      const children = [...g.children];
      const node = children[rootIndex];
      if (!isFilterGroup(node)) return g;
      children[rootIndex] = { ...node, children: [...node.children, this.defaultClause()] };
      return { ...g, children };
    });
  }

  removeRootChild(index: number): void {
    this.draft.update((g) => ({
      ...g,
      children: g.children.filter((_, i) => i !== index),
    }));
  }

  removeClause(rootIndex: number, nestedIndex: number | null): void {
    this.draft.update((g) => {
      const children = [...g.children];
      if (nestedIndex == null) {
        children.splice(rootIndex, 1);
        return { ...g, children };
      }
      const node = children[rootIndex];
      if (!isFilterGroup(node)) return g;
      const nested = [...node.children];
      nested.splice(nestedIndex, 1);
      if (nested.length === 0) {
        children.splice(rootIndex, 1);
      } else {
        children[rootIndex] = { ...node, children: nested };
      }
      return { ...g, children };
    });
  }

  setRootCombinator(combinator: FilterCombinator): void {
    this.draft.update((g) => ({ ...g, combinator }));
  }

  setNestedCombinator(rootIndex: number, combinator: FilterCombinator): void {
    this.draft.update((g) => {
      const children = [...g.children];
      const node = children[rootIndex];
      if (!isFilterGroup(node)) return g;
      children[rootIndex] = { ...node, combinator };
      return { ...g, children };
    });
  }

  private updateClause(
    rootIndex: number,
    nestedIndex: number | null,
    patch: Partial<FilterClause>
  ): void {
    this.draft.update((g) => {
      const children = [...g.children];
      if (nestedIndex == null) {
        const node = children[rootIndex];
        if (isFilterGroup(node)) return g;
        children[rootIndex] = { ...node, ...patch };
        return { ...g, children };
      }
      const group = children[rootIndex];
      if (!isFilterGroup(group)) return g;
      const nested = [...group.children];
      const leaf = nested[nestedIndex];
      if (isFilterGroup(leaf)) return g;
      nested[nestedIndex] = { ...leaf, ...patch };
      children[rootIndex] = { ...group, children: nested };
      return { ...g, children };
    });
  }

  setClauseField(rootIndex: number, nestedIndex: number | null, field: string): void {
    const cfg = this.fieldOf(field);
    const op = defaultOperatorForFilterType(cfg?.type);
    this.updateClause(rootIndex, nestedIndex, {
      field,
      op,
      value: this.isUnary(op) ? undefined : '',
    });
  }

  setClauseOp(rootIndex: number, nestedIndex: number | null, op: FilterOperator): void {
    this.updateClause(rootIndex, nestedIndex, {
      op,
      value: this.isUnary(op) ? undefined : '',
    });
  }

  setClauseValue(rootIndex: number, nestedIndex: number | null, value: unknown): void {
    this.updateClause(rootIndex, nestedIndex, { value });
  }

  setBetweenPart(rootIndex: number, nestedIndex: number | null, index: 0 | 1, part: string): void {
    const g = this.draft();
    const node = g.children[rootIndex];
    let clause: FilterClause | null = null;
    if (nestedIndex == null) {
      clause = isFilterGroup(node) ? null : node;
    } else if (isFilterGroup(node)) {
      const leaf = node.children[nestedIndex];
      clause = isFilterGroup(leaf) ? null : leaf;
    }
    if (!clause) return;
    const current: [string, string] = [
      Array.isArray(clause.value) && clause.value[0] != null ? String(clause.value[0]) : '',
      Array.isArray(clause.value) && clause.value[1] != null ? String(clause.value[1]) : '',
    ];
    current[index] = part;
    this.updateClause(rootIndex, nestedIndex, { value: current });
  }

  onApply(): void {
    this.apply.emit(structuredClone(this.draft()));
  }

  onClear(): void {
    this.draft.set(emptyFilterGroup());
    this.clear.emit();
  }
}
