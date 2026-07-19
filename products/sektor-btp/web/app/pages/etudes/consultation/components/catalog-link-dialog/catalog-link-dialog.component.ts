import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { ButtonComponent, NfInputComponent } from '@lib/anatomy';

import { ConsultationApiService } from '../../services';
import type { CatalogCandidate } from '../../models';

export type CatalogLinkTarget = 'noeud' | 'composant';

export interface CatalogLinkDialogData {
  target: CatalogLinkTarget;
  targetId: string;
  designation: string;
  type?: string;
  unite?: string | null;
}

export interface CatalogLinkDialogResult {
  linked: true;
}

@Component({
  selector: 'app-catalog-link-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, TranslateModule, ButtonComponent, NfInputComponent],
  template: `
    <div class="dialog-shell">
      <header>
        <h2>Rattacher au catalogue</h2>
        <nf-button variant="ghost" icon="x" (clicked)="close()" aria-label="Fermer"></nf-button>
      </header>

      <p class="subtitle">{{ data.designation }}</p>

      <div class="tabs">
        <nf-button [variant]="tab() === 'link' ? 'primary' : 'secondary'" (clicked)="tab.set('link')">
          Lier un article existant
        </nf-button>
        <nf-button [variant]="tab() === 'create' ? 'primary' : 'secondary'" (clicked)="tab.set('create')">
          Créer un nouvel article
        </nf-button>
      </div>

      @if (tab() === 'link') {
        <div class="search-row">
          <nf-input
            label="Recherche"
            [ngModel]="query()"
            (ngModelChange)="query.set($event)"
            (keyup.enter)="search()">
          </nf-input>
          <nf-button variant="secondary" icon="search" [disabled]="searching()" (clicked)="search()">
            Rechercher
          </nf-button>
        </div>

        @if (searching()) {
          <p class="hint">Recherche…</p>
        } @else if (candidates().length === 0 && searched()) {
          <p class="hint">Aucun article trouvé. Utilisez "Créer un nouvel article".</p>
        } @else {
          <ul class="candidates">
            @for (c of candidates(); track c.itemId) {
              <li
                [class.selected]="selectedItemId() === c.itemId"
                (click)="selectedItemId.set(c.itemId)">
                <span class="c-code">{{ c.code || '—' }}</span>
                <span class="c-name">{{ c.name }}</span>
                @if (c.articleType) { <span class="c-type">{{ c.articleType }}</span> }
              </li>
            }
          </ul>
        }

        <footer>
          <nf-button variant="secondary" (clicked)="close()">Annuler</nf-button>
          <nf-button variant="primary" [disabled]="!selectedItemId() || saving()" (clicked)="link()">
            Lier
          </nf-button>
        </footer>
      } @else {
        <nf-input label="Nom" [ngModel]="name()" (ngModelChange)="name.set($event)" required></nf-input>
        <div class="grid-2">
          <nf-input label="Code (optionnel)" [ngModel]="code()" (ngModelChange)="code.set($event)"></nf-input>
          <nf-input label="Unité (optionnel)" [ngModel]="unite()" (ngModelChange)="unite.set($event)"></nf-input>
        </div>
        <div class="grid-2">
          <label class="field">
            <span>Type d'article</span>
            <select [ngModel]="articleType()" (ngModelChange)="articleType.set($event)">
              <option value="MATERIAU">Matériau</option>
              <option value="PRESTATION">Prestation / Service</option>
            </select>
          </label>
          <nf-input
            label="Prix unitaire (optionnel)"
            type="number"
            [ngModel]="prixUnitaire()"
            (ngModelChange)="prixUnitaire.set($event)">
          </nf-input>
        </div>

        <footer>
          <nf-button variant="secondary" (clicked)="close()">Annuler</nf-button>
          <nf-button variant="primary" [disabled]="!name().trim() || saving()" (clicked)="createItem()">
            Créer et lier
          </nf-button>
        </footer>
      }
    </div>
  `,
  styles: [`
    .dialog-shell { display: grid; gap: 1rem; padding: 1.25rem; min-width: min(36rem, 92vw); }
    header { display: flex; justify-content: space-between; gap: 1rem; align-items: start; }
    header h2 { margin: 0; font-size: 1.125rem; }
    .subtitle { margin: 0; color: var(--nf-color-text-secondary); font-size: 0.9rem; }
    .tabs { display: flex; gap: 0.5rem; }
    .search-row { display: flex; gap: 0.5rem; align-items: end; }
    .search-row nf-input { flex: 1 1 auto; }
    .hint { color: var(--nf-color-text-secondary); font-size: 0.875rem; margin: 0; }
    .candidates { list-style: none; margin: 0; padding: 0; max-height: 16rem; overflow: auto; border: 1px solid var(--nf-color-border); border-radius: 0.5rem; }
    .candidates li { display: flex; gap: 0.75rem; align-items: center; padding: 0.5rem 0.75rem; cursor: pointer; border-bottom: 1px solid var(--nf-color-border); }
    .candidates li:last-child { border-bottom: none; }
    .candidates li.selected { background: var(--nf-color-primary-50, #eff6ff); }
    .c-code { font-weight: 600; min-width: 5rem; }
    .c-name { flex: 1 1 auto; }
    .c-type { font-size: 0.75rem; color: var(--nf-color-text-secondary); }
    .field { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.875rem; }
    .field select { padding: 0.625rem 0.75rem; border: 1px solid var(--nf-color-border); border-radius: 8px; font: inherit; background: var(--nf-color-surface); }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.25rem; }
  `],
})
export class CatalogLinkDialogComponent {
  private readonly dialogRef =
    inject(MatDialogRef<CatalogLinkDialogComponent, CatalogLinkDialogResult | null>);
  readonly data = inject<CatalogLinkDialogData>(MAT_DIALOG_DATA);
  private readonly api = inject(ConsultationApiService);

