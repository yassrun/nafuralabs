import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { ButtonComponent, PageHeaderComponent, PageShellComponent } from '@lib/anatomy';
import type { Chantier } from '../../../../chantiers/models';
import { ChantierApiService } from '../../services/chantier-api.service';
import { AttachementApiService } from '../attachement-api.service';
import type { AttachementLigne, MeteoCode } from '../attachement.models';

@Component({
  selector: 'app-attachement-saisie',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink, PageShellComponent, PageHeaderComponent, ButtonComponent, TranslateModule],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="pageHeaderConfig"></nf-page-header>

      <div class="toolbar">
        <a routerLink="/chantiers/attachements" class="link-back">← Liste</a>
      </div>

      <div class="form-grid">
        <label>Chantier
          <select class="ctrl" [value]="chantierId()" (change)="chantierId.set($any($event.target).value)">
            @for (c of chantiers(); track c.id) {
              <option [value]="c.id">{{ c.code }} — {{ c.name }}</option>
            }
          </select>
        </label>
        <label>Date
          <input class="ctrl" type="date" [value]="date()" (change)="date.set($any($event.target).value)" />
        </label>
        <label>Météo
          <select class="ctrl" [value]="meteo()" (change)="meteo.set($any($event.target).value)">
            <option value="SOLEIL">{{ 'chantiers.attachement.saisie.meteoEnsoleille' | translate }}</option>
            <option value="NUAGEUX">Nuageux</option>
            <option value="PLUIE">Pluie</option>
            <option value="VENT">Vent fort</option>
          </select>
        </label>
        <label>Temp. (°C)
          <input class="ctrl" type="number" [value]="temperature()" (input)="temperature.set(+$any($event.target).value)" />
        </label>
        <label>Effectif présent
          <input class="ctrl" type="number" min="0" [value]="effectif()" (input)="effectif.set(+$any($event.target).value)" />
        </label>
      </div>

      <h3 class="h3">{{ 'chantiers.attachement.saisie.lignesExecutees' | translate }}</h3>
      @for (ligne of lignes(); track $index; let i = $index) {
        <div class="ligne">
          <input class="ctrl sm" placeholder="Poste" [(ngModel)]="ligne.posteCode" [name]="'pc'+i" />
          <input class="ctrl grow" [placeholder]="'chantiers.attachement.saisie.designationPlaceholder' | translate" [(ngModel)]="ligne.designation" [name]="'d'+i" />
          <input class="ctrl xs" type="number" placeholder="Qté" [(ngModel)]="ligne.quantiteExecutee" [name]="'q'+i" />
          <input class="ctrl sm" [placeholder]="'chantiers.attachement.saisie.unitePlaceholder' | translate" [(ngModel)]="ligne.unite" [name]="'u'+i" />
          <input class="ctrl grow" placeholder="Zone" [(ngModel)]="ligne.zone" [name]="'z'+i" />
          <nf-button variant="danger" icon="x" (clicked)="removeLigne(i)" [disabled]="lignes().length <= 1"></nf-button>
        </div>
      }
      <nf-button variant="secondary" icon="plus" iconLibrary="lucide" class="btn-add" (clicked)="addLigne()">{{ 'chantiers.attachement.saisie.addLine' | translate }}</nf-button>

      <h3 class="h3">{{ 'chantiers.attachement.saisie.signatureMoeTitle' | translate }}</h3>
      <p class="hint">{{ 'chantiers.attachement.saisie.signatureMoeHint' | translate }}</p>
      <div class="sign-wrap">
        <canvas #sig class="sig-canvas" width="440" height="160"
          (pointerdown)="onSignStart($event)"
          (pointermove)="onSignMove($event)"
          (pointerup)="onSignEnd($event)"
          (pointerleave)="onSignEnd($event)"></canvas>
        <nf-button variant="ghost" class="btn-clear" (clicked)="clearSignature()">Effacer signature</nf-button>
      </div>

      <div class="actions">
        <nf-button variant="primary" [loading]="saving()" [disabled]="saving()" (clicked)="save()">
          {{ saving() ? 'Enregistrement…' : 'Enregistrer brouillon' }}
        </nf-button>
      </div>
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .toolbar { margin-bottom: 1rem; }
    .link-back { font-size: 13px; color: var(--nf-color-primary-600); font-weight: 600; text-decoration: none; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-bottom: 1.25rem; }
    label { display: flex; flex-direction: column; gap: 4px; font-size: 11px; font-weight: 600; color: var(--nf-color-text-secondary); text-transform: uppercase; letter-spacing: 0.04em; }
    .ctrl { padding: 8px 10px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 14px; }
    .h3 { font-size: 0.95rem; margin: 1rem 0 0.5rem; color: var(--nf-text-primary); }
    .ligne { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 8px; }
    .grow { flex: 1; min-width: 140px; }
    .sm { width: 100px; }
    .xs { width: 72px; }
    .btn-add { margin: 8px 0 1rem; }
    .hint { font-size: 12px; color: var(--nf-color-text-secondary); margin: 0 0 8px; }
    .sign-wrap { display: flex; flex-direction: column; gap: 8px; align-items: flex-start; margin-bottom: 1.5rem; }
    .sig-canvas { touch-action: none; border: 1px solid var(--nf-color-border); border-radius: 8px; background: var(--nf-color-bg-subtle); max-width: 100%; }
    .btn-clear { font-size: 12px; }
    .actions { margin-top: 1rem; }
  `],
})
export class AttachementSaisiePage {
  private readonly chantierApi = inject(ChantierApiService);
  private readonly attachementApi = inject(AttachementApiService);
  private readonly router = inject(Router);

  readonly pageHeaderConfig = {
    title: "Saisie carnet d'attachement",
    subtitle: 'Terrain — quantités exécutées + visa MOE',
    breadcrumbs: [
      { label: 'Chantiers', route: '/chantiers' },
      { label: 'Attachements', route: '/chantiers/attachements' },
      { label: 'Saisie' },
    ],
  };

  readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('sig');

  private readonly chantiersList = signal<Chantier[]>([]);

  readonly chantiers = computed(() => this.chantiersList());

  readonly chantierId = signal('');
  readonly date = signal(new Date().toISOString().slice(0, 10));
  readonly meteo = signal<MeteoCode>('SOLEIL');
  readonly temperature = signal(22);
  readonly effectif = signal(12);
  readonly lignes = signal<AttachementLigne[]>([
    { posteCode: '', designation: '', quantiteExecutee: 0, unite: 'm²', zone: '' },
  ]);
  readonly saving = signal(false);

  private drawing = false;

  constructor() {
    void this.chantierApi.getAll().then(({ items }) => {
      const active = items.filter((c) => c.status === 'EN_COURS');
      this.chantiersList.set(active);
      if (active.length) {
        this.chantierId.set(active[0].id);
      }
    });
  }

  addLigne(): void {
    this.lignes.update((l) => [...l, { posteCode: '', designation: '', quantiteExecutee: 0, unite: 'u', zone: '' }]);
  }

  removeLigne(i: number): void {
    this.lignes.update((l) => l.filter((_, idx) => idx !== i));
  }

  onSignStart(ev: PointerEvent): void {
    const c = this.canvasRef()?.nativeElement;
    if (!c) return;
    c.setPointerCapture(ev.pointerId);
    this.drawing = true;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const r = c.getBoundingClientRect();
    const x = ev.clientX - r.left;
    const y = ev.clientY - r.top;
    ctx.strokeStyle = 'var(--nf-text-primary)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  onSignMove(ev: PointerEvent): void {
    if (!this.drawing) return;
    const c = this.canvasRef()?.nativeElement;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    const r = c.getBoundingClientRect();
    ctx.lineTo(ev.clientX - r.left, ev.clientY - r.top);
    ctx.stroke();
  }

  onSignEnd(ev: PointerEvent): void {
    if (!this.drawing) return;
    this.drawing = false;
    try {
      this.canvasRef()?.nativeElement.releasePointerCapture(ev.pointerId);
    } catch { /* noop */ }
  }

  clearSignature(): void {
    const c = this.canvasRef()?.nativeElement;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
  }

  async save(): Promise<void> {
    const cid = this.chantierId();
    const c = this.chantiersList().find(x => x.id === cid);
    if (!c) return;
    this.saving.set(true);
    const canvas = this.canvasRef()?.nativeElement;
    const sig = canvas ? canvas.toDataURL('image/png') : undefined;
    const lignes = this.lignes().filter(l => l.posteCode.trim() || l.designation.trim());
    try {
      await this.attachementApi.createForChantier(c.id, {
        date: this.date(),
        meteoCode: this.meteo(),
        temperatureC: this.temperature(),
        effectifPresent: this.effectif(),
        lignes: lignes.length ? lignes : [{ posteCode: '—', designation: 'Saisie terrain', quantiteExecutee: 0, unite: 'u', zone: '' }],
        signatureMoeDataUrl: sig && sig.length > 100 ? sig : undefined,
      });
      void this.router.navigate(['/chantiers/attachements']);
    } finally {
      this.saving.set(false);
    }
  }
}
