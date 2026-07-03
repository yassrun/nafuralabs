import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ButtonComponent, PageHeaderComponent, PageShellComponent } from '@lib/anatomy';
import { IceInputComponent } from '@lib/anatomy/components/atoms/ice-input/ice-input.component';
import { RibInputComponent } from '@lib/anatomy/components/atoms/rib-input/rib-input.component';
import { PhoneMaInputComponent } from '@lib/anatomy/components/atoms/phone-ma-input/phone-ma-input.component';

import { ETABLISSEMENT_TYPE_KEYS, FORME_JURIDIQUE_KEYS } from '@applications/erp/shell/i18n-labels';
import { SocieteService } from '../../../shell/societe.service';
import { BANQUES_MA } from '../../../shared/data';
import {
  EtablissementType,
  Societe,
  SocieteFormeJuridique,
} from './models';

/**
 * Per-société editable extras (capital, contact, RIBs…).
 * The legal identity (raison sociale, ICE, IF, RC, etc.) is the source of truth
 * in `SocieteService` ; here we only persist what is *not* in the canonical model.
 */
interface SocieteExtras {
  capitalSocial: number;
  codePostal: string;
  telephone: string;
  email: string;
  siteWeb: string;
  ribs: RibBancaire[];
  /** Ex. MAD — référence comptable / reporting groupe. */
  deviseReference: string;
  /** 1–12 : mois de clôture de l'exercice (affichage / exports). */
  moisClotureExercice: number;
  villeSiegeAffichee: string;
  paysSiege: string;
  representantLegalNom: string;
  representantLegalQualite: string;
  codeCourtGroupe: string;
}

interface RibBancaire {
  id: string;
  banque: string;
  rib: string;
  intitule: string;
  isPrincipal: boolean;
}

const EXTRAS_STORAGE_PREFIX = 'nafura-societe-extras-';
const BANQUES_MA_RAISONS_SOCIALES = BANQUES_MA.map((b) => b.raisonSociale);

const DEFAULT_EXTRAS: SocieteExtras = {
  capitalSocial: 1_000_000,
  codePostal: '',
  telephone: '',
  email: '',
  siteWeb: '',
  ribs: [],
  deviseReference: 'MAD',
  moisClotureExercice: 12,
  villeSiegeAffichee: '',
  paysSiege: 'MA',
  representantLegalNom: '',
  representantLegalQualite: '',
  codeCourtGroupe: '',
};

function loadExtras(societeId: string): SocieteExtras {
  try {
    const raw = localStorage.getItem(EXTRAS_STORAGE_PREFIX + societeId);
    if (raw) return { ...DEFAULT_EXTRAS, ...(JSON.parse(raw) as Partial<SocieteExtras>) };
  } catch {
    /* noop */
  }
  return { ...DEFAULT_EXTRAS, ribs: [] };
}

function saveExtras(societeId: string, extras: SocieteExtras): void {
  try {
    localStorage.setItem(EXTRAS_STORAGE_PREFIX + societeId, JSON.stringify(extras));
  } catch {
    /* noop */
  }
}

