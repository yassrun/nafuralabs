import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ButtonComponent, PageHeaderComponent, PageShellComponent, ToastService, buildRouteBreadcrumbs } from '@lib/anatomy';
import { MoneyInputComponent } from '@lib/anatomy/components/atoms/money-input/money-input.component';

import type { FiscalSettings, FiscalTvaRate } from '../../../shell/fiscal-settings.service';
import { FiscalSettingsService } from '../../../shell/fiscal-settings.service';
import { TvaAutoliquidationService } from '../../../finance/services/tva-autoliquidation.service';

type TvaTaux = FiscalTvaRate;

@Component({
  selector: 'app-parametres-fiscal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TranslateModule, PageShellComponent, PageHeaderComponent, MoneyInputComponent, ButtonComponent],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig()"></nf-page-header>

      <form class="settings-form" (ngSubmit)="save()">
        <!-- Taux TVA -->
        <section class="section">
          <div class="section-header">
            <h2 class="section-title">Taux de TVA applicables</h2>
            <nf-button type="button" class="btn-add" (clicked)="addTaux()" variant="secondary">{{ 'admin.parametresFiscal.tva.addRate' | translate }}</nf-button>
          </div>
          <div class="tva-list">
            @for (t of tvaList(); track t.id; let i = $index) {
              <div class="tva-row" [class.tva-row--default]="t.isDefault">
                <div class="field field--sm">
                  <label>Taux %</label>
                  <nf-money-input [(ngModel)]="t.taux" [name]="'taux-'+i" [currency]="'%'" />
                </div>
                <div class="field">
                  <label>Libellé</label>
                  <input type="text" [(ngModel)]="t.libelle" [name]="'libelle-'+i" placeholder="Ex. TVA Standard" />
                </div>
                <div class="field field--wide">
                  <label>Application</label>
                  <input type="text" [(ngModel)]="t.description" [name]="'desc-'+i" placeholder="Ex. BTP standard, travaux neufs" />
                </div>
                <div class="field field--sm">
                  <label>Par défaut</label>
                  <input type="radio" [checked]="t.isDefault" (change)="setDefault(i)" [name]="'default-tva'" />
                </div>
                @if (!t.isDefault) {
                  <nf-button type="button" class="btn-remove" (clicked)="removeTaux(i)" variant="secondary">✕</nf-button>
                }
              </div>
            }
          </div>
        </section>

        <!-- RAS -->
        <section class="section">
          <h2 class="section-title">Retenue à la source (Art. 158 CGI)</h2>
          <div class="info-box">
            <p>La retenue à la source s'applique sur les travaux réalisés pour des personnes morales de droit public (État, CT, EEP). Elle est calculée sur le montant HT et déduite du net TTC.</p>
          </div>
          <div class="fields-grid">
            <div class="field">
              <label>Taux RAS (%)</label>
              <nf-money-input [(ngModel)]="settings.retenueSouceTaux" name="rasTaux" [currency]="'%'" />
            </div>
            <div class="field">
              <label>Seuil d'application (MAD HT)</label>
              <nf-money-input [(ngModel)]="settings.retenueSouceSeuil" name="rasSeuil" />
              <span class="field-hint">0 = applicable sans seuil minimum</span>
            </div>
          </div>
        </section>

        <!-- Timbre fiscal -->
        <section class="section">
          <h2 class="section-title">Timbre fiscal (Art. 252 CGI)</h2>
          <div class="info-box">
            <p>Le timbre fiscal s'applique sur les paiements en espèces dépassant le seuil défini. Il est plafonné au montant maximum configuré.</p>
          </div>
          <div class="fields-grid">
            <div class="field">
              <label>Taux timbre (%)</label>
              <nf-money-input [(ngModel)]="settings.timbreFiscalTaux" name="timbreTaux" [currency]="'%'" />
            </div>
            <div class="field">
              <label>Seuil paiement (MAD TTC)</label>
              <nf-money-input [(ngModel)]="settings.timbreFiscalSeuil" name="timbreSeuil" />
            </div>
            <div class="field">
              <label>Plafond timbre (MAD)</label>
              <nf-money-input [(ngModel)]="settings.timbreFiscalPlafond" name="timbrePlafond" />
            </div>
          </div>
        </section>

        <!-- Autoliquidation TVA -->
        <section class="section">
          <h2 class="section-title">Autoliquidation TVA (non-résidents)</h2>
          <div class="fields-grid">
            <div class="field">
              <label>Retenue TVA sur autoliquidation (% de la TVA déclarée)</label>
              <nf-money-input [(ngModel)]="settings.retenueTvaSurAutoliquidationTaux" name="retTvaAuto" [currency]="'%'" />
              <span class="field-hint">100 = retenue intégrale sur la TVA autoliquidée (démo) ; 0 = net fournisseur = HT sans retenue sur la TVA.</span>
            </div>
          </div>
          <div class="toggle-list toggle-list--spaced">
            <label class="toggle-item">
              <input type="checkbox" [(ngModel)]="settings.autoliquidationTvaActivee" name="autoliquid" />
              <div>
                <strong>Autoliquidation TVA</strong>
                <p>Applicable aux sous-traitants non-résidents ou certains services intracommunautaires.</p>
              </div>
            </label>
            <label class="toggle-item">
              <input type="checkbox" [(ngModel)]="settings.exonerationLogementSocial" name="exoLogement" />
              <div>
                <strong>Exonération logement social</strong>
                <p>TVA 14% pour logements dont superficie ≤ 100 m² et prix ≤ 250 000 MAD.</p>
              </div>
            </label>
          </div>
        </section>

        <div class="form-actions">
          <nf-button type="submit" class="btn-save" variant="primary">Sauvegarder les paramètres fiscaux</nf-button>
        </div>
      </form>

      <section class="section sim-section">
        <h2 class="section-title">Simulateur — TVA facture sous-traitance</h2>
        <p class="sim-hint">
          Après modification de l’option autoliquidation, cliquez sur <strong>Sauvegarder</strong> pour mettre à jour ce calcul (service partagé <code>TvaAutoliquidationService</code>).
        </p>
        <div class="fields-grid sim-grid">
          <div class="field">
            <label>Montant HT (MAD)</label>
            <nf-money-input [ngModel]="simHt()" (ngModelChange)="simHt.set($event ?? 0)" name="simHt" />
          </div>
          <div class="field">
            <label>Taux TVA (%)</label>
            <nf-money-input [ngModel]="simTaux()" (ngModelChange)="simTaux.set($event ?? 0)" name="simTaux" [currency]="'%'" />
          </div>
          <div class="field field--checkbox">
            <label class="inline-check">
              <input type="checkbox" [ngModel]="simNonResident()" (ngModelChange)="simNonResident.set(!!$event)" name="simNr" />
              Prestataire non résident au Maroc
            </label>
          </div>
        </div>
        <div class="sim-result" [class.sim-result--auto]="simResult().mode === 'AUTOLIQUIDATION'">
          <div><span>Mode</span><strong>{{ simResult().mode }}</strong></div>
          <div><span>Net à payer fournisseur</span><strong>{{ simResult().netAPayerFournisseur | number:'1.0-0' }} MAD</strong></div>
          <div><span>TVA sur facture</span><strong>{{ simResult().tvaSurFacture | number:'1.0-0' }} MAD</strong></div>
          <div><span>TVA autoliquidation (décl.)</span><strong>{{ simResult().tvaAutoliquidationDeclaree | number:'1.0-0' }} MAD</strong></div>
          <div><span>Retenue TVA</span><strong>{{ simResult().retenueTvaMontant | number:'1.0-0' }} MAD</strong></div>
          <p class="sim-libelle">{{ simResult().libelle }}</p>
        </div>
      </section>
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .settings-form { max-width: 860px; }
    .section { margin-bottom: 1.5rem; background: white; border: 1px solid var(--nf-color-border); border-radius: 0.875rem; padding: 1.25rem 1.5rem; }
    .sim-section code { font-size: 0.75rem; background: var(--nf-color-bg-muted); padding: 2px 6px; border-radius: 4px; }
    .sim-hint { font-size: 0.85rem; color: var(--nf-color-text-secondary); margin: 0 0 1rem; }
    .sim-grid { margin-bottom: 1rem; }
    .field--checkbox { justify-content: flex-end; }
    .inline-check { display: flex; align-items: center; gap: 8px; font-size: 0.88rem; color: var(--nf-text-primary); cursor: pointer; text-transform: none; letter-spacing: normal; font-weight: 500; }
    .sim-result { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.75rem; padding: 1rem; background: var(--nf-color-bg-subtle); border-radius: 0.5rem; border: 1px solid var(--nf-color-border); }
    .sim-result--auto { background: var(--nf-color-warning-50); border-color: var(--nf-color-warning-300); }
    .sim-result div span { display: block; font-size: 0.65rem; color: var(--nf-color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 2px; }
    .sim-result div strong { font-size: 0.95rem; color: var(--nf-text-primary); }
    .sim-libelle { grid-column: 1 / -1; margin: 0.5rem 0 0; font-size: 0.8rem; color: var(--nf-color-text-secondary); line-height: 1.4; }
    .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
    .section-title { margin: 0 0 1rem; font-size: 0.82rem; font-weight: 700; color: var(--nf-color-text-secondary); text-transform: uppercase; letter-spacing: 0.06em; }
    .info-box { background: var(--nf-color-primary-50); border: 1px solid var(--nf-color-primary-200); border-radius: 0.5rem; padding: 0.75rem 1rem; margin-bottom: 1rem; }
    .info-box p { margin: 0; font-size: 0.85rem; color: var(--nf-color-primary-700); }
    .fields-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field--sm { max-width: 120px; }
    .field--wide { min-width: 260px; }
    label:not(.toggle-item):not(.inline-check) { font-size: 11px; font-weight: 600; color: var(--nf-color-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
    .field-hint { font-size: 11px; color: var(--nf-color-text-muted); margin-top: 2px; }
    input[type="text"], input[type="number"] { padding: 8px 12px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 13px; background: white; }
    input[type="text"]:focus, input[type="number"]:focus { outline: none; border-color: var(--nf-color-teal-600, var(--nf-color-success-600)); box-shadow: 0 0 0 3px rgba(13,148,136,0.1); }
    .tva-list { display: flex; flex-direction: column; gap: 0.625rem; }
    .tva-row { display: flex; gap: 0.875rem; align-items: flex-end; padding: 0.75rem; border-radius: 0.625rem; background: var(--nf-color-bg-subtle); border: 1px solid var(--nf-color-border); flex-wrap: wrap; }
    .tva-row--default { background: var(--nf-color-success-50); border-color: var(--nf-color-success-200); }
    .btn-remove { background: none; border: 1px solid var(--nf-color-border); border-radius: 6px; padding: 4px 8px; color: var(--nf-color-text-secondary); cursor: pointer; font-size: 13px; }
    .btn-remove:hover { background: var(--nf-color-danger-100); color: var(--nf-color-danger-600); }
    .btn-add { padding: 5px 12px; border: 1px solid var(--nf-color-teal-600, var(--nf-color-success-600)); border-radius: 6px; color: var(--nf-color-teal-600, var(--nf-color-success-600)); background: none; font-size: 13px; font-weight: 600; cursor: pointer; }
    .toggle-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .toggle-list--spaced { margin-top: var(--nf-space-4, 1rem); }
    .toggle-item { display: flex; gap: 0.875rem; align-items: flex-start; cursor: pointer; padding: 0.75rem; border-radius: 0.5rem; }
    .toggle-item:hover { background: var(--nf-color-bg-subtle); }
    .toggle-item input[type="checkbox"] { width: 18px; height: 18px; margin-top: 3px; flex-shrink: 0; }
    .toggle-item strong { display: block; font-size: 0.9rem; color: var(--nf-text-primary); font-weight: 600; margin-bottom: 2px; }
    .toggle-item p { margin: 0; font-size: 0.82rem; color: var(--nf-color-text-secondary); }
    .form-actions { display: flex; justify-content: flex-end; padding-top: 0.5rem; }
    .btn-save { padding: 10px 24px; background: var(--nf-color-teal-600, var(--nf-color-success-600)); color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; }
    .btn-save:hover { background: var(--nf-color-teal-700, var(--nf-color-success-700)); }
  `],
})
export class ParametresFiscalPage implements OnInit {
  private readonly fiscal = inject(FiscalSettingsService);
  private readonly tvaAutoliquidation = inject(TvaAutoliquidationService);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly headerConfig = computed(() => {
    const crumbs = buildRouteBreadcrumbs(this.route);
    return {
      title: this.translate.instant('admin.parametresFiscal.title'),
      subtitle: this.translate.instant('admin.parametresFiscal.subtitle'),
      breadcrumbs:
        crumbs.length > 0
          ? crumbs
          : [
              { label: this.translate.instant('admin.common.breadcrumb.administration'), route: '/admin' },
              { label: this.translate.instant('admin.parametresFiscal.breadcrumb') },
            ],
    };
  });

  settings!: FiscalSettings;

  readonly simHt = signal(100_000);
  readonly simTaux = signal(20);
  readonly simNonResident = signal(true);

  readonly simResult = computed(() => {
    this.fiscal.settings();
    return this.tvaAutoliquidation.compute(this.simHt(), this.simTaux(), this.simNonResident());
  });

  readonly tvaList = signal<TvaTaux[]>([]);

  ngOnInit(): void {
    this.settings = this.fiscal.snapshot();
    this.tvaList.set(this.settings.tvaRates.map((t) => ({ ...t })));
  }

  addTaux(): void {
    this.tvaList.update((list) => [
      ...list,
      { id: `tva-${Date.now()}`, taux: 7, libelle: this.translate.instant('admin.parametresFiscal.tva.newRate.label'), description: '', isDefault: false },
    ]);
  }

  removeTaux(i: number): void {
    this.tvaList.update((list) => list.filter((_, idx) => idx !== i));
  }

  setDefault(i: number): void {
    this.tvaList.update((list) => list.map((t, idx) => ({ ...t, isDefault: idx === i })));
  }

  save(): void {
    const tvaRates = this.tvaList().map((t) => ({ ...t }));
    this.fiscal.save({ ...this.settings, tvaRates });
    this.toast.success(this.translate.instant('admin.parametresFiscal.toasts.settingsSavedToast'));
  }
}
