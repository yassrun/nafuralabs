import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TreeEditorNode {
  id: string;
  label: string;
  parentId?: string | null;
  order?: number;
  kind?: string;
  readonly?: boolean;
}

interface FlatTreeNode {
  id: string;
  label: string;
  kind?: string;
  readonly?: boolean;
  depth: number;
}

export interface TreeMoveEvent {
  id: string;
  direction: 'up' | 'down';
}

@Component({
  selector: 'nf-tree-editor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="nf-tree-editor">
      <header class="nf-tree-editor__header">
        <h3 class="nf-tree-editor__title">{{ title() }}</h3>
        @if (!readonly()) {
          <button type="button" class="nf-tree-editor__btn" (click)="onAddRoot()">{{ addRootLabel() }}</button>
        }
      </header>

      @if (flatNodes().length === 0) {
        <p class="nf-tree-editor__empty">{{ emptyLabel() }}</p>
      } @else {
        <ul class="nf-tree-editor__list">
          @for (node of flatNodes(); track node.id) {
            <li class="nf-tree-editor__row" [style.paddingLeft.px]="node.depth * 20 + 10">
              <button type="button" class="nf-tree-editor__node" [class.nf-tree-editor__node--active]="node.id === selectedId()" (click)="onSelectNode(node.id)">
                <span class="nf-tree-editor__label">{{ node.label }}</span>
                @if (node.kind) {
                  <span class="nf-tree-editor__kind">{{ node.kind }}</span>
                }
              </button>
              @if (!readonly() && !node.readonly) {
                <div class="nf-tree-editor__actions">
                  <button type="button" class="nf-tree-editor__icon-btn" (click)="onMove(node.id, 'up')">↑</button>
                  <button type="button" class="nf-tree-editor__icon-btn" (click)="onMove(node.id, 'down')">↓</button>
                  <button type="button" class="nf-tree-editor__icon-btn" (click)="onAddChild(node.id)">+</button>
                  <button type="button" class="nf-tree-editor__icon-btn nf-tree-editor__icon-btn--danger" (click)="onDelete(node.id)">×</button>
                </div>
              }
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: [`
    :host { display: block; }
    .nf-tree-editor {
      border: 1px solid var(--nf-border-default);
      border-radius: 10px;
      background: var(--nf-surface-card);
      padding: 10px;
      display: grid;
      gap: 10px;
    }
    .nf-tree-editor__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }
    .nf-tree-editor__title { margin: 0; color: var(--nf-text-primary); font-size: var(--nf-font-size-md, 1rem); }
    .nf-tree-editor__btn,
    .nf-tree-editor__icon-btn {
      border: 1px solid var(--nf-border-default);
      border-radius: 6px;
      background: transparent;
      color: var(--nf-text-secondary);
      cursor: pointer;
    }
    .nf-tree-editor__btn { padding: 4px 10px; }
    .nf-tree-editor__icon-btn {
      width: 24px;
      height: 24px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .nf-tree-editor__icon-btn--danger {
      color: var(--nf-color-danger-600);
      border-color: var(--nf-color-danger-300);
    }
    .nf-tree-editor__empty {
      margin: 0;
      color: var(--nf-text-muted);
    }
    .nf-tree-editor__list { margin: 0; padding: 0; list-style: none; display: grid; gap: 6px; }
    .nf-tree-editor__row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .nf-tree-editor__node {
      flex: 1;
      min-width: 0;
      display: inline-flex;
      gap: 8px;
      align-items: center;
      border: 1px solid var(--nf-border-default);
      border-radius: 8px;
      background: var(--nf-surface-card);
      color: var(--nf-text-secondary);
      padding: 6px 8px;
      text-align: left;
      cursor: pointer;
    }
    .nf-tree-editor__node--active {
      border-color: var(--nf-color-primary-400);
      color: var(--nf-color-primary-700);
      background: var(--nf-color-primary-50);
    }
    .nf-tree-editor__label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .nf-tree-editor__kind { color: var(--nf-text-muted); font-size: var(--nf-font-size-xs, 0.75rem); }
    .nf-tree-editor__actions { display: inline-flex; gap: 4px; }
  `],
})
export class TreeEditorComponent {
  nodes = input<TreeEditorNode[]>([]);
  selectedId = input<string | null>(null);
  readonly = input<boolean>(false);
  title = input<string>('Tree Editor');
  emptyLabel = input<string>('No nodes yet.');
  addRootLabel = input<string>('Add root');

  selectNode = output<string>();
  addNodeRequested = output<string | null>();
  deleteNodeRequested = output<string>();
  moveNodeRequested = output<TreeMoveEvent>();

  readonly flatNodes = computed<FlatTreeNode[]>(() => {
    const source = this.nodes();
    const byParent = new Map<string | null, TreeEditorNode[]>();

    for (const node of source) {
      const parentKey = node.parentId ?? null;
      const bucket = byParent.get(parentKey) || [];
      bucket.push(node);
      byParent.set(parentKey, bucket);
    }

    for (const bucket of byParent.values()) {
      bucket.sort((a, b) => {
        const leftOrder = a.order ?? 1000;
        const rightOrder = b.order ?? 1000;
        if (leftOrder !== rightOrder) return leftOrder - rightOrder;
        return a.label.localeCompare(b.label);
      });
    }

    const result: FlatTreeNode[] = [];
    const walk = (parentId: string | null, depth: number) => {
      const children = byParent.get(parentId) || [];
      for (const child of children) {
        result.push({
          id: child.id,
          label: child.label,
          kind: child.kind,
          readonly: child.readonly,
          depth,
        });
        walk(child.id, depth + 1);
      }
    };

    walk(null, 0);
    return result;
  });

  onSelectNode(nodeId: string): void {
    this.selectNode.emit(nodeId);
  }

  onAddRoot(): void {
    this.addNodeRequested.emit(null);
  }

  onAddChild(nodeId: string): void {
    this.addNodeRequested.emit(nodeId);
  }

  onDelete(nodeId: string): void {
    this.deleteNodeRequested.emit(nodeId);
  }

  onMove(nodeId: string, direction: 'up' | 'down'): void {
    this.moveNodeRequested.emit({ id: nodeId, direction });
  }
}