@Component({
  selector: 'app-societe',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TranslateModule, PageShellComponent, PageHeaderComponent, IceInputComponent, RibInputComponent, PhoneMaInputComponent, ButtonComponent],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig"></nf-page-header>

      @if (saved()) {
        <div class="toast-success">{{ 'admin.societe.toasts.saved' | translate }}</div>
      }

      <!-- Listing des sociétés -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">{{ 'admin.societe.listing.title' | translate }}</h2>
          <span class="hint">{{ 'admin.societe.listing.hint' | translate:{ count: societes().length } }}</span>
        </div>
        <div class="table-wrap">
          <table class="societes-table">
            <thead>
              <tr>
                <th>{{ 'admin.societe.table.raisonSociale' | translate }}</th>
                <th>{{ 'admin.societe.table.forme' | translate }}</th>
                <th>{{ 'admin.societe.table.ice' | translate }}</th>
                <th>{{ 'admin.societe.table.rc' | translate }}</th>
                <th>{{ 'admin.societe.table.siege' | translate }}</th>
                <th>{{ 'admin.societe.table.etablissements' | translate }}</th>
                <th>{{ 'admin.societe.table.status' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (s of societes(); track s.id) {
                <tr
                  [class.is-selected]="s.id === selectedSocieteId()"
                  [class.is-current]="s.id === currentSocieteId()"
                  (click)="selectSociete(s.id)">
                  <td class="cell-raison">
                    <div class="cell-name">{{ s.raisonSociale }}</div>
                    @if (s.id === currentSocieteId()) {
                      <span class="badge-current">{{ 'admin.societe.table.active' | translate }}</span>
                    }
                  </td>
                  <td>{{ formeLabel(s.formeJuridique) }}</td>
                  <td class="cell-mono">{{ s.ice }}</td>
                  <td class="cell-mono">{{ s.rc }}</td>
                  <td>{{ s.siegeAdresse }}</td>
                  <td class="cell-center">{{ etabCount(s.id) }}</td>
                  <td>
                    @if (s.isActive) {
                      <span class="badge-active">{{ 'admin.societe.table.actif' | translate }}</span>
                    } @else {
                      <span class="badge-inactive">{{ 'admin.societe.table.inactif' | translate }}</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      @if (selectedSociete(); as soc) {
        <form class="settings-form" (ngSubmit)="save()">
          <div class="detail-banner">
            <div>
              <span class="detail-label">{{ 'admin.societe.detail.label' | translate }}</span>
              <h2 class="detail-title">{{ soc.raisonSociale }}</h2>
            </div>
            @if (soc.id !== currentSocieteId()) {
              <nf-button type="button" class="btn-activate" (clicked)="setActive(soc.id)" variant="secondary">
                {{ 'admin.societe.detail.activate' | translate }}
              </nf-button>
            }
          </div>

          <!-- Identification légale -->
          <section class="section">
            <h2 class="section-title">{{ 'admin.societe.identite.title' | translate }}</h2>
            <div class="fields-grid">
              <div class="field">
                <label>{{ 'admin.societe.identite.fields.raisonSociale' | translate }}</label>
                <input type="text" [ngModel]="soc.raisonSociale" name="nom" disabled />
              </div>
              <div class="field">
                <label>{{ 'admin.societe.identite.fields.formeJuridique' | translate }}</label>
                <input type="text" [ngModel]="formeLabel(soc.formeJuridique)" name="formeJuridique" disabled />
              </div>
              <div class="field">
                <label>{{ 'admin.societe.identite.fields.ice' | translate }}</label>
                <nf-ice-input [ngModel]="soc.ice" name="ice" disabled></nf-ice-input>
              </div>
              <div class="field">
                <label>{{ 'admin.societe.identite.fields.if' | translate }}</label>
                <input type="text" [ngModel]="soc.if" name="if_num" disabled />
              </div>
              <div class="field">
                <label>{{ 'admin.societe.identite.fields.rc' | translate }}</label>
                <input type="text" [ngModel]="soc.rc" name="rc" disabled />
              </div>
              <div class="field">
                <label>{{ 'admin.societe.identite.fields.patente' | translate }}</label>
                <input type="text" [ngModel]="soc.patente" name="patente" disabled />
              </div>
              <div class="field">
                <label>{{ 'admin.societe.identite.fields.cnss' | translate }}</label>
                <input type="text" [ngModel]="soc.cnss" name="cnss" disabled />
              </div>
              <div class="field">
                <label>{{ 'admin.societe.identite.fields.tvaIntra' | translate }}</label>
                <input type="text" [ngModel]="soc.tvaIntra || ''" name="tvaIntra" disabled />
              </div>
              <div class="field">
                <label>{{ 'admin.societe.identite.fields.capital' | translate }}</label>
                <input type="number" [(ngModel)]="extras.capitalSocial" name="capitalSocial" min="0" />
              </div>
            </div>
            <p class="hint hint--small">{{ 'admin.societe.identite.hint' | translate }}</p>
          </section>

          <section class="section">
            <h2 class="section-title">{{ 'admin.societe.extras.title' | translate }}</h2>
            <p class="hint hint--small">{{ 'admin.societe.extras.hint' | translate }}</p>
            <div class="fields-grid">
              <div class="field">
                <label>{{ 'admin.societe.extras.fields.codeCourtGroupe' | translate }}</label>
                <input type="text" [(ngModel)]="extras.codeCourtGroupe" name="codeCourt" maxlength="16" [placeholder]="'admin.societe.extras.fields.codeCourtPlaceholder' | translate" />
              </div>
              <div class="field">
                <label>{{ 'admin.societe.extras.fields.devise' | translate }}</label>
                <input type="text" [(ngModel)]="extras.deviseReference" name="devise" maxlength="8" />
              </div>
              <div class="field">
                <label>{{ 'admin.societe.extras.fields.moisCloture' | translate }}</label>
                <input type="number" [(ngModel)]="extras.moisClotureExercice" name="moisCloture" min="1" max="12" step="1" />
              </div>
              <div class="field">
                <label>{{ 'admin.societe.extras.fields.villeSiege' | translate }}</label>
                <input type="text" [(ngModel)]="extras.villeSiegeAffichee" name="villeSiege" />
              </div>
              <div class="field">
                <label>{{ 'admin.societe.extras.fields.paysSiege' | translate }}</label>
                <input type="text" [(ngModel)]="extras.paysSiege" name="paysSiege" maxlength="3" [placeholder]="'admin.societe.extras.fields.paysSiegePlaceholder' | translate" />
              </div>
              <div class="field">
                <label>{{ 'admin.societe.extras.fields.rlNom' | translate }}</label>
                <input type="text" [(ngModel)]="extras.representantLegalNom" name="rlNom" />
              </div>
              <div class="field">
                <label>{{ 'admin.societe.extras.fields.rlQualite' | translate }}</label>
                <input type="text" [(ngModel)]="extras.representantLegalQualite" name="rlQual" [placeholder]="'admin.societe.extras.fields.rlQualitePlaceholder' | translate" />
              </div>
            </div>
          </section>

          <!-- Coordonnées -->
          <section class="section">
            <h2 class="section-title">{{ 'admin.societe.contacts.title' | translate }}</h2>
            <div class="fields-grid">
              <div class="field field--full">
                <label>{{ 'admin.societe.identite.fields.adresse' | translate }}</label>
                <input type="text" [ngModel]="soc.siegeAdresse" name="adresseSiege" disabled />
              </div>
              <div class="field">
                <label>{{ 'admin.societe.contacts.fields.codePostal' | translate }}</label>
                <input type="text" [(ngModel)]="extras.codePostal" name="codePostal" />
              </div>
              <div class="field">
                <label>{{ 'admin.societe.contacts.fields.telephone' | translate }}</label>
                <nf-phone-ma-input [(ngModel)]="extras.telephone" name="telephone"></nf-phone-ma-input>
              </div>
              <div class="field">
                <label>{{ 'admin.societe.contacts.fields.email' | translate }}</label>
                <input type="email" [(ngModel)]="extras.email" name="email" />
              </div>
              <div class="field">
                <label>{{ 'admin.societe.contacts.fields.siteWeb' | translate }}</label>
                <input type="url" [(ngModel)]="extras.siteWeb" name="siteWeb" [placeholder]="'admin.societe.contacts.fields.sitePlaceholder' | translate" />
              </div>
            </div>
          </section>

          <!-- Établissements -->
          <section class="section">
            <h2 class="section-title">{{ 'admin.societe.etabs.title' | translate:{ count: etablissements().length } }}</h2>
            @if (etablissements().length === 0) {
              <p class="empty">{{ 'admin.societe.etabs.empty' | translate }}</p>
            } @else {
              <div class="etabs-list">
                @for (e of etablissements(); track e.id) {
                  <div class="etab-card" [class.is-current]="e.id === currentEtablissementId()">
                    <div class="etab-icon">{{ etabTypeIcon(e.type) }}</div>
                    <div class="etab-body">
                      <div class="etab-name">{{ e.nom }}</div>
                      <div class="etab-meta">{{ etabTypeLabel(e.type) }} · {{ e.ville }}</div>
                      <div class="etab-meta etab-addr">{{ e.adresse }}</div>
                    </div>
                    @if (e.id === currentEtablissementId()) {
                      <span class="badge-current">{{ 'admin.societe.table.actif' | translate }}</span>
                    }
                  </div>
                }
              </div>
            }
          </section>

          <!-- RIBs bancaires -->
          <section class="section">
            <div class="section-header">
              <h2 class="section-title">{{ 'admin.societe.ribs.title' | translate }}</h2>
              <nf-button type="button" class="btn-add" (clicked)="addRib()" variant="secondary">{{ 'admin.societe.ribs.addNew' | translate }}</nf-button>
            </div>
            @for (rib of extras.ribs; track rib.id; let i = $index) {
              <div class="rib-card">
                <div class="rib-fields">
                  <div class="field">
                    <label>{{ 'admin.societe.ribs.fields.banque' | translate }}</label>
                    <select [(ngModel)]="rib.banque" [name]="'banque-'+i">
                      @for (b of banques; track b) { <option [value]="b">{{ b }}</option> }
                    </select>
                  </div>
                  <div class="field">
                    <label>{{ 'admin.societe.ribs.fields.intitule' | translate }}</label>
                    <input type="text" [(ngModel)]="rib.intitule" [name]="'intitule-'+i" [placeholder]="'admin.societe.ribs.fields.intitulePlaceholder' | translate" />
                  </div>
                  <div class="field field--rib">
                    <label>{{ 'admin.societe.ribs.fields.rib' | translate }}</label>
                    <nf-rib-input [(ngModel)]="rib.rib" [name]="'rib-'+i"></nf-rib-input>
                  </div>
                  <div class="field field--sm">
                    <label>{{ 'admin.societe.ribs.fields.principal' | translate }}</label>
                    <input type="checkbox" [(ngModel)]="rib.isPrincipal" [name]="'principal-'+i" (change)="setPrincipal(i)" />
                  </div>
                </div>
                <nf-button type="button" class="btn-remove" (clicked)="removeRib(i)" [title]="'admin.societe.ribs.removeTitle' | translate" variant="secondary">✕</nf-button>
              </div>
            }
          </section>

          <div class="form-actions">
            <nf-button type="submit" class="btn-save" variant="primary">{{ 'admin.common.actions.save' | translate }}</nf-button>
          </div>
        </form>
      } @else {
        <p class="empty empty--page">{{ 'admin.societe.empty' | translate }}</p>
      }
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .toast-success { background: var(--nf-color-success-100); color: var(--nf-color-success-700); padding: 10px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; margin-bottom: 1rem; }
    .settings-form { max-width: 960px; }

    .section { margin-bottom: 1.5rem; background: white; border: 1px solid var(--nf-color-border); border-radius: 0.875rem; padding: 1.25rem 1.5rem; }
    .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; gap: 1rem; }
    .section-title { margin: 0 0 1rem; font-size: 0.82rem; font-weight: 700; color: var(--nf-color-text-secondary); text-transform: uppercase; letter-spacing: 0.06em; }
    .hint { font-size: 0.75rem; color: var(--nf-color-text-muted); }
    .hint--small { font-size: 0.72rem; color: var(--nf-color-text-muted); margin: 0.5rem 0 0; }
    .empty { font-size: 0.85rem; color: var(--nf-color-text-secondary); }
    .empty--page { padding: 1.5rem; text-align: center; background: white; border: 1px dashed var(--nf-color-border); border-radius: 0.875rem; }

    .table-wrap { overflow-x: auto; }
    .societes-table { width: 100%; border-collapse: collapse; font-size: 0.83rem; }
    .societes-table th { text-align: left; padding: 0.5rem 0.625rem; background: var(--nf-color-bg-subtle); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--nf-color-text-secondary); border-bottom: 1px solid var(--nf-color-border); }
    .societes-table td { padding: 0.625rem; border-bottom: 1px solid var(--nf-color-bg-muted); }
    .societes-table tbody tr { cursor: pointer; transition: background 80ms; }
    .societes-table tbody tr:hover { background: var(--nf-color-bg-subtle); }
    .societes-table tbody tr.is-selected { background: var(--nf-color-primary-50); }
    .societes-table tbody tr.is-current.is-selected { background: var(--nf-color-primary-100); }
    .cell-name { font-weight: 600; color: var(--nf-text-primary); }
    .cell-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 0.78rem; }
    .cell-center { text-align: center; }
    .cell-raison { display: flex; flex-direction: column; gap: 0.2rem; }

    .badge-current { display: inline-block; padding: 1px 6px; background: var(--nf-color-primary-700); color: white; border-radius: 4px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; align-self: flex-start; }
    .badge-active { padding: 2px 8px; background: var(--nf-color-success-100); color: var(--nf-color-success-700); border-radius: 9999px; font-size: 0.7rem; font-weight: 600; }
    .badge-inactive { padding: 2px 8px; background: var(--nf-color-danger-100); color: var(--nf-color-danger-700); border-radius: 9999px; font-size: 0.7rem; font-weight: 600; }

    .detail-banner { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.25rem; background: linear-gradient(135deg, rgba(13,148,136,0.06), rgba(255,255,255,0.98)); border: 1px solid rgba(13,148,136,0.2); border-radius: 0.875rem; margin-bottom: 1rem; }
    .detail-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--nf-color-text-secondary); }
    .detail-title { margin: 0.15rem 0 0; font-size: 1.1rem; font-weight: 800; color: var(--nf-text-primary); }
    .btn-activate { padding: 8px 14px; background: var(--nf-color-teal-600, var(--nf-color-success-600)); color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; }
    .btn-activate:hover { background: var(--nf-color-teal-700, var(--nf-color-success-700)); }

    .fields-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field--full { grid-column: 1 / -1; }
    .field--sm { min-width: 80px; max-width: 100px; }
    .field--rib { min-width: 280px; }
    label { font-size: 11px; font-weight: 600; color: var(--nf-color-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
    input[type="text"], input[type="email"], input[type="url"], input[type="number"], select {
      padding: 8px 12px; border: 1px solid var(--nf-color-border); border-radius: 6px; font-size: 13px; background: white;
    }
    input[type="text"]:focus, input[type="email"]:focus, input[type="url"]:focus, select:focus {
      outline: none; border-color: var(--nf-color-teal-600, var(--nf-color-success-600)); box-shadow: 0 0 0 3px rgba(13,148,136,0.1);
    }
    input[disabled] { background: var(--nf-color-bg-subtle); color: var(--nf-color-text-secondary); cursor: not-allowed; }
    input[type="checkbox"] { width: 18px; height: 18px; margin-top: 6px; cursor: pointer; }

    .etabs-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 0.75rem; }
    .etab-card { display: flex; align-items: center; gap: 0.75rem; padding: 0.875rem 1rem; background: var(--nf-color-bg-subtle); border: 1px solid var(--nf-color-border); border-radius: 0.75rem; }
    .etab-card.is-current { background: var(--nf-color-info-50, var(--nf-color-primary-50)); border-color: var(--nf-color-info-300, var(--nf-color-primary-300)); }
    .etab-icon { font-size: 1.4rem; }
    .etab-body { flex: 1; min-width: 0; }
    .etab-name { font-weight: 700; font-size: 0.88rem; color: var(--nf-text-primary); }
    .etab-meta { font-size: 0.74rem; color: var(--nf-color-text-secondary); }
    .etab-addr { font-size: 0.72rem; color: var(--nf-color-text-muted); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .rib-card { display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.875rem; background: var(--nf-color-bg-subtle); border-radius: 0.75rem; margin-bottom: 0.75rem; border: 1px solid var(--nf-color-border); }
    .rib-fields { flex: 1; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.875rem; }
    .btn-remove { background: none; border: 1px solid var(--nf-color-border); border-radius: 6px; padding: 4px 8px; color: var(--nf-color-text-secondary); cursor: pointer; white-space: nowrap; font-size: 13px; }
    .btn-remove:hover { background: var(--nf-color-danger-100); color: var(--nf-color-danger-600); border-color: var(--nf-color-danger-300); }
    .btn-add { padding: 5px 12px; border: 1px solid var(--nf-color-teal-600, var(--nf-color-success-600)); border-radius: 6px; color: var(--nf-color-teal-600, var(--nf-color-success-600)); background: none; font-size: 13px; font-weight: 600; cursor: pointer; }
    .btn-add:hover { background: var(--nf-color-success-50); }
    .form-actions { display: flex; justify-content: flex-end; padding-top: 0.5rem; }
    .btn-save { padding: 10px 24px; background: var(--nf-color-teal-600, var(--nf-color-success-600)); color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; }
    .btn-save:hover { background: var(--nf-color-teal-700, var(--nf-color-success-700)); }
  `],
})
export class SocietePage {
  private readonly societeService = inject(SocieteService);
  private readonly translate = inject(TranslateService);

  readonly banques = BANQUES_MA_RAISONS_SOCIALES;

  readonly headerConfig = {
    title: this.translate.instant('admin.societe.title'),
    subtitle: this.translate.instant('admin.societe.subtitle'),
    breadcrumbs: [
      { label: this.translate.instant('admin.common.breadcrumb.administration'), route: '/admin' },
      { label: this.translate.instant('admin.societe.breadcrumb') },
    ],
  };

  readonly societes = this.societeService.societes;
  readonly currentSocieteId = this.societeService.currentSocieteId;
  readonly currentEtablissementId = this.societeService.currentEtablissementId;

  /** Société currently *being edited* in the detail form (defaults to active société). */
  readonly selectedSocieteId = signal<string>(this.societeService.currentSocieteId());

  readonly selectedSociete = computed<Societe | null>(
    () => this.societes().find((s) => s.id === this.selectedSocieteId()) ?? null,
  );

  readonly etablissements = computed(
    () => this.societeService.getEtablissementsBySocieteId(this.selectedSocieteId()),
  );

  readonly saved = signal(false);

  /** Editable extras for the currently selected société. */
  extras: SocieteExtras = loadExtras(this.selectedSocieteId());

  selectSociete(id: string): void {
    if (id === this.selectedSocieteId()) return;
    this.selectedSocieteId.set(id);
    this.extras = loadExtras(id);
  }

  setActive(id: string): void {
    this.societeService.setCurrentSociete(id);
  }

  formeLabel(forme: SocieteFormeJuridique): string {
    const key = FORME_JURIDIQUE_KEYS[forme];
    return key ? this.translate.instant(key) : forme;
  }

  etabCount(societeId: string): number {
    return this.societeService.getEtablissementsBySocieteId(societeId).length;
  }

  etabTypeLabel(type: EtablissementType): string {
    const key = ETABLISSEMENT_TYPE_KEYS[type];
    return key ? this.translate.instant(key) : type;
  }

  etabTypeIcon(type: EtablissementType): string {
    switch (type) {
      case 'SIEGE': return '🏛';
      case 'FILIALE': return '🏢';
      case 'AGENCE': return '🏬';
      case 'CHANTIER_BASE': return '🏗';
      default: return '📍';
    }
  }

  addRib(): void {
    this.extras.ribs = [
      ...this.extras.ribs,
      {
        id: `rib-${Date.now()}`,
        banque: 'Attijariwafa Bank',
        rib: '',
        intitule: '',
        isPrincipal: this.extras.ribs.length === 0,
      },
    ];
  }

  removeRib(i: number): void {
    this.extras.ribs = this.extras.ribs.filter((_, idx) => idx !== i);
  }

  setPrincipal(i: number): void {
    this.extras.ribs = this.extras.ribs.map((r, idx) => ({ ...r, isPrincipal: idx === i }));
  }

  save(): void {
    saveExtras(this.selectedSocieteId(), this.extras);
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 3000);
  }
}
