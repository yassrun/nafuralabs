import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { ButtonComponent } from '@lib/anatomy';

import { ConsultationApiService } from '../../services';
import type { ImportTree } from '../../models';

export interface UploadBordereauDialogData {
  consultationId: string;
  /** 'bordereau' (default) builds the tree; 'descriptif' enriches existing postes from the CPS. */
  purpose?: 'bordereau' | 'descriptif';
}

export interface UploadBordereauDialogResult {
  imported: true;
  /** Present only for the descriptif pass. */
  descriptifReport?: { postesTotal: number; matched: number; unmatchedCodes: string[] };
}

const SAMPLE_TREE = `{
  "arbre": [
    {
      "type": "LOT",
      "code": "L01",
      "libelle": "Gros oeuvre",
      "enfants": [
        {
          "type": "POSTE",
          "code": "1.1",
          "libelle": "Beton dose a 350 kg/m3",
          "unite": "m3",
          "quantite": 120,
          "mode": "FOURNI"
        }
      ]
    }
  ]
}`;

@Component({
  selector: 'app-upload-bordereau-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, TranslateModule, ButtonComponent],
  template: `
    <div class="dialog-shell">
      <header>
        <h2>{{ isDescriptif() ? 'Extraire les descriptifs (CPS)' : 'Importer le bordereau' }}</h2>
        <nf-button variant="ghost" icon="x" (clicked)="close()" aria-label="Fermer"></nf-button>
      </header>

      @if (isDescriptif()) {
        <p class="hint">
          Chargez le CPS / CCTP complet. Les descriptifs techniques (type de béton, dosage,
          normes…) sont extraits par lots de postes et rattachés aux postes existants.
          L'opération peut prendre quelques minutes selon la taille du document.
        </p>
        <input type="file" accept=".pdf,.doc,.docx" (change)="onFileSelected($event)" />
        @if (fileName()) { <p class="file">{{ fileName() }}</p> }
        @if (busy()) { <p class="hint">Extraction en cours, merci de patienter…</p> }
        @if (report()) {
          <p class="report">{{ report()!.matched }} / {{ report()!.postesTotal }} postes enrichis.</p>
        }
        @if (error()) { <p class="error">{{ error() }}</p> }
        <footer>
          <nf-button variant="secondary" (clicked)="close()">Fermer</nf-button>
          <nf-button variant="primary" [disabled]="!file() || busy()" (clicked)="upload()">
            {{ busy() ? 'Extraction…' : 'Extraire les descriptifs' }}
          </nf-button>
        </footer>
      } @else {
      <div class="tabs">
        <nf-button [variant]="tab() === 'upload' ? 'primary' : 'secondary'" (clicked)="tab.set('upload')">
          Upload (extraction auto)
        </nf-button>
        <nf-button [variant]="tab() === 'manual' ? 'primary' : 'secondary'" (clicked)="tab.set('manual')">
          Import manuel (JSON)
        </nf-button>
      </div>

      @if (tab() === 'upload') {
        <p class="hint">
          Chargez le bordereau (PDF ou tableur). L'extraction construit l'arbre lots / postes.
          Si l'extraction n'est pas disponible, utilisez l'import manuel.
        </p>
        <input type="file" accept=".pdf,.xlsx,.xls,.csv" (change)="onFileSelected($event)" />
        @if (fileName()) { <p class="file">{{ fileName() }}</p> }
        @if (error()) { <p class="error">{{ error() }}</p> }
        <footer>
          <nf-button variant="secondary" (clicked)="close()">Annuler</nf-button>
          <nf-button variant="primary" [disabled]="!file() || busy()" (clicked)="upload()">
            Extraire
          </nf-button>
        </footer>
      } @else {
        <p class="hint">Collez l'arbre au format JSON ({{ '{ arbre: [...] }' }}).</p>
        <textarea
          rows="14"
          [ngModel]="manualJson()"
          (ngModelChange)="manualJson.set($event)"
          spellcheck="false"></textarea>
        @if (error()) { <p class="error">{{ error() }}</p> }
        <footer>
          <nf-button variant="ghost" (clicked)="loadSample()">Exemple</nf-button>
          <nf-button variant="secondary" (clicked)="close()">Annuler</nf-button>
          <nf-button variant="primary" [disabled]="busy()" (clicked)="importManual()">
            Importer
          </nf-button>
        </footer>
      }
      }
    </div>
  `,
  styles: [`
    .dialog-shell { display: grid; gap: 1rem; padding: 1.25rem; min-width: min(40rem, 92vw); }
    header { display: flex; justify-content: space-between; gap: 1rem; align-items: start; }
    header h2 { margin: 0; font-size: 1.125rem; }
    .tabs { display: flex; gap: 0.5rem; }
    .hint { color: var(--nf-color-text-secondary); font-size: 0.875rem; margin: 0; }
    .file { font-size: 0.875rem; font-weight: 600; margin: 0; }
    .error { color: var(--nf-color-danger, #dc2626); font-size: 0.875rem; margin: 0; }
    .report { color: var(--nf-color-success, #16a34a); font-weight: 600; font-size: 0.875rem; margin: 0; }
    textarea { width: 100%; font-family: monospace; font-size: 0.8125rem; padding: 0.75rem; border: 1px solid var(--nf-color-border); border-radius: 8px; resize: vertical; }
    footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.25rem; }
  `],
})
export class UploadBordereauDialogComponent {
  private readonly dialogRef =
    inject(MatDialogRef<UploadBordereauDialogComponent, UploadBordereauDialogResult | null>);
  readonly data = inject<UploadBordereauDialogData>(MAT_DIALOG_DATA);
  private readonly api = inject(ConsultationApiService);

