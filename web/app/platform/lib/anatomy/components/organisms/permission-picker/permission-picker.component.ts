import { Component, input, output, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

import type { PermissionGroup } from './permission-picker.types';

interface CategoryNode {
  id: string;
  label: string;
  /** All permission codes in this category */
  codes: string[];
}

interface DomainNode {
  id: string;
  label: string;
  categories: CategoryNode[];
  /** All permission codes in this domain */
  allCodes: string[];
}

type CheckState = 'checked' | 'unchecked' | 'indeterminate';

@Component({
  selector: 'nf-permission-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Top bar: search + selected count -->
    <div class="nf-pp__topbar">
      <input
        class="nf-pp__search"
        type="text"
        placeholder="Search permissions..."
        [value]="searchQuery()"
        [disabled]="disabled()"
        (input)="searchQuery.set($any($event).target.value)"
      />
      <span class="nf-pp__count">{{ selectedCount() }} permissions selected</span>
    </div>

    <!-- Domain accordion -->
    @for (domain of filteredTree(); track domain.id) {
      <div class="nf-pp__domain">
        <!-- Domain header row -->
        <div class="nf-pp__domain-header" (click)="toggleExpand(domain.id)">
          <input
            type="checkbox"
            class="nf-pp__cb"
            [checked]="domainState(domain) === 'checked'"
            [indeterminate]="domainState(domain) === 'indeterminate'"
            [disabled]="disabled()"
            (change)="toggleDomain(domain, $event)"
            (click)="$event.stopPropagation()"
          />
          <span class="nf-pp__domain-label">{{ domain.label }}</span>
          <div class="nf-pp__bulk-actions">
            <button
              type="button"
              class="nf-pp__bulk-btn"
              [disabled]="disabled()"
              (click)="selectAllDomain(domain); $event.stopPropagation()">
              Select All
            </button>
            <button
              type="button"
              class="nf-pp__bulk-btn"
              [disabled]="disabled()"
              (click)="clearDomain(domain); $event.stopPropagation()">
              Clear
            </button>
          </div>
          <span class="nf-pp__chevron" [class.nf-pp__chevron--open]="isExpanded(domain.id)">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 4L6 8L10 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
        </div>

        <!-- Categories (shown when domain expanded) -->
        @if (isExpanded(domain.id)) {
          @for (cat of domain.categories; track cat.id) {
            <div class="nf-pp__category">
              <div class="nf-pp__category-header">
                <input
                  type="checkbox"
                  class="nf-pp__cb"
                  [checked]="categoryState(cat) === 'checked'"
                  [indeterminate]="categoryState(cat) === 'indeterminate'"
                  [disabled]="disabled()"
                  (change)="toggleCategory(cat, $event)"
                />
                <span class="nf-pp__category-label">{{ cat.label }}</span>
              </div>
              <!-- Action checkboxes (leaf level) -->
              <div class="nf-pp__actions-row">
                @for (code of cat.codes; track code) {
                  <label
                    class="nf-pp__action-item"
                    [class.nf-pp__action-item--disabled]="disabled()">
                    <input
                      type="checkbox"
                      class="nf-pp__cb"
                      [checked]="isSelected(code)"
                      [disabled]="disabled()"
                      (change)="toggleCode(code, $event)"
                    />
                    <span>{{ actionLabel(code) }}</span>
                  </label>
                }
              </div>
            </div>
          }
        }
      </div>
    }

    @if (filteredTree().length === 0) {
      <p class="nf-pp__empty">No permissions found.</p>
    }
  `,
  styles: [`
    :host { display: block; }

    .nf-pp__topbar {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.75rem;
    }

    .nf-pp__search {
      flex: 1;
      padding: 0.375rem 0.625rem;
      font-size: 0.875rem;
      border: 1px solid var(--nf-border-default, #e5e7eb);
      border-radius: 0.375rem;
      outline: none;
    }
    .nf-pp__search:focus { border-color: var(--nf-primary, #6366f1); box-shadow: 0 0 0 2px rgba(99,102,241,0.15); }
    .nf-pp__search:disabled { background: var(--nf-bg-disabled, #f9fafb); cursor: not-allowed; }

    .nf-pp__count {
      font-size: 0.8125rem;
      color: var(--nf-text-muted, #6b7280);
      white-space: nowrap;
    }

    .nf-pp__domain {
      border: 1px solid var(--nf-border-default, #e5e7eb);
      border-radius: 0.5rem;
      margin-bottom: 0.5rem;
      overflow: hidden;
    }

    .nf-pp__domain-header {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.625rem 0.875rem;
      background: var(--nf-bg-secondary, #f9fafb);
      cursor: pointer;
      user-select: none;
    }
    .nf-pp__domain-header:hover { background: var(--nf-bg-hover, #f3f4f6); }

    .nf-pp__domain-label {
      flex: 1;
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--nf-text-primary, #111827);
    }

    .nf-pp__bulk-actions { display: flex; gap: 0.375rem; }

    .nf-pp__bulk-btn {
      padding: 0.125rem 0.5rem;
      font-size: 0.75rem;
      border: 1px solid var(--nf-border-default, #e5e7eb);
      border-radius: 0.25rem;
      background: white;
      cursor: pointer;
      color: var(--nf-text-secondary, #374151);
    }
    .nf-pp__bulk-btn:hover:not(:disabled) { background: var(--nf-bg-hover, #f3f4f6); }
    .nf-pp__bulk-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .nf-pp__chevron {
      color: var(--nf-text-muted, #6b7280);
      transition: transform 0.15s ease;
    }
    .nf-pp__chevron--open { transform: rotate(180deg); }

    .nf-pp__category {
      padding: 0.5rem 0.875rem 0.625rem 2rem;
      border-top: 1px solid var(--nf-border-subtle, #f3f4f6);
    }

    .nf-pp__category-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.375rem;
    }

    .nf-pp__category-label {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--nf-text-secondary, #374151);
    }

    .nf-pp__actions-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem 0.75rem;
      padding-left: 1.375rem;
    }

    .nf-pp__action-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.8125rem;
      color: var(--nf-text-secondary, #374151);
      cursor: pointer;
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
    }
    .nf-pp__action-item:hover:not(.nf-pp__action-item--disabled) { background: var(--nf-bg-hover, #f3f4f6); }
    .nf-pp__action-item--disabled { opacity: 0.75; cursor: not-allowed; }

    .nf-pp__cb { cursor: pointer; accent-color: var(--nf-primary, #6366f1); }

    .nf-pp__empty {
      font-size: 0.875rem;
      color: var(--nf-text-muted, #6b7280);
      text-align: center;
      padding: 1.5rem;
      margin: 0;
    }
  `],
})
export class PermissionPickerComponent {
  readonly catalog = input<PermissionGroup[]>([]);
  readonly selected = input<string[]>([]);
  readonly disabled = input(false);

  readonly selectionChange = output<string[]>();

  readonly searchQuery = signal('');

  /** Locally managed selection state, synced from the `selected` input */
  private readonly selectedSet = signal<Set<string>>(new Set());

  constructor() {
    // Sync selection from parent input whenever it changes
    effect(() => {
      this.selectedSet.set(new Set(this.selected()));
    }, { allowSignalWrites: true });
  }

  readonly selectedCount = computed(() => this.selectedSet().size);

  // ─── Build internal domain tree from catalog ────────────────────────────────

  private readonly domainTree = computed((): DomainNode[] => {
    return this.catalog().map((group) => {
      const catMap = new Map<string, string[]>();
      for (const p of group.permissions ?? []) {
        const cat = p.category ?? 'other';
        if (!catMap.has(cat)) catMap.set(cat, []);
        catMap.get(cat)!.push(p.code);
      }
      const categories: CategoryNode[] = Array.from(catMap.entries()).map(
        ([cat, codes]) => ({
          id: `${group.moduleId}.${cat}`,
          label: humanize(cat),
          codes,
        })
      );
      return {
        id: group.moduleId,
        label: group.name || humanize(group.moduleId),
        categories,
        allCodes: (group.permissions ?? []).map((p) => p.code),
      };
    });
  });

  readonly filteredTree = computed((): DomainNode[] => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.domainTree();
    return this.domainTree()
      .map((domain): DomainNode | null => {
        const domainMatches = domain.label.toLowerCase().includes(q);
        const cats = domain.categories.filter(
          (cat) =>
            domainMatches ||
            cat.label.toLowerCase().includes(q) ||
            cat.codes.some((code) => code.toLowerCase().includes(q))
        );
        if (cats.length === 0) return null;
        return { ...domain, categories: cats };
      })
      .filter((d): d is DomainNode => d !== null);
  });

  // ─── Expand/collapse state ──────────────────────────────────────────────────

  private readonly expandedDomainIds = signal<Set<string>>(new Set());

  isExpanded(domainId: string): boolean {
    return this.expandedDomainIds().has(domainId);
  }

  toggleExpand(domainId: string): void {
    this.expandedDomainIds.update((s) => {
      const next = new Set(s);
      if (next.has(domainId)) next.delete(domainId);
      else next.add(domainId);
      return next;
    });
  }

  // ─── State helpers ──────────────────────────────────────────────────────────

  isSelected(code: string): boolean {
    return this.selectedSet().has(code);
  }

  domainState(domain: DomainNode): CheckState {
    return checkState(domain.allCodes, this.selectedSet());
  }

  categoryState(cat: CategoryNode): CheckState {
    return checkState(cat.codes, this.selectedSet());
  }

  // ─── Toggle handlers ────────────────────────────────────────────────────────

  toggleDomain(domain: DomainNode, event: Event): void {
    if (this.disabled()) { event.preventDefault(); return; }
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedSet.update((s) => {
      const next = new Set(s);
      domain.allCodes.forEach((c) => (checked ? next.add(c) : next.delete(c)));
      return next;
    });
    this.emit();
  }

  toggleCategory(cat: CategoryNode, event: Event): void {
    if (this.disabled()) { event.preventDefault(); return; }
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedSet.update((s) => {
      const next = new Set(s);
      cat.codes.forEach((c) => (checked ? next.add(c) : next.delete(c)));
      return next;
    });
    this.emit();
  }

  toggleCode(code: string, event: Event): void {
    if (this.disabled()) { event.preventDefault(); return; }
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedSet.update((s) => {
      const next = new Set(s);
      checked ? next.add(code) : next.delete(code);
      return next;
    });
    this.emit();
  }

  selectAllDomain(domain: DomainNode): void {
    if (this.disabled()) return;
    this.selectedSet.update((s) => {
      const next = new Set(s);
      domain.allCodes.forEach((c) => next.add(c));
      return next;
    });
    this.emit();
  }

  clearDomain(domain: DomainNode): void {
    if (this.disabled()) return;
    this.selectedSet.update((s) => {
      const next = new Set(s);
      domain.allCodes.forEach((c) => next.delete(c));
      return next;
    });
    this.emit();
  }

  // ─── Action label ───────────────────────────────────────────────────────────

  actionLabel(code: string): string {
    const parts = code.split('.');
    return humanize(parts[parts.length - 1] ?? code);
  }

  // ─── Emit ───────────────────────────────────────────────────────────────────

  private emit(): void {
    this.selectionChange.emit(Array.from(this.selectedSet()));
  }
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function humanize(str: string): string {
  return str
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function checkState(codes: string[], selected: Set<string>): CheckState {
  if (codes.length === 0) return 'unchecked';
  const count = codes.filter((c) => selected.has(c)).length;
  if (count === 0) return 'unchecked';
  if (count === codes.length) return 'checked';
  return 'indeterminate';
}
