/**
 * Famille Article — arbre visible (nf-tree-table), même principe que l'étude / lots chantier.
 */

import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  ConfirmDialogService,
  PageHeaderComponent,
  PageShellComponent,
} from '@platform/lib/anatomy';
import {
  ButtonComponent,
  TreeTableComponent,
  type NfTreeNode,
  type NfTreeTableColumn,
} from '@platform/lib/anatomy/components';

import { FamilleArticleFacade } from '../services';
import type { FamilleArticleConfig } from '../models';

@Component({
  selector: 'app-famille-article-tree',
  standalone: true,
  imports: [
    FormsModule,
    TranslateModule,
    PageShellComponent,
    PageHeaderComponent,
    TreeTableComponent,
    ButtonComponent
],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig"></nf-page-header>

      <div class="fa-toolbar">
        <nf-button variant="primary" icon="plus" iconLibrary="lucide" (clicked)="onAddRoot()">
          {{ 'inventory.configuration.famille.tree.addRoot' | translate }}
        </nf-button>
        <nf-button
          variant="secondary"
          icon="plus"
          iconLibrary="lucide"
          [disabled]="!canAddChild()"
          (clicked)="onAddChild()">
          {{ 'inventory.configuration.famille.tree.addChild' | translate }}
        </nf-button>
        <span class="fa-toolbar__spacer"></span>
        <button type="button" class="fa-link" (click)="collapseAll()">
          {{ 'inventory.configuration.famille.tree.collapseAll' | translate }}
        </button>
        <button type="button" class="fa-link" (click)="expandAll()">
          {{ 'inventory.configuration.famille.tree.expandAll' | translate }}
        </button>
      </div>

      <div class="fa-layout">
        <div class="fa-layout__tree">
          <nf-tree-table
            [nodes]="facade.treeNodes()"
            [columns]="treeColumns"
            treeColumnKey="name"
            [loading]="facade.isLoading()"
            [rowClickable]="true"
            [expandedKeys]="expandedKeys()"
            [rowClass]="rowClassFn"
            [emptyMessage]="'inventory.configuration.famille.tree.empty'"
            minWidth="28rem"
            scrollHeight="calc(100vh - 16rem)"
            (expandedKeysChange)="expandedKeys.set($event)"
            (rowClick)="onSelectRow($event)">
            <ng-template #cell let-row let-column="column">
              @switch (column.key) {
                @case ('name') {
                  <strong>{{ row.name }}</strong>
                }
                @case ('code') {
                  <span class="fa-code">{{ row.code }}</span>
                }
                @case ('actions') {
                  <span class="fa-actions" (click)="$event.stopPropagation()">
                    <button
                      type="button"
                      class="fa-row-action"
                      [disabled]="!!row.parentId || facade.hasChildren(row.id)"
                      [attr.title]="'inventory.configuration.famille.tree.addChild' | translate"
                      (click)="onAddChildFor(row)">
                      +
                    </button>
                    <button
                      type="button"
                      class="fa-row-action fa-row-action--danger"
                      [attr.title]="'common.actions.delete' | translate"
                      (click)="onDeleteNodeRequested(row.id)">
                      ×
                    </button>
                  </span>
                }
              }
            </ng-template>
          </nf-tree-table>
        </div>

        <aside class="fa-layout__detail">
          @if (selectedFamille(); as famille) {
            <h3 class="fa-detail__title">{{ 'inventory.configuration.famille.detail.title' | translate }}</h3>

            <label class="fa-field">
              <span class="fa-field__label">{{ 'inventory.configuration.famille.fields.code' | translate }}</span>
              <input class="fa-field__input fa-field__input--readonly" [value]="famille.code" readonly />
            </label>

            <label class="fa-field">
              <span class="fa-field__label">{{ 'inventory.configuration.famille.fields.name' | translate }}</span>
              <input
                class="fa-field__input"
                [ngModel]="draftName()"
                (ngModelChange)="draftName.set($event)"
                [disabled]="facade.isSaving()" />
            </label>

            <label class="fa-field">
              <span class="fa-field__label">{{ 'inventory.configuration.famille.fields.description' | translate }}</span>
              <textarea
                class="fa-field__input fa-field__textarea"
                rows="4"
                [ngModel]="draftDescription()"
                (ngModelChange)="draftDescription.set($event)"
                [disabled]="facade.isSaving()"></textarea>
            </label>

            <label class="fa-field">
              <span class="fa-field__label">{{ 'inventory.configuration.famille.fields.parentId' | translate }}</span>
              <select
                class="fa-field__input"
                [ngModel]="draftParentId()"
                (ngModelChange)="draftParentId.set($event)"
                [disabled]="facade.isSaving() || facade.hasChildren(famille.id)">
                <option [ngValue]="''">{{ 'inventory.configuration.famille.fields.parentNone' | translate }}</option>
                @for (opt of parentOptions(); track opt.value) {
                  @if (opt.value !== famille.id) {
                    <option [ngValue]="opt.value">{{ opt.label }}</option>
                  }
                }
              </select>
            </label>

            <label class="fa-field fa-field--checkbox">
              <input
                type="checkbox"
                [ngModel]="draftIsActive()"
                (ngModelChange)="draftIsActive.set($event)"
                [disabled]="facade.isSaving()" />
              <span>{{ 'inventory.configuration.famille.fields.isActive' | translate }}</span>
            </label>

            <div class="fa-detail__actions">
              <nf-button variant="secondary" (clicked)="onOpenFullDetail(famille)">
                {{ 'inventory.configuration.famille.detail.openForm' | translate }}
              </nf-button>
              <nf-button
                variant="primary"
                [loading]="facade.isSaving()"
                [disabled]="!canSave()"
                (clicked)="onSave()">
                {{ 'common.actions.save' | translate }}
              </nf-button>
            </div>
          } @else {
            <p class="fa-detail__empty">{{ 'inventory.configuration.famille.detail.empty' | translate }}</p>
          }
        </aside>
      </div>
    </nf-page-shell>
  `,
  styles: [`
    .fa-toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }
    .fa-toolbar__spacer { flex: 1 1 auto; }
    .fa-link {
      border: none;
      background: transparent;
      color: var(--nf-color-primary-600, var(--nf-color-primary));
      cursor: pointer;
      font-size: 0.8125rem;
      padding: 0;
    }
    .fa-link:hover { text-decoration: underline; }
    .fa-layout {
      display: grid;
      grid-template-columns: minmax(320px, 1.4fr) minmax(280px, 1fr);
      gap: 1rem;
      align-items: start;
    }
    @media (max-width: 900px) {
      .fa-layout { grid-template-columns: 1fr; }
    }
    .fa-detail__empty {
      margin: 0;
      color: var(--nf-text-muted, var(--nf-color-text-secondary));
    }
    .fa-layout__detail {
      border: 1px solid var(--nf-border-default, var(--nf-color-border));
      border-radius: 10px;
      background: var(--nf-surface-card, var(--nf-color-surface));
      padding: 1rem;
      display: grid;
      gap: 0.875rem;
    }
    .fa-detail__title {
      margin: 0;
      font-size: var(--nf-font-size-md, 1rem);
      color: var(--nf-text-primary, var(--nf-color-text-primary));
    }
    .fa-field { display: grid; gap: 0.375rem; }
    .fa-field--checkbox { display: flex; align-items: center; gap: 0.5rem; }
    .fa-field__label {
      font-size: var(--nf-font-size-sm, 0.875rem);
      font-weight: 500;
      color: var(--nf-text-secondary, var(--nf-color-text-secondary));
    }
    .fa-field__input {
      width: 100%;
      border: 1px solid var(--nf-border-default, var(--nf-color-border));
      border-radius: 8px;
      padding: 0.5rem 0.75rem;
      font: inherit;
      color: var(--nf-text-primary, var(--nf-color-text-primary));
      background: var(--nf-surface-card, var(--nf-color-surface));
    }
    .fa-field__input--readonly {
      background: var(--nf-color-bg-subtle, var(--nf-surface-muted));
      color: var(--nf-text-muted, var(--nf-color-text-secondary));
    }
    .fa-field__textarea { resize: vertical; min-height: 5rem; }
    .fa-detail__actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      padding-top: 0.25rem;
    }
    .fa-code {
      font-size: 0.75rem;
      font-variant-numeric: tabular-nums;
      color: var(--nf-color-text-tertiary, var(--nf-color-text-secondary));
      white-space: nowrap;
    }
    .fa-actions { white-space: nowrap; }
    .fa-row-action {
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 1rem;
      line-height: 1;
      padding: 0 0.35rem;
      color: var(--nf-color-text-secondary);
    }
    .fa-row-action:disabled { opacity: 0.35; cursor: not-allowed; }
    .fa-row-action:hover:not(:disabled) { color: var(--nf-color-text-primary); }
    .fa-row-action--danger:hover:not(:disabled) { color: var(--nf-color-danger-600, #c0392b); }
    :host ::ng-deep .fa-row--selected {
      background: color-mix(in srgb, var(--nf-color-primary-600, #2563eb) 10%, transparent);
    }
  `],
})
export class FamilleTreePage implements OnInit {
  readonly facade = inject(FamilleArticleFacade);
  private readonly translate = inject(TranslateService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly router = inject(Router);

  readonly selectedId = signal<string | null>(null);
  readonly draftName = signal('');
  readonly draftDescription = signal('');
  readonly draftParentId = signal('');
  readonly draftIsActive = signal(true);
  readonly expandedKeys = signal<Set<string>>(new Set());

  readonly treeColumns: NfTreeTableColumn<FamilleArticleConfig>[] = [
    {
      key: 'name',
      label: 'inventory.configuration.famille.fields.name',
      field: 'name',
    },
    {
      key: 'code',
      label: 'inventory.configuration.famille.fields.code',
      field: 'code',
      width: '10rem',
    },
    {
      key: 'actions',
      label: '',
      width: '5rem',
      align: 'center',
    },
  ];

  readonly selectedFamille = computed<FamilleArticleConfig | null>(() => {
    const id = this.selectedId();
    if (!id) return null;
    return this.facade.items().find((item) => item.id === id) ?? null;
  });

  readonly parentOptions = computed(() => this.facade.rootOptions());

  readonly canSave = computed(() => {
    const famille = this.selectedFamille();
    if (!famille) return false;
    const parent = this.draftParentId() || undefined;
    return (
      this.draftName().trim() !== '' &&
      (this.draftName() !== famille.name ||
        (this.draftDescription() ?? '') !== (famille.description ?? '') ||
        parent !== (famille.parentId ?? undefined) ||
        this.draftIsActive() !== (famille.isActive ?? true))
    );
  });

  readonly headerConfig = {
    title: this.translate.instant('inventory.configuration.famille.headerTitle'),
  };

  readonly rowClassFn = (row: FamilleArticleConfig): Record<string, boolean> => ({
    'fa-row--selected': row.id === this.selectedId(),
  });

  ngOnInit(): void {
    void this.reloadItems();
  }

  canAddChild(): boolean {
    const selected = this.selectedFamille();
    return !!selected && !selected.parentId;
  }

  onSelectRow(row: FamilleArticleConfig): void {
    this.selectedId.set(row.id);
    this.syncDraftFromSelection();
  }

  expandAll(): void {
    this.expandedKeys.set(this.collectExpandableKeys(this.facade.treeNodes()));
  }

  collapseAll(): void {
    this.expandedKeys.set(new Set());
  }

  onAddRoot(): void {
    void this.promptCreate(null);
  }

  onAddChild(): void {
    const selected = this.selectedFamille();
    if (!selected || selected.parentId) return;
    void this.promptCreate(selected.id);
  }

  onAddChildFor(row: FamilleArticleConfig): void {
    if (row.parentId) return;
    void this.promptCreate(row.id);
  }

  async onDeleteNodeRequested(id: string): Promise<void> {
    if (this.facade.hasChildren(id)) {
      await this.confirmDialog.confirm({
        title: this.translate.instant('inventory.configuration.famille.deleteBlocked.title'),
        message: this.translate.instant('inventory.configuration.famille.deleteBlocked.message'),
        confirmLabel: this.translate.instant('inventory.configuration.famille.deleteBlocked.confirm'),
        cancelLabel: this.translate.instant('common.actions.cancel'),
      });
      return;
    }

    const item = this.facade.items().find((entry) => entry.id === id);
    const label = item ? `${item.code} — ${item.name}` : id;
    const confirmed = await this.confirmDialog.confirm({
      title: this.translate.instant('inventory.configuration.famille.deleteConfirm.title'),
      message: this.translate.instant('inventory.configuration.famille.deleteConfirm.message', {
        name: label,
      }),
      confirmLabel: this.translate.instant('common.actions.delete'),
      cancelLabel: this.translate.instant('common.actions.cancel'),
      variant: 'danger',
      icon: 'delete',
    });

    if (!confirmed) return;

    await this.facade.deleteItem(id);
    if (this.selectedId() === id) {
      this.selectedId.set(null);
      this.clearDraft();
    }
    await this.reloadItems();
  }

  async onSave(): Promise<void> {
    const famille = this.selectedFamille();
    if (!famille || !this.canSave()) return;

    await this.facade.updateItem(famille.id, {
      name: this.draftName().trim(),
      description: this.draftDescription().trim() || undefined,
      parentId: this.draftParentId() || undefined,
      isActive: this.draftIsActive(),
    });

    await this.reloadItems();
    this.syncDraftFromSelection();
  }

  onOpenFullDetail(famille: FamilleArticleConfig): void {
    void this.router.navigate(['/inventory/configuration/familles', famille.id]);
  }

  private async promptCreate(parentId: string | null): Promise<void> {
    const result = await this.confirmDialog.prompt({
      title: this.translate.instant('inventory.configuration.famille.add.title'),
      fields: [
        { key: 'code', label: 'inventory.configuration.famille.fields.code', required: true },
        { key: 'name', label: 'inventory.configuration.famille.fields.name', required: true },
      ],
      confirmLabel: this.translate.instant('inventory.configuration.famille.add.confirm'),
      cancelLabel: this.translate.instant('common.actions.cancel'),
    });

    if (!result) return;

    const code = result['code']?.trim();
    const name = result['name']?.trim();
    if (!code || !name) return;

    let effectiveParent = parentId ?? undefined;
    if (effectiveParent) {
      const parent = this.facade.items().find((f) => f.id === effectiveParent);
      if (parent?.parentId) {
        effectiveParent = parent.parentId;
      }
    }

    const created = await this.facade.createItem({
      code,
      name,
      parentId: effectiveParent,
      isActive: true,
    });

    await this.reloadItems();
    if (effectiveParent) {
      const next = new Set(this.expandedKeys());
      next.add(effectiveParent);
      this.expandedKeys.set(next);
    }
    this.selectedId.set(created.id);
    this.syncDraftFromSelection();
  }

  private async reloadItems(): Promise<void> {
    await this.facade.loadItems();
    if (this.expandedKeys().size === 0) {
      this.expandAll();
    }
  }

  private collectExpandableKeys(nodes: NfTreeNode<FamilleArticleConfig>[]): Set<string> {
    const keys = new Set<string>();
    const walk = (list: NfTreeNode<FamilleArticleConfig>[]): void => {
      for (const node of list) {
        if (node.children?.length) {
          keys.add(node.key);
          walk(node.children);
        }
      }
    };
    walk(nodes);
    return keys;
  }

  private syncDraftFromSelection(): void {
    const famille = this.selectedFamille();
    if (!famille) {
      this.clearDraft();
      return;
    }
    this.draftName.set(famille.name);
    this.draftDescription.set(famille.description ?? '');
    this.draftParentId.set(famille.parentId ?? '');
    this.draftIsActive.set(famille.isActive ?? true);
  }

  private clearDraft(): void {
    this.draftName.set('');
    this.draftDescription.set('');
    this.draftParentId.set('');
    this.draftIsActive.set(true);
  }
}