  readonly tab = signal<'upload' | 'manual'>('upload');
  readonly file = signal<File | null>(null);
  readonly fileName = signal('');
  readonly manualJson = signal('');
  readonly busy = signal(false);
  readonly error = signal('');
  readonly report = signal<{ postesTotal: number; matched: number; unmatchedCodes: string[] } | null>(null);

  isDescriptif(): boolean {
    return this.data.purpose === 'descriptif';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selected = input.files?.[0] ?? null;
    this.file.set(selected);
    this.fileName.set(selected?.name ?? '');
    this.error.set('');
    this.report.set(null);
  }

  async upload(): Promise<void> {
    const f = this.file();
    if (!f || this.busy()) return;
    if (this.isDescriptif()) {
      return this.uploadDescriptifs(f);
    }
    this.busy.set(true);
    this.error.set('');
    try {
      await this.api.extract(this.data.consultationId, f);
      this.dialogRef.close({ imported: true });
    } catch (e) {
      const err = e as { status?: number; error?: { message?: string } };
      const status = err?.status;
      const backendMsg = err?.error?.message ?? '';
      const isTimeout = /timed out|timeout|EXTRACTION_TIMEOUT/i.test(backendMsg);
      if (status === 501) {
        this.error.set("Extraction indisponible sur ce serveur. Basculez sur l'import manuel.");
        this.tab.set('manual');
      } else if (status === 413) {
        this.error.set(
          'Fichier trop volumineux pour le serveur (limite upload). Réessayez avec un bordereau plus léger, ou utilisez l’import manuel.',
        );
      } else if (isTimeout || status === 409 || status === 504) {
        this.error.set(
          "L'extraction IA a expiré (document trop volumineux ou scanné). Réessayez avec un bordereau seul (PDF/tableur plus léger), ou utilisez l'import manuel.",
        );
        this.tab.set('manual');
      } else if (!status) {
        this.error.set(
          "Échec réseau (souvent limite taille fichier). Réessayez ou passez à l'import manuel.",
        );
      } else {
        this.error.set(backendMsg || "Échec de l'extraction du fichier.");
      }
      this.busy.set(false);
    }
  }

  private async uploadDescriptifs(f: File): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    this.report.set(null);
    try {
      const result = await this.api.extractDescriptifs(this.data.consultationId, f);
      this.report.set({
        postesTotal: result.postesTotal,
        matched: result.matched,
        unmatchedCodes: result.unmatchedCodes ?? [],
      });
      this.busy.set(false);
      this.dialogRef.close({
        imported: true,
        descriptifReport: {
          postesTotal: result.postesTotal,
          matched: result.matched,
          unmatchedCodes: result.unmatchedCodes ?? [],
        },
      });
    } catch (e) {
      const err = e as { status?: number; error?: { message?: string } };
      const status = err?.status;
      const backendMsg = err?.error?.message ?? '';
      if (status === 501) {
        this.error.set('Extraction des descriptifs indisponible sur ce serveur.');
      } else if (status === 400) {
        this.error.set(backendMsg || "Importez d'abord le bordereau avant d'extraire les descriptifs.");
      } else if (status === 413) {
        this.error.set('Fichier trop volumineux pour le serveur (limite upload).');
      } else if (status === 504 || status === 409) {
        this.error.set(
          "L'extraction a expiré. Réessayez : les descriptifs déjà extraits sont conservés.",
        );
      } else if (!status) {
        this.error.set('Échec réseau. Réessayez.');
      } else {
        this.error.set(backendMsg || "Échec de l'extraction des descriptifs.");
      }
      this.busy.set(false);
    }
  }

  async importManual(): Promise<void> {
    if (this.busy()) return;
    let tree: ImportTree;
    try {
      tree = JSON.parse(this.manualJson()) as ImportTree;
    } catch {
      this.error.set('JSON invalide.');
      return;
    }
    if (!tree || !Array.isArray(tree.arbre)) {
      this.error.set('Le JSON doit contenir un tableau "arbre".');
      return;
    }
    this.busy.set(true);
    this.error.set('');
    try {
      await this.api.importTree(this.data.consultationId, tree);
      this.dialogRef.close({ imported: true });
    } catch {
      this.error.set("Échec de l'import.");
      this.busy.set(false);
    }
  }

  loadSample(): void {
    this.manualJson.set(SAMPLE_TREE);
  }

  close(): void {
    this.dialogRef.close(null);
  }
}
