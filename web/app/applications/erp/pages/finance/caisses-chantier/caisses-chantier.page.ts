import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { CaisseApiService } from '@applications/erp/finance/services/caisse-api.service';
import { ErpAttachmentUploadService } from '@applications/erp/shared/services/erp-attachment-upload.service';
import { ERP_ATTACHMENT_ENTITY_TYPES } from '@applications/erp/shared/config/attachment-detail.config';
import { PageHeaderComponent, PageShellComponent } from '@lib/anatomy';
import { ButtonComponent } from '@lib/anatomy/components';
import { MadCurrencyPipe } from '@lib/anatomy/pipes/mad-currency.pipe';
import type { CaisseChantier, MouvementCaisseChantier } from '@applications/erp/finance/models';

@Component({
  selector: 'app-caisses-chantier-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, PageShellComponent, PageHeaderComponent, ButtonComponent, MadCurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './caisses-chantier.page.html',
  styleUrl: '../_finance-r2.shared.scss',
})
export class CaissesChantierPage {
  private readonly api = inject(CaisseApiService);
  private readonly attachmentUpload = inject(ErpAttachmentUploadService);

  protected readonly caisses = signal<CaisseChantier[]>([]);
  protected readonly caisseId = signal('');
  protected readonly mouvements = signal<MouvementCaisseChantier[]>([]);
  protected readonly formType = signal<'DEPENSE' | 'AVANCE_RECUE'>('DEPENSE');
  protected readonly formMontant = signal(0);
  protected readonly formDesc = signal('');
  protected readonly formPhotoFile = signal<File | null>(null);
  protected readonly validatingId = signal<string | null>(null);

  constructor() {
    void this.init();
  }

  private async init(): Promise<void> {
    const list = await this.api.listChantier();
    this.caisses.set(list);
    if (list.length) {
      this.caisseId.set(list[0].id);
      await this.reloadMvt();
    }
  }

  async reloadMvt(): Promise<void> {
    const id = this.caisseId();
    if (!id) return;
    this.mouvements.set(await this.api.listMouvements(id));
    const list = await this.api.listChantier();
    this.caisses.set(list);
  }

  pickCaisse(id: string): void {
    this.caisseId.set(id);
    void this.reloadMvt();
  }

  async submit(): Promise<void> {
    const id = this.caisseId();
    const montant = this.formMontant();
    if (!id || !montant) return;
    if (this.formType() === 'DEPENSE' && !this.formPhotoFile()) return;
    const pendingId = crypto.randomUUID();
    let photoTicketUrl: string | undefined;
    const photoFile = this.formPhotoFile();
    if (photoFile) {
      photoTicketUrl = await this.attachmentUpload.uploadFile(
        ERP_ATTACHMENT_ENTITY_TYPES.CAISSE_MOUVEMENT,
        pendingId,
        photoFile,
      );
    }
    await this.api.createMouvement({
      caisseId: id,
      date: new Date().toISOString().slice(0, 10),
      type: this.formType(),
      montant,
      description: this.formDesc() || '—',
      photoTicketUrl,
    });
    this.formMontant.set(0);
    this.formDesc.set('');
    this.formPhotoFile.set(null);
    await this.reloadMvt();
  }

  canValider(m: MouvementCaisseChantier): boolean {
    return m.status !== 'VALIDE' && m.status !== 'REJETE';
  }

  async valider(m: MouvementCaisseChantier): Promise<void> {
    if (!this.canValider(m) || this.validatingId()) return;
    this.validatingId.set(m.id);
    try {
      await this.api.validerMouvement(m.id);
      await this.reloadMvt();
    } finally {
      this.validatingId.set(null);
    }
  }

  onPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.formPhotoFile.set(file);
  }

  justificatifUrl(key: string | undefined): string | null {
    if (!key || !this.attachmentUpload.isStorageKey(key)) {
      return key ?? null;
    }
    return this.attachmentUpload.resolveDownloadUrl(key);
  }

  openJustificatif(key: string | undefined): void {
    const url = this.justificatifUrl(key);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
}
