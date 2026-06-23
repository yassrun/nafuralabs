import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import type { Compte, CompteTreeNode } from '../../models';
import { ButtonComponent } from '@lib/anatomy/components';


const CLASSE_KEYS: Record<number, string> = {
  1: 'finance.planComptable.cgnc.classe1',
  2: 'finance.planComptable.cgnc.classe2',
  3: 'finance.planComptable.cgnc.classe3',
  4: 'finance.planComptable.cgnc.classe4',
  5: 'finance.planComptable.cgnc.classe5',
  6: 'finance.planComptable.cgnc.classe6',
  7: 'finance.planComptable.cgnc.classe7',
};

function buildTree(comptes: Compte[]): CompteTreeNode[] {
  const sorted = [...comptes].sort((a, b) => a.code.localeCompare(b.code));
  const byCode = new Map<string, CompteTreeNode>();
  for (const compte of sorted) {
    byCode.set(compte.code, { compte, children: [] });
  }
  const roots: CompteTreeNode[] = [];
  for (const node of byCode.values()) {
    const parent = node.compte.parentCompteCode
      ? byCode.get(node.compte.parentCompteCode)
      : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

@Component({
  selector: 'app-compte-tree-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tree">
      <div class="tree__toolbar">
        <input
          type="text"
          [attr.placeholder]="'finance.planComptable.tree.searchPlaceholder' | translate"
          [ngModel]="search()"
          (ngModelChange)="search.set($event)" />
        <div class="tree__actions">
          <nf-button variant="primary" class="tree__btn" (clicked)="expandAll()">{{ 'finance.planComptable.tree.expandAll' | translate }}</nf-button>
          <nf-button variant="primary" class="tree__btn" (clicked)="collapseAll()">{{ 'finance.planComptable.tree.collapseAll' | translate }}</nf-button>
        </div>
      </div>

      <div class="tree__body">
        @for (root of filteredRoots(); track root.compte.code) {
          <ng-container *ngTemplateOutlet="nodeTpl; context: { node: root, depth: 0 }" />
        } @empty {
          <div class="tree__empty">{{ 'finance.planComptable.tree.emptySearch' | translate }}</div>
        }
      </div>
    </div>

    <ng-template #nodeTpl let-node="node" let-depth="depth">
      <div
        class="tree__node"
        [class.tree__node--auxiliaire]="node.compte.isAuxiliaire"
        [class.tree__node--collectif]="node.compte.isCollectif"
        [class.tree__node--selected]="selectedCode() === node.compte.code"
        [style.--depth]="depth">
        <nf-button variant="primary" class="tree__caret" (clicked)="toggle(node.compte.code)"  [disabled]="!node.children.length">
          @if (node.children.length) {
            {{ expanded().has(node.compte.code) ? '▾' : '▸' }}
          } @else {
            ·
          }
        </nf-button>
        <span class="tree__icon" [attr.data-classe]="node.compte.classe">
          {{ getClasseEmoji(node.compte.classe) }}
        </span>
        <nf-button variant="primary" class="tree__label" (clicked)="onPick(node.compte)">
          @if (depth === 0) {
            <strong>{{ classeLabel(node.compte.classe) }}</strong>
          } @else {
            <span class="tree__code">{{ node.compte.code }}</span>
            <span class="tree__libelle">{{ node.compte.libelle }}</span>
          }
        </nf-button>
        @if (node.compte.isCollectif) {
          <span class="tree__tag tree__tag--collectif">{{ 'finance.planComptable.tags.collectif' | translate }}</span>
        }
        @if (node.compte.isLettrable) {
          <span class="tree__tag tree__tag--lettrable">{{ 'finance.planComptable.tags.lettrable' | translate }}</span>
        }
        @if (node.compte.axeAnalytiqueObligatoire) {
          <span class="tree__tag tree__tag--analytique">{{ 'finance.planComptable.tags.analytique' | translate }}</span>
        }
        @if ((node.compte.nbEcritures ?? 0) > 0) {
          <span class="tree__count" [title]="'finance.planComptable.tree.ecritureCount' | translate: { count: node.compte.nbEcritures }">
            {{ node.compte.nbEcritures }}
          </span>
        }
        @if (!node.compte.isActive) {
          <span class="tree__tag tree__tag--inactive">{{ 'finance.planComptable.tags.inactive' | translate }}</span>
        }
      </div>
      @if (expanded().has(node.compte.code) && node.children.length) {
        @for (child of node.children; track child.compte.code) {
          <ng-container
            *ngTemplateOutlet="nodeTpl; context: { node: child, depth: depth + 1 }" />
        }
      }
    </ng-template>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .tree {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .tree__toolbar {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .tree__toolbar input {
        flex: 1;
        padding: 6px 10px;
        border: 1px solid var(--nf-color-primary-200);
        border-radius: 6px;
        font-size: 13px;
      }
      .tree__actions {
        display: flex;
        gap: 4px;
      }
      .tree__btn {
        font-size: 12px;
        padding: 5px 10px;
        background: var(--nf-color-surface);
        border: 1px solid var(--nf-color-primary-200);
        border-radius: 6px;
        color: var(--nf-color-primary-700);
        cursor: pointer;
      }
      .tree__btn:hover {
        background: var(--nf-color-primary-50);
      }
      .tree__body {
        max-height: 70vh;
        overflow: auto;
        border: 1px solid var(--nf-color-border);
        border-radius: 8px;
        background: var(--nf-color-surface);
      }
      .tree__empty {
        padding: 24px;
        text-align: center;
        color: var(--nf-color-text-muted);
        font-size: 13px;
      }
      .tree__node {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 8px 4px calc(8px + var(--depth, 0) * 16px);
        font-size: 13px;
        border-bottom: 1px solid var(--nf-color-bg-muted);
        background: var(--nf-color-surface);
        position: relative;
      }
      .tree__node:hover {
        background: var(--nf-color-bg-subtle);
      }
      .tree__node--selected {
        background: var(--nf-color-primary-50);
      }
      .tree__node--auxiliaire {
        background: var(--nf-color-primary-50);
      }
      .tree__node--auxiliaire:hover {
        background: var(--nf-color-primary-50);
      }
      .tree__node--collectif .tree__libelle {
        font-weight: 600;
      }
      .tree__caret {
        width: 18px;
        background: transparent;
        border: 0;
        color: var(--nf-color-text-secondary);
        cursor: pointer;
        font-size: 11px;
      }
      .tree__caret:disabled {
        cursor: default;
        color: var(--nf-color-primary-200);
      }
      .tree__icon {
        font-size: 12px;
        width: 16px;
        text-align: center;
      }
      .tree__label {
        flex: 1;
        text-align: left;
        background: transparent;
        border: 0;
        padding: 0;
        cursor: pointer;
        display: flex;
        gap: 8px;
        align-items: baseline;
        color: inherit;
      }
      .tree__code {
        font-family: ui-monospace, 'SFMono-Regular', Menlo, monospace;
        font-weight: 600;
        color: var(--nf-color-primary-700);
        min-width: 80px;
      }
      .tree__libelle {
        color: var(--nf-text-primary);
      }
      .tree__tag {
        font-size: 10px;
        padding: 1px 6px;
        border-radius: 999px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 600;
      }
      .tree__tag--collectif {
        background: var(--nf-color-warning-100);
        color: var(--nf-color-warning-800);
      }
      .tree__tag--lettrable {
        background: var(--nf-color-primary-200);
        color: var(--nf-color-primary-900);
      }
      .tree__tag--analytique {
        background: var(--nf-color-success-100);
        color: var(--nf-color-success-800);
      }
      .tree__tag--inactive {
        background: var(--nf-color-danger-100);
        color: var(--nf-color-danger-800);
      }
      .tree__count {
        background: var(--nf-color-bg-muted);
        color: var(--nf-color-text-secondary);
        font-size: 11px;
        padding: 1px 8px;
        border-radius: 999px;
        font-weight: 600;
      }
    `,
  ],
})
export class CompteTreePickerComponent {
  private readonly translate = inject(TranslateService);

  readonly comptes = input<Compte[]>([]);
  readonly selectedCode = input<string | null | undefined>(null);
  readonly autoExpandClasses = input<boolean>(true);

  readonly search = signal<string>('');
  readonly expanded = signal<Set<string>>(new Set());

  @Output() readonly compteSelected = new EventEmitter<Compte>();

  readonly tree = computed(() => buildTree(this.comptes()));

  readonly filteredRoots = computed(() => {
    const term = this.search().trim().toLowerCase();
    const roots = this.tree();
    if (!term) {
      this.ensureClassesExpanded(roots);
      return roots;
    }
    const filtered: CompteTreeNode[] = [];
    const allMatchingCodes = new Set<string>();

    const visit = (node: CompteTreeNode): CompteTreeNode | null => {
      const filteredChildren: CompteTreeNode[] = [];
      for (const child of node.children) {
        const f = visit(child);
        if (f) filteredChildren.push(f);
      }
      const selfMatches =
        node.compte.code.toLowerCase().includes(term) ||
        node.compte.libelle.toLowerCase().includes(term);
      if (selfMatches || filteredChildren.length) {
        allMatchingCodes.add(node.compte.code);
        return { compte: node.compte, children: filteredChildren };
      }
      return null;
    };

    for (const root of roots) {
      const f = visit(root);
      if (f) filtered.push(f);
    }
    queueMicrotask(() => this.expanded.set(new Set(allMatchingCodes)));
    return filtered;
  });

  classeLabel(classe: number): string {
    const key = CLASSE_KEYS[classe];
    return key
      ? this.translate.instant(key)
      : this.translate.instant('finance.planComptable.cgnc.classeGeneric', { classe });
  }

  getClasseEmoji(classe: number): string {
    switch (classe) {
      case 1:
        return '💰';
      case 2:
        return '🏗️';
      case 3:
        return '📦';
      case 4:
        return '📑';
      case 5:
        return '🏦';
      case 6:
        return '💸';
      case 7:
        return '💵';
      default:
        return '•';
    }
  }

  toggle(code: string): void {
    const next = new Set(this.expanded());
    if (next.has(code)) {
      next.delete(code);
    } else {
      next.add(code);
    }
    this.expanded.set(next);
  }

  expandAll(): void {
    const all = new Set<string>();
    for (const compte of this.comptes()) {
      all.add(compte.code);
    }
    this.expanded.set(all);
  }

  collapseAll(): void {
    this.expanded.set(new Set());
  }

  onPick(compte: Compte): void {
    this.compteSelected.emit(compte);
  }

  private ensureClassesExpanded(roots: CompteTreeNode[]): void {
    if (!this.autoExpandClasses()) return;
    const current = this.expanded();
    if (current.size > 0) return;
    queueMicrotask(() => {
      const next = new Set<string>();
      for (const r of roots) next.add(r.compte.code);
      this.expanded.set(next);
    });
  }
}
