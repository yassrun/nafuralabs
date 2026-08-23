import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ButtonComponent, PageHeaderComponent, PageShellComponent } from '@platform/lib/anatomy';
import type { PageHeaderConfig } from '@platform/lib/anatomy';
import {
  SmartImportTriggerComponent,
  type ReviewedExtraction,
} from '@platform/app/document-extraction/smart-import';

import {
  DEVIS_CONSULTATION_IMPORT_DEFINITION,
  DevisConsultationImportService,
} from '@app/socle/shared/smart-import/handlers/devis-consultation-import.handler';
import {
  ConsultationAchatApiService,
  type ConsultationAchat,
  type ConsultationDevisLigne,
} from '../services/consultation-achat-api.service';

@Component({
  selector: 'app-consultation-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageShellComponent,
    PageHeaderComponent,
    ButtonComponent,
    SmartImportTriggerComponent,
  ],
  templateUrl: './consultation-detail.page.html',
  styleUrl: './consultation-detail.page.scss',
})
export class ConsultationDetailPage {
  private readonly api = inject(ConsultationAchatApiService);
  private readonly importer = inject(DevisConsultationImportService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly importDefinition = DEVIS_CONSULTATION_IMPORT_DEFINITION;
  readonly item = signal<ConsultationAchat | undefined>(undefined);
  readonly chargement = signal(true);
  readonly erreur = signal<string | undefined>(undefined);
  readonly importHint = signal<string | undefined>(undefined);

  readonly headerConfig: PageHeaderConfig = {
    title: 'Consultation',
    subtitle: 'Importer le devis — Import magique extrait les lignes',
  };

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.chargement.set(false);
      this.erreur.set('Consultation introuvable.');
      return;
    }
    void this.load(id);
  }

  async load(id: string): Promise<void> {
    this.chargement.set(true);
    this.erreur.set(undefined);
    try {
      this.item.set(await this.api.getById(id));
    } catch {
      this.erreur.set('Impossible de charger la consultation.');
      this.item.set(undefined);
    } finally {
      this.chargement.set(false);
    }
  }

  async onSmartImportComplete(result: ReviewedExtraction): Promise<void> {
    const current = this.item();
    if (!current) {
      return;
    }
    this.importHint.set(undefined);
    try {
      const saved = await this.importer.persist(current.id, result.data, 'import');
      if (!saved) {
        this.importHint.set('Aucune ligne extraite — le fichier n’est pas un devis reçu.');
        return;
      }
      this.item.set(saved);
    } catch {
      this.erreur.set('Import impossible.');
    }
  }

  lignes(): ConsultationDevisLigne[] {
    return (this.item()?.devis ?? []).flatMap((d) => d.lignes ?? []);
  }

  statutLabel(): string {
    const row = this.item();
    if (!row) {
      return '';
    }
    if ((row.devisRecus ?? 0) > 0) {
      return `${row.devisRecus} devis reçu${row.devisRecus > 1 ? 's' : ''}`;
    }
    return '0 devis';
  }

  back(): void {
    void this.router.navigateByUrl('/achats/consultations');
  }
}