  readonly tab = signal<'link' | 'create'>('link');
  readonly query = signal(this.data.designation ?? '');
  readonly searching = signal(false);
  readonly searched = signal(false);
  readonly candidates = signal<CatalogCandidate[]>([]);
  readonly selectedItemId = signal<string | null>(null);
  readonly saving = signal(false);

  readonly name = signal(this.data.designation ?? '');
  readonly code = signal('');
  readonly unite = signal(this.data.unite ?? '');
  readonly articleType = signal(
    this.data.type === 'SERVICE' || this.data.type === 'SOUS_TRAITANCE' ? 'PRESTATION' : 'MATERIAU',
  );
  readonly prixUnitaire = signal('');

  readonly isNoeud = computed(() => this.data.target === 'noeud');

  constructor() {
    void this.search();
  }

  async search(): Promise<void> {
    this.searching.set(true);
    try {
      const results = await this.api.candidates(this.query().trim(), this.data.type, 15);
      this.candidates.set(results);
    } catch {
      this.candidates.set([]);
    } finally {
      this.searched.set(true);
      this.searching.set(false);
    }
  }

  async link(): Promise<void> {
    const itemId = this.selectedItemId();
    if (!itemId || this.saving()) return;
    this.saving.set(true);
    try {
      if (this.isNoeud()) {
        await this.api.linkNoeud(this.data.targetId, { itemId });
      } else {
        await this.api.linkComposant(this.data.targetId, { itemId });
      }
      this.dialogRef.close({ linked: true });
    } catch {
      this.saving.set(false);
    }
  }

  async createItem(): Promise<void> {
    if (!this.name().trim() || this.saving()) return;
    this.saving.set(true);
    const body = {
      name: this.name().trim(),
      code: this.code().trim() || undefined,
      unite: this.unite().trim() || undefined,
      articleType: this.articleType(),
      prixUnitaire: this.prixUnitaire() ? Number(this.prixUnitaire()) : undefined,
    };
    try {
      if (this.isNoeud()) {
        await this.api.createItemForNoeud(this.data.targetId, body);
      } else {
        await this.api.createItemForComposant(this.data.targetId, body);
      }
      this.dialogRef.close({ linked: true });
    } catch {
      this.saving.set(false);
    }
  }

  close(): void {
    this.dialogRef.close(null);
  }
}
