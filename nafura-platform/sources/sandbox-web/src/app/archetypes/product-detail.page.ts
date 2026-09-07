import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs';

import { PageShellComponent } from '@platform/lib/anatomy/components/organisms/page-shell';
import { PageHeaderComponent } from '@platform/lib/anatomy/components/molecules/page-header';
import { ButtonComponent } from '@platform/lib/anatomy/components/atoms/button';

import { ProductMockFacade, type Product } from '../mocks/product-mock.facade';

@Component({
  selector: 'sb-product-detail',
  standalone: true,
  imports: [FormsModule, RouterLink, PageShellComponent, PageHeaderComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig()"></nf-page-header>

      @if (error()) {
        <p class="err">{{ error() }}</p>
      } @else {
        <form class="form" (ngSubmit)="save()">
          <label>
            <span>Code</span>
            <input [(ngModel)]="draft.code" name="code" />
          </label>
          <label>
            <span>Name</span>
            <input [(ngModel)]="draft.name" name="name" />
          </label>
          <label>
            <span>Status</span>
            <select [(ngModel)]="draft.status" name="status">
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
            </select>
          </label>
          <label>
            <span>Description</span>
            <textarea [(ngModel)]="draft.description" name="description" rows="3"></textarea>
          </label>
          <div class="actions">
            <a routerLink="/archetypes/listing">Cancel</a>
            <nf-button variant="primary" type="submit">Save</nf-button>
          </div>
        </form>
      }
    </nf-page-shell>
  `,
  styles: [
    `
      .form {
        display: grid;
        gap: 14px;
        max-width: 32rem;
        padding: 8px 0 24px;
      }
      label {
        display: grid;
        gap: 4px;
        font-size: 0.85rem;
      }
      input,
      select,
      textarea {
        padding: 8px 10px;
        border: 1px solid var(--nf-border-subtle, #d1d5db);
        border-radius: 6px;
        font: inherit;
      }
      .actions {
        display: flex;
        gap: 12px;
        align-items: center;
        margin-top: 8px;
      }
      .err {
        color: #b91c1c;
      }
    `,
  ],
})
export class ProductDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly facade = inject(ProductMockFacade);

  readonly error = signal<string | null>(null);
  readonly isNew = signal(false);
  /** Bump to refresh header after load / edit */
  private readonly rev = signal(0);
  draft: Product = { id: '', code: '', name: '', status: 'Draft', description: '' };

  readonly headerConfig = computed(() => {
    this.rev();
    return {
      title: this.isNew() ? 'New Product' : `Product ${this.draft.code || ''}`.trim(),
      subtitle: 'nf-details archetype (sandbox form)',
      breadcrumbs: [
        { label: 'Archetypes', route: '/' },
        { label: 'Listing', route: '/archetypes/listing' },
        { label: this.isNew() ? 'New' : 'Detail' },
      ],
    };
  });

  constructor() {
    void this.load(this.route.snapshot.paramMap.get('id') ?? 'new');
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => void this.load(this.route.snapshot.paramMap.get('id') ?? 'new'));
  }

  private async load(id: string): Promise<void> {
    this.error.set(null);
    if (!id || id === 'new') {
      this.isNew.set(true);
      this.draft = { id: '', code: '', name: '', status: 'Draft', description: '' };
      this.rev.update((n) => n + 1);
      return;
    }
    this.isNew.set(false);
    try {
      this.draft = await this.facade.getItem(id);
      this.rev.update((n) => n + 1);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Not found');
    }
  }

  async save(): Promise<void> {
    if (this.isNew()) {
      const created = await this.facade.createItem(this.draft);
      await this.router.navigate(['/archetypes', 'details', created.id]);
      this.isNew.set(false);
      this.draft = created;
      this.rev.update((n) => n + 1);
    } else {
      this.draft = await this.facade.updateItem(this.draft.id, this.draft);
      this.rev.update((n) => n + 1);
    }
  }
}
