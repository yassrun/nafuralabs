import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

import {
  ButtonComponent,
  PageHeaderComponent,
  PageShellComponent,
} from '@platform/lib/anatomy';
import type { PageHeaderConfig } from '@platform/lib/anatomy';

import { openCatalogItemPicker } from '@app/etudes/dossiers/components/catalog-item-pick-dialog/catalog-item-pick-dialog.component';
import { ConsultationAchatApiService } from '../services/consultation-achat-api.service';

export interface ConsultationPanierLigne {
  cleStable: string;
  code: string;
  name: string;
}

@Component({
  selector: 'app-consultation-create',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    PageShellComponent,
    PageHeaderComponent,
    ButtonComponent,
  ],
  templateUrl: './consultation-create.page.html',
  styleUrl: './consultation-create.page.scss',
})
export class ConsultationCreatePage {
  private readonly api = inject(ConsultationAchatApiService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly headerConfig: PageHeaderConfig = {
    title: 'Nouvelle consultation',
    subtitle: 'Hors étude — panier d’articles catalogue',
  };

  readonly panier = signal<ConsultationPanierLigne[]>([]);
  readonly saving = signal(false);
  readonly erreur = signal<string | undefined>(undefined);

  async addArticle(): Promise<void> {
    this.erreur.set(undefined);
    const result = await openCatalogItemPicker(this.dialog, {
      context: 'lookup',
      uniteOptions: [],
    });
    if (!result?.itemId) return;
    const cleStable = (result.cleStable || result.code || '').trim();
    if (!cleStable) {
      this.erreur.set('Article sans identité catalogue (cle_stable).');
      return;
    }
    if (this.panier().some((l) => l.cleStable === cleStable)) {
      this.erreur.set('Cet article est déjà dans le panier.');
      return;
    }
    this.panier.update((rows) => [
      ...rows,
      {
        cleStable,
        code: result.code?.trim() || cleStable,
        name: result.name?.trim() || cleStable,
      },
    ]);
  }

  removeArticle(index: number): void {
    this.panier.update((rows) => rows.filter((_, i) => i !== index));
    this.erreur.set(undefined);
  }

  async submit(): Promise<void> {
    const clesStables = this.panier()
      .map((l) => l.cleStable.trim())
      .filter(Boolean);
    if (!clesStables.length) {
      this.erreur.set('Ajoutez au moins un article au panier.');
      return;
    }
    this.saving.set(true);
    this.erreur.set(undefined);
    try {
      const created = await this.api.create({ clesStables });
      await this.router.navigateByUrl(`/achats/consultations/${created.id}`);
    } catch {
      this.erreur.set('Création impossible.');
    } finally {
      this.saving.set(false);
    }
  }

  cancel(): void {
    void this.router.navigateByUrl('/achats/consultations');
  }
}
