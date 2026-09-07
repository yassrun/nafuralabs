import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  ButtonComponent,
  LOOKUP_SEARCHERS,
  NfSelectComponent,
  ScreenComponent,
  type LookupSearchFn,
} from '@platform/lib/anatomy';
import { ChantierApiService } from '../../services/chantier-api.service';
import { AttachementApiService, type LienSignature } from '../attachement-api.service';
import type { Attachement, MeteoCode, ZoneChantier } from '../attachement.models';

/** AC-15 — figé dès la signature MOE et au-delà (miroir de AttachementChantier.STATUTS_FIGES). */
const STATUTS_FIGES = new Set([
  'SIGNE_MOE',
  'EN_ATTENTE_MOA',
  'CONTRESIGNE_MOA',
  'CONTESTE',
  'CLOS',
]);

@Component({
  selector: 'app-attachement-saisie',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterLink,
    ScreenComponent,
    ButtonComponent,
    NfSelectComponent,
    TranslateModule,
  ],
  template: `
    <nf-screen [header]="pageHeaderConfig" [scroll]="true">

      <div class="toolbar">
        <a routerLink="/chantiers/attachements" [queryParams]="backQueryParams()" class="link-back">← Liste</a>
      </div>

      @if (!result()) {
        <div class="form-grid">
          <label>Chantier
            <nf-select
              lookupKey="chantiers"
              [lookupSearch]="searchChantiers"
              [ngModel]="chantierId()"
              (ngModelChange)="onChantierChange($event)"
              [selectedLabel]="chantierSelectedLabel()"
              [placeholder]="'chantiers.common.fields.chantier' | translate"
            />
          </label>
          <label>{{ 'chantiers.attachement.saisie.periodeDebut' | translate }}
            <input class="ctrl" type="date" [value]="dateDebut()" (change)="dateDebut.set($any($event.target).value)" />
          </label>
          <label>{{ 'chantiers.attachement.saisie.periodeFin' | translate }}
            <input class="ctrl" type="date" [value]="dateFin()" (change)="dateFin.set($any($event.target).value)" />
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

        @if (errorMessage()) {
          <p class="error">{{ errorMessage() }}</p>
        }

        <div class="actions">
          <nf-button variant="primary" [loading]="montage()" [disabled]="montage() || !chantierId()" (clicked)="monter()">
            {{ montage() ? ('chantiers.attachement.saisie.montage' | translate) : ('chantiers.attachement.saisie.monterCta' | translate) }}
          </nf-button>
        </div>
      } @else {
        <p class="periode-recap">
          {{ result()!.numero }} — {{ result()!.dateDebut }} → {{ result()!.dateFin }}
        </p>

        <h3 class="h3">{{ 'chantiers.attachement.saisie.lignesTitle' | translate }}</h3>
        <table class="lignes-table">
          <thead><tr>
            <th>{{ 'chantiers.attachement.list.columns.code' | translate }}</th>
            <th>{{ 'chantiers.attachement.list.columns.designation' | translate }}</th>
            <th class="num">{{ 'chantiers.attachement.list.columns.qteExecutee' | translate }}</th>
            <th>{{ 'chantiers.attachement.list.columns.unite' | translate }}</th>
            <th>{{ 'chantiers.attachement.zone' | translate }}</th>
          </tr></thead>
          <tbody>
            @for (l of result()!.lignes; track l.id) {
              <tr>
                <td class="code">{{ l.code }}</td>
                <td>{{ l.designation }}</td>
                <td class="num">{{ l.quantitePeriode }}</td>
                <td>{{ l.unite }}</td>
                <td>
                  @if (figee()) {
                    {{ l.zoneLibelle ?? ('chantiers.attachement.saisie.sansZone' | translate) }}
                  } @else {
                    <select class="ctrl sm" [value]="l.zoneId ?? ''" (change)="assignerZone(l.id, $any($event.target).value)">
                      <option value="">{{ 'chantiers.attachement.saisie.sansZone' | translate }}</option>
                      @for (z of zones(); track z.id) { <option [value]="z.id">{{ z.designation }}</option> }
                    </select>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>

        @if (figee()) {
          <p class="hint">{{ 'chantiers.attachement.saisie.figeHint' | translate }}</p>
        } @else {
          <div class="actions">
            <nf-button variant="primary" [disabled]="submitting()" (clicked)="soumettre()">
              {{ 'chantiers.attachement.saisie.soumettreCta' | translate }}
            </nf-button>
            <nf-button variant="ghost" [disabled]="submitting()" (clicked)="contester()">
              {{ 'chantiers.attachement.saisie.contesterCta' | translate }}
            </nf-button>
            <nf-button variant="secondary" [disabled]="submitting()" (clicked)="genererLien()">
              {{ 'chantiers.attachement.saisie.lienSignatureCta' | translate }}
            </nf-button>
          </div>
          @if (lienSignature()) {
            <p class="hint">{{ 'chantiers.attachement.saisie.lienSignatureHint' | translate }}<br />
              <code>{{ lienSignature()!.url }}</code>
            </p>
          }
        }
      }
    </nf-screen>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .toolbar { margin-bottom: 1rem; }
    .link-back { font-size: 13px; color: var(--nf-color-primary-600); font-weight: 600; text-decoration: none; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-bottom: 1.25rem; }
    label { display: flex; flex-direction: column; gap: 4px; font-size: 11px; font-weight: 600; color: var(--nf-color-text-secondary); text-transform: uppercase; letter-spacing: 0.04em; }
    .ctrl { padding: 8px 10px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 14px; }
    .ctrl.sm { padding: 4px 6px; font-size: 12px; }
    .h3 { font-size: 0.95rem; margin: 1rem 0 0.5rem; color: var(--nf-text-primary); }
    .periode-recap { font-size: 13px; color: var(--nf-color-text-secondary); margin-bottom: 0.75rem; }
    .error { color: var(--nf-color-danger-700); font-size: 13px; margin: 0.5rem 0; }
    .hint { font-size: 12px; color: var(--nf-color-text-secondary); margin: 0.75rem 0; }
    .lignes-table { width: 100%; border-collapse: collapse; font-size: 12.5px; margin-bottom: 1rem; }
    .lignes-table th { padding: 6px 10px; background: var(--nf-color-bg-subtle); color: var(--nf-color-text-secondary); font-weight: 600; text-align: left; border-bottom: 1px solid var(--nf-color-border); }
    .lignes-table th.num { text-align: right; }
    .lignes-table td { padding: 5px 10px; border-bottom: 1px solid var(--nf-color-bg-muted); color: var(--nf-color-text-primary); }
    .lignes-table td.num { text-align: right; }
    .lignes-table td.code { font-family: monospace; font-size: 11px; color: var(--nf-color-text-secondary); }
    .actions { margin-top: 1rem; display: flex; gap: 0.5rem; }
  `],
})
export class AttachementSaisiePage {
  private readonly chantierApi = inject(ChantierApiService);
  private readonly attachementApi = inject(AttachementApiService);
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);
  private readonly lookupSearchers = inject(LOOKUP_SEARCHERS, { optional: true });

  readonly pageHeaderConfig = {
    title: this.translate.instant('chantiers.attachement.saisie.title'),
    subtitle: this.translate.instant('chantiers.attachement.saisie.subtitle'),
    breadcrumbs: [
      { label: 'Chantiers', route: '/chantiers' },
      { label: 'Attachements', route: '/chantiers/attachements' },
      { label: 'Nouveau' },
    ],
  };

  readonly searchChantiers: LookupSearchFn = (q) =>
    this.lookupSearchers?.['chantiers']?.(q) ?? Promise.resolve([]);

  readonly chantierId = signal('');
  readonly chantierSelectedLabel = signal('');
  readonly dateDebut = signal(new Date().toISOString().slice(0, 10));
  readonly dateFin = signal(new Date().toISOString().slice(0, 10));
  readonly meteo = signal<MeteoCode>('SOLEIL');
  readonly temperature = signal(22);
  readonly effectif = signal(12);

  readonly montage = signal(false);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly result = signal<Attachement | null>(null);
  readonly zones = signal<ZoneChantier[]>([]);
  readonly lienSignature = signal<LienSignature | null>(null);

  readonly figee = computed(() => {
    const r = this.result();
    return !!r && STATUTS_FIGES.has(r.status);
  });

  readonly backQueryParams = computed(() => {
    const chantierId = this.chantierId();
    return chantierId ? { chantierId } : undefined;
  });

  constructor() {
    const requestedChantierId = this.route.snapshot.queryParamMap.get('chantierId')?.trim() ?? '';
    if (requestedChantierId) {
      this.chantierId.set(requestedChantierId);
      void this.resolveChantierLabel(requestedChantierId);
    }
  }

  onChantierChange(id: string): void {
    this.chantierId.set(id ?? '');
    if (!id) {
      this.chantierSelectedLabel.set('');
      return;
    }
    void this.resolveChantierLabel(id);
  }

  private async resolveChantierLabel(id: string): Promise<void> {
    try {
      const c = await this.chantierApi.getById(id);
      this.chantierSelectedLabel.set(`${c.code} — ${c.name}`);
    } catch {
      this.chantierSelectedLabel.set(id);
    }
  }

  async monter(): Promise<void> {
    const cid = this.chantierId();
    if (!cid) return;
    this.montage.set(true);
    this.errorMessage.set(null);
    try {
      const created = await this.attachementApi.createForChantier(cid, {
        dateDebut: this.dateDebut(),
        dateFin: this.dateFin(),
        meteoCode: this.meteo(),
        temperatureC: this.temperature(),
        effectifPresent: this.effectif(),
      });
      this.result.set(created);
      this.zones.set(await this.attachementApi.listZones(cid));
    } catch (err) {
      this.errorMessage.set(this.messageFromError(err));
    } finally {
      this.montage.set(false);
    }
  }

  async assignerZone(ligneId: string, zoneId: string): Promise<void> {
    const r = this.result();
    if (!r) return;
    const updated = await this.attachementApi.assignerZone(r.id, ligneId, zoneId || null);
    this.result.set(updated);
  }

  async soumettre(): Promise<void> {
    const r = this.result();
    if (!r) return;
    this.submitting.set(true);
    try {
      this.result.set(await this.attachementApi.soumettreSignature(r.id));
    } finally {
      this.submitting.set(false);
    }
  }

  /** AC-19 — un jeton aléatoire, rendu une seule fois : perdu, on en régénère un autre. */
  async genererLien(): Promise<void> {
    const r = this.result();
    if (!r) return;
    this.lienSignature.set(await this.attachementApi.genererLienSignature(r.id));
  }

  async contester(): Promise<void> {
    const r = this.result();
    if (!r) return;
    this.submitting.set(true);
    try {
      this.result.set(await this.attachementApi.contester(r.id));
    } finally {
      this.submitting.set(false);
    }
  }

  private messageFromError(err: unknown): string {
    const httpError = err as { error?: { message?: string }; message?: string };
    const message = String(httpError?.error?.message ?? httpError?.message ?? '');
    if (message.includes('periode_sans_quantite')) {
      return this.translate.instant('chantiers.attachement.saisie.periodeSansQuantite');
    }
    if (message.includes('periode_chevauchante')) {
      return this.translate.instant('chantiers.attachement.saisie.periodeChevauchante');
    }
    return message || 'Erreur inattendue.';
  }
}
