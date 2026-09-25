import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

export interface NfTreeSelectNode {
  key: string;
  label: string;
  children?: NfTreeSelectNode[];
}

@Component({
  selector: 'nf-tree-select',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="nf-tree-select" [class.nf-tree-select--open]="open()">
      <div class="nf-tree-select__trigger-wrap">
        <button
          type="button"
          class="nf-tree-select__trigger"
          [disabled]="disabled()"
          [attr.aria-expanded]="open()"
          aria-haspopup="tree"
          (click)="toggleOpen()">
          <span [class.nf-tree-select__placeholder]="!selectedNode()">
            {{ selectedPath() || placeholder() }}
          </span>
          <lucide-icon name="chevron-down" [size]="16" aria-hidden="true" />
        </button>
        @if (selectedNode() && !disabled()) {
          <button
            type="button"
            class="nf-tree-select__clear"
            aria-label="Clear selection"
            (click)="clear($event)">
            <lucide-icon name="x" [size]="14" aria-hidden="true" />
          </button>
        }
      </div>

      @if (open()) {
        <div class="nf-tree-select__panel" role="tree" (click)="$event.stopPropagation()">
          <input
            class="nf-tree-select__search"
            type="search"
            [ngModel]="query()"
            (ngModelChange)="query.set($event)"
            placeholder="Rechercher..."
            aria-label="Search tree" />

          <div class="nf-tree-select__nodes">
            <ng-container
              [ngTemplateOutlet]="treeTemplate"
              [ngTemplateOutletContext]="{ $implicit: filteredNodes(), depth: 0 }" />
            @if (filteredNodes().length === 0) {
              <p class="nf-tree-select__empty">Aucun résultat</p>
            }
          </div>
        </div>
      }
    </div>

    <ng-template #treeTemplate let-items let-depth="depth">
      @for (node of items; track node.key) {
        <div class="nf-tree-select__node" role="treeitem" [attr.aria-level]="depth + 1">
          <button
            type="button"
            class="nf-tree-select__expand"
            [style.margin-left.px]="depth * 18"
            [disabled]="!node.children?.length"
            [attr.aria-label]="isExpanded(node.key) ? 'Collapse' : 'Expand'"
            (click)="toggleNode(node, $event)">
            @if (node.children?.length) {
              <lucide-icon
                [name]="isExpanded(node.key) ? 'chevron-down' : 'chevron-right'"
                [size]="14"
                aria-hidden="true" />
            }
          </button>
          <button
            type="button"
            class="nf-tree-select__option"
            [class.nf-tree-select__option--selected]="node.key === value()"
            (click)="select(node)">
            <span>{{ node.label }}</span>
            @if (node.key === value()) {
              <lucide-icon name="check" [size]="15" aria-hidden="true" />
            }
          </button>
        </div>
        @if (node.children?.length && isExpanded(node.key)) {
          <ng-container
            [ngTemplateOutlet]="treeTemplate"
            [ngTemplateOutletContext]="{ $implicit: node.children, depth: depth + 1 }" />
        }
      }
    </ng-template>
  `,
  styles: [`
    :host { display: block; position: relative; min-width: 220px; }
    .nf-tree-select { position: relative; }
    .nf-tree-select__trigger-wrap { position: relative; display: flex; align-items: center; }
    .nf-tree-select__trigger {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      min-height: 36px;
      padding: 0 10px;
      border: 1px solid var(--nf-border-default, #dbe2ea);
      border-radius: 6px;
      background: var(--nf-surface-section, #fff);
      color: var(--nf-text-primary, #111827);
      text-align: start;
      cursor: pointer;
    }
    .nf-tree-select__trigger > span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .nf-tree-select__trigger:focus-visible { outline: 2px solid var(--nf-color-primary, #2563eb); outline-offset: 1px; }
    .nf-tree-select__trigger:disabled { opacity: 0.6; cursor: not-allowed; }
    .nf-tree-select__placeholder { color: var(--nf-text-muted, #64748b); }
    .nf-tree-select__clear { display: inline-flex; position: absolute; right: 28px; padding: 2px; border: 0; background: var(--nf-surface-section, #fff); color: var(--nf-text-muted, #64748b); cursor: pointer; }
    .nf-tree-select__panel {
      position: absolute;
      z-index: 20;
      top: calc(100% + 4px);
      left: 0;
      width: min(360px, 90vw);
      max-height: 360px;
      overflow: auto;
      padding: 8px;
      border: 1px solid var(--nf-border-default, #dbe2ea);
      border-radius: 6px;
      background: var(--nf-surface-section, #fff);
      box-shadow: 0 8px 24px rgb(15 23 42 / 14%);
    }
    .nf-tree-select__search { box-sizing: border-box; width: 100%; height: 32px; margin-bottom: 6px; padding: 0 8px; border: 1px solid var(--nf-border-default, #dbe2ea); border-radius: 4px; }
    .nf-tree-select__node { display: flex; align-items: center; min-height: 32px; }
    .nf-tree-select__expand { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 28px; padding: 0; border: 0; background: transparent; color: var(--nf-text-muted, #64748b); }
    .nf-tree-select__expand:disabled { cursor: default; }
    .nf-tree-select__option { display: flex; align-items: center; justify-content: space-between; flex: 1; min-height: 28px; padding: 4px 8px; border: 0; border-radius: 4px; background: transparent; color: var(--nf-text-primary, #111827); text-align: start; cursor: pointer; }
    .nf-tree-select__option:hover, .nf-tree-select__option--selected { background: var(--nf-color-primary-50, #eff6ff); color: var(--nf-color-primary-700, #1d4ed8); }
    .nf-tree-select__empty { margin: 12px 4px; color: var(--nf-text-muted, #64748b); font-size: 0.8125rem; }
  `],
})
export class TreeSelectComponent {
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly nodes = input.required<NfTreeSelectNode[]>();
  readonly value = input<string | null>(null);
  readonly placeholder = input('Sélectionner...');
  readonly disabled = input(false);
  readonly valueChange = output<string | null>();
  readonly open = signal(false);
  readonly query = signal('');
  private readonly expanded = signal<Set<string>>(new Set());

  readonly selectedNode = computed(() => findNode(this.nodes(), this.value()));
  readonly selectedPath = computed(() => {
    const path = findPath(this.nodes(), this.value());
    return path.join(' > ');
  });
  readonly filteredNodes = computed(() => filterNodes(this.nodes(), this.query().trim().toLowerCase()));

  @HostListener('document:pointerdown', ['$event'])
  onDocumentPointerDown(event: PointerEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.open.set(false);
  }

  toggleOpen(): void {
    if (!this.disabled()) this.open.update((value) => !value);
  }

  toggleNode(node: NfTreeSelectNode, event: Event): void {
    event.stopPropagation();
    if (!node.children?.length) return;
    this.expanded.update((current) => {
      const next = new Set(current);
      if (next.has(node.key)) next.delete(node.key);
      else next.add(node.key);
      return next;
    });
  }

  isExpanded(key: string): boolean {
    return this.expanded().has(key);
  }

  select(node: NfTreeSelectNode): void {
    this.valueChange.emit(node.key);
    this.open.set(false);
  }

  clear(event: Event): void {
    event.stopPropagation();
    this.valueChange.emit(null);
  }
}

function findNode(nodes: NfTreeSelectNode[], key: string | null): NfTreeSelectNode | null {
  if (!key) return null;
  for (const node of nodes) {
    if (node.key === key) return node;
    const child = findNode(node.children ?? [], key);
    if (child) return child;
  }
  return null;
}

function findPath(nodes: NfTreeSelectNode[], key: string | null, trail: string[] = []): string[] {
  if (!key) return [];
  for (const node of nodes) {
    const nextTrail = [...trail, node.label];
    if (node.key === key) return nextTrail;
    const childPath = findPath(node.children ?? [], key, nextTrail);
    if (childPath.length) return childPath;
  }
  return [];
}

function filterNodes(nodes: NfTreeSelectNode[], query: string): NfTreeSelectNode[] {
  if (!query) return nodes;
  return nodes.flatMap((node) => {
    const children = filterNodes(node.children ?? [], query);
    return node.label.toLowerCase().includes(query) || children.length
      ? [{ ...node, children }]
      : [];
  });
}