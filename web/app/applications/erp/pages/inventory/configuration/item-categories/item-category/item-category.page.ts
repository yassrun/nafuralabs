/**
 * ItemCategory Page — treeEditor (deliveryLane: composed)
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
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  ConfirmDialogService,
  PageHeaderComponent,
  PageShellComponent,
} from '@lib/anatomy';
import { ButtonComponent } from '@lib/anatomy/components';
import { TreeEditorComponent } from '@lib/anatomy/components/organisms';

import { ItemCategoriesFacade } from '../services';
import type { ItemCategory } from '../models';

const LIST_QUERY = {
  page: 1,
  pageSize: 500,
  sortBy: 'code',
  sortDirection: 'asc' as const,
};

@Component({
  selector: 'app-item-category',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    PageShellComponent,
    PageHeaderComponent,
    TreeEditorComponent,
    ButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig"></nf-page-header>

      <div class="ic-layout">
        <div class="ic-layout__tree">
          @if (facade.isLoading()) {
            <p class="ic-layout__loading">{{ 'inventory.configuration.itemCategory.loading' | translate }}</p>
          } @else {
            <nf-tree-editor
              [nodes]="facade.treeNodes()"
              [selectedId]="selectedId()"
              [title]="'inventory.configuration.itemCategory.tree.title' | translate"
              [emptyLabel]="'inventory.configuration.itemCategory.tree.empty' | translate"
              [addRootLabel]="'inventory.configuration.itemCategory.tree.addRoot' | translate"
              (selectNode)="onSelectNode($event)"
              (addNodeRequested)="onAddNodeRequested($event)"
              (deleteNodeRequested)="onDeleteNodeRequested($event)" />
          }
        </div>

        <aside class="ic-layout__detail">
          @if (selectedCategory(); as category) {
            <h3 class="ic-detail__title">{{ 'inventory.configuration.itemCategory.detail.title' | translate }}</h3>

            <label class="ic-field">
              <span class="ic-field__label">{{ 'inventory.configuration.itemCategory.fields.code' | translate }}</span>
              <input class="ic-field__input ic-field__input--readonly" [value]="category.code" readonly />
            </label>

            <label class="ic-field">
              <span class="ic-field__label">{{ 'inventory.configuration.itemCategory.fields.name' | translate }}</span>
              <input
                class="ic-field__input"
                [ngModel]="draftName()"
                (ngModelChange)="draftName.set($event)"
                [disabled]="facade.isSaving()" />
            </label>

            <label class="ic-field">
              <span class="ic-field__label">{{ 'inventory.configuration.itemCategory.fields.description' | translate }}</span>
              <textarea
                class="ic-field__input ic-field__textarea"
                rows="4"
                [ngModel]="draftDescription()"
                (ngModelChange)="draftDescription.set($event)"
                [disabled]="facade.isSaving()"></textarea>
            </label>

            <label class="ic-field ic-field--checkbox">
              <input
                type="checkbox"
                [ngModel]="draftIsActive()"
                (ngModelChange)="draftIsActive.set($event)"
                [disabled]="facade.isSaving()" />
              <span>{{ 'inventory.configuration.itemCategory.fields.isActive' | translate }}</span>
            </label>

            <div class="ic-detail__actions">
              <nf-button
                variant="primary"
                [loading]="facade.isSaving()"
                [disabled]="!canSave()"
                (clicked)="onSave()">
                {{ 'common.actions.save' | translate }}
              </nf-button>
            </div>
          } @else {
            <p class="ic-detail__empty">{{ 'inventory.configuration.itemCategory.detail.empty' | translate }}</p>
          }
        </aside>
      </div>
    </nf-page-shell>
  `,
  styles: [`
    .ic-layout {
      display: grid;
      grid-template-columns: minmax(280px, 1fr) minmax(320px, 1fr);
      gap: 1rem;
      align-items: start;
    }

    @media (max-width: 900px) {
      .ic-layout {
        grid-template-columns: 1fr;
      }
    }

    .ic-layout__loading,
    .ic-detail__empty {
      margin: 0;
      color: var(--nf-text-muted);
    }

    .ic-layout__detail {
      border: 1px solid var(--nf-border-default);
      border-radius: 10px;
      background: var(--nf-surface-card);
      padding: 1rem;
      display: grid;
      gap: 0.875rem;
    }

    .ic-detail__title {
      margin: 0;
      font-size: var(--nf-font-size-md, 1rem);
      color: var(--nf-text-primary);
    }

    .ic-field {
      display: grid;
      gap: 0.375rem;
    }

    .ic-field--checkbox {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .ic-field__label {
      font-size: var(--nf-font-size-sm, 0.875rem);
      font-weight: 500;
      color: var(--nf-text-secondary);
    }

    .ic-field__input {
      width: 100%;
      border: 1px solid var(--nf-border-default);
      border-radius: 8px;
      padding: 0.5rem 0.75rem;
      font: inherit;
      color: var(--nf-text-primary);
      background: var(--nf-surface-card);
    }

    .ic-field__input--readonly {
      background: var(--nf-color-bg-subtle, var(--nf-surface-muted));
      color: var(--nf-text-muted);
    }

    .ic-field__textarea {
      resize: vertical;
      min-height: 5rem;
    }

    .ic-detail__actions {
      display: flex;
      justify-content: flex-end;
      padding-top: 0.25rem;
    }
  `],
})
export class ItemCategoryPage implements OnInit {
  readonly facade = inject(ItemCategoriesFacade);
  private readonly translate = inject(TranslateService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly selectedId = signal<string | null>(null);
  readonly draftName = signal('');
  readonly draftDescription = signal('');
  readonly draftIsActive = signal(true);

  readonly selectedCategory = computed<ItemCategory | null>(() => {
    const id = this.selectedId();
    if (!id) {
      return null;
    }
    return this.facade.items().find((item) => item.id === id) ?? null;
  });

  readonly canSave = computed(() => {
    const category = this.selectedCategory();
    if (!category) {
      return false;
    }
    return (
      this.draftName().trim() !== '' &&
      (this.draftName() !== category.name ||
        (this.draftDescription() ?? '') !== (category.description ?? '') ||
        this.draftIsActive() !== (category.isActive ?? true))
    );
  });

  readonly headerConfig = {
    title: this.translate.instant('inventory.configuration.itemCategory.headerTitle'),
  };

  ngOnInit(): void {
    void this.reloadItems();
  }

  onSelectNode(nodeId: string): void {
    this.selectedId.set(nodeId);
    this.syncDraftFromSelection();
  }

  async onAddNodeRequested(parentId: string | null): Promise<void> {
    const result = await this.confirmDialog.prompt({
      title: this.translate.instant('inventory.configuration.itemCategory.add.title'),
      fields: [
        {
          key: 'code',
          label: 'inventory.configuration.itemCategory.fields.code',
          required: true,
        },
        {
          key: 'name',
          label: 'inventory.configuration.itemCategory.fields.name',
          required: true,
        },
      ],
      confirmLabel: this.translate.instant('inventory.configuration.itemCategory.add.confirm'),
      cancelLabel: this.translate.instant('common.actions.cancel'),
    });

    if (!result) {
      return;
    }

    const code = result['code']?.trim();
    const name = result['name']?.trim();
    if (!code || !name) {
      return;
    }

    const created = await this.facade.createItem({
      code,
      name,
      parentId: parentId ?? undefined,
      isActive: true,
    });

    await this.reloadItems();
    this.selectedId.set(created.id);
    this.syncDraftFromSelection();
  }

  async onDeleteNodeRequested(id: string): Promise<void> {
    if (this.facade.hasChildren(id)) {
      await this.confirmDialog.confirm({
        title: this.translate.instant('inventory.configuration.itemCategory.deleteBlocked.title'),
        message: this.translate.instant('inventory.configuration.itemCategory.deleteBlocked.message'),
        confirmLabel: this.translate.instant('inventory.configuration.itemCategory.deleteBlocked.confirm'),
        cancelLabel: this.translate.instant('common.actions.cancel'),
      });
      return;
    }

    const item = this.facade.items().find((entry) => entry.id === id);
    const label = item ? `${item.code} — ${item.name}` : id;
    const confirmed = await this.confirmDialog.confirm({
      title: this.translate.instant('inventory.configuration.itemCategory.deleteConfirm.title'),
      message: this.translate.instant('inventory.configuration.itemCategory.deleteConfirm.message', { name: label }),
      confirmLabel: this.translate.instant('common.actions.delete'),
      cancelLabel: this.translate.instant('common.actions.cancel'),
      variant: 'danger',
      icon: 'delete',
    });

    if (!confirmed) {
      return;
    }

    await this.facade.deleteItem(id);

    if (this.selectedId() === id) {
      this.selectedId.set(null);
      this.clearDraft();
    }

    await this.reloadItems();
  }

  async onSave(): Promise<void> {
    const category = this.selectedCategory();
    if (!category || !this.canSave()) {
      return;
    }

    await this.facade.updateItem(category.id, {
      name: this.draftName().trim(),
      description: this.draftDescription().trim() || undefined,
      isActive: this.draftIsActive(),
    });

    this.syncDraftFromSelection();
  }

  private async reloadItems(): Promise<void> {
    await this.facade.loadItems(LIST_QUERY);
  }

  private syncDraftFromSelection(): void {
    const category = this.selectedCategory();
    if (!category) {
      this.clearDraft();
      return;
    }

    this.draftName.set(category.name);
    this.draftDescription.set(category.description ?? '');
    this.draftIsActive.set(category.isActive ?? true);
  }

  private clearDraft(): void {
    this.draftName.set('');
    this.draftDescription.set('');
    this.draftIsActive.set(true);
  }
}
