
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { CompanyDocumentIdentityComponent } from './company-document-identity.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  ButtonComponent,
  ConfigDrivenSettingsPageStyles,
  PageHeaderComponent,
  PageShellComponent,
  TabsComponent,
  ToastService,
  VilleMaSelectComponent,
  type TabItem,
} from '@platform/lib/anatomy';
import {
  SmartImportActionComponent,
  type ReviewedExtraction,
} from '@platform/app/document-extraction/smart-import';
import {
  MODELE_J_IMPORT_DEFINITION,
  applyModeleJRow,
} from '@app/socle/shared/smart-import/handlers/modele-j-import.handler';
import { IceInputComponent } from '@platform/lib/anatomy/components/atoms/ice-input/ice-input.component';
import { RibInputComponent } from '@platform/lib/anatomy/components/atoms/rib-input/rib-input.component';
import { PhoneMaInputComponent } from '@platform/lib/anatomy/components/atoms/phone-ma-input/phone-ma-input.component';

import { ETABLISSEMENT_TYPE_KEYS, FORME_JURIDIQUE_KEYS } from '@app/socle/shell/i18n-labels';
import { SocieteService } from '../../shell/societe.service';
import { BANQUES_MA } from '../../shared/data';
import {
  EtablissementType,
  Societe,
  SocieteFormeJuridique,
} from './models';

type SocieteTab = 'identite' | 'identifiants' | 'etablissements' | 'documents';

/**
 * Per-société editable extras (capital, contact, RIBs…).
 * Legal identity lives on `Societe` and is persisted via `patchSociete`.
 */
interface SocieteExtras {
  capitalSocial: number;
  codePostal: string;
  telephone: string;
  email: string;
  siteWeb: string;
  ribs: RibBancaire[];
  deviseReference: string;
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

interface IdentityDraft {
  raisonSociale: string;
  formeJuridique: SocieteFormeJuridique;
  ice: string;
  if: string;
  rc: string;
  patente: string;
  cnss: string;
  tvaIntra: string;
  siegeAdresse: string;
}

const EXTRAS_STORAGE_PREFIX = 'nafura-societe-extras-';
const BANQUES_MA_RAISONS_SOCIALES = BANQUES_MA.map((b) => b.raisonSociale);
const FORMES = Object.keys(FORME_JURIDIQUE_KEYS) as SocieteFormeJuridique[];

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

function draftFrom(soc: Societe): IdentityDraft {
  return {
    raisonSociale: soc.raisonSociale,
    formeJuridique: soc.formeJuridique,
    ice: soc.ice,
    if: soc.if,
    rc: soc.rc,
    patente: soc.patente,
    cnss: soc.cnss,
    tvaIntra: soc.tvaIntra ?? '',
    siegeAdresse: soc.siegeAdresse,
  };
}

@Component({
  selector: 'app-societe',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    TranslateModule,
    PageShellComponent,
    PageHeaderComponent,
    TabsComponent,
    IceInputComponent,
    RibInputComponent,
    PhoneMaInputComponent,
    ButtonComponent,
    VilleMaSelectComponent,
    CompanyDocumentIdentityComponent,
    SmartImportActionComponent,
  ],
  template: `
    <nf-page-shell scroll>
      <nf-page-header [config]="headerConfig">
        <div actions>
          <nf-smart-import-action
            [definition]="modeleJDefinition"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            (completed)="onModeleJImported($event)" />
        </div>
      </nf-page-header>

      <nf-tabs
        [tabs]="tabs()"
        [activeTab]="activeTab()"
        (tabChange)="onTabChange($event)">
      </nf-tabs>

      <div class="nf-settings-content">
        @if (societes().length > 1) {
          <div class="org-bar">
            <label class="org-bar__label" for="societe-selector">
              {{ 'admin.societe.selector.label' | translate }}
            </label>
            <select
              id="societe-selector"
              class="org-bar__select"
              [ngModel]="selectedSocieteId()"
              (ngModelChange)="selectSociete($event)">
              @for (s of societes(); track s.id) {
                <option [value]="s.id">{{ s.raisonSociale }}</option>
              }
            </select>
            @if (selectedSociete(); as soc) {
              @if (soc.id === currentSocieteId()) {
                <span class="badge-current">{{ 'admin.societe.table.active' | translate }}</span>
              } @else {
                <nf-button type="button" variant="secondary" size="sm" (clicked)="setActive(soc.id)">
                  {{ 'admin.societe.detail.activate' | translate }}
                </nf-button>
              }
            }
          </div>
        }

        @if (selectedSociete()) {
          @if (activeTab() === 'documents') {
            <app-company-document-identity />
          } @else {
          <form class="settings-form" (ngSubmit)="save()">
            @switch (activeTab()) {
              @case ('identite') {
                <section class="section">
                  <h2 class="section-title">{{ 'admin.societe.identite.title' | translate }}</h2>
                  <div class="fields-grid">
                    <div class="field">
                      <label for="raisonSociale">{{ 'admin.societe.identite.fields.raisonSociale' | translate }}</label>
                      <input id="raisonSociale" type="text" [(ngModel)]="draft.raisonSociale" name="raisonSociale" required />
                    </div>
                    <div class="field">
                      <label for="formeJuridique">{{ 'admin.societe.identite.fields.formeJuridique' | translate }}</label>
                      <select id="formeJuridique" [(ngModel)]="draft.formeJuridique" name="formeJuridique">
                        @for (forme of formes; track forme) {
                          <option [value]="forme">{{ formeLabel(forme) }}</option>
                        }
                      </select>
                    </div>
                    <div class="field">
                      <label for="capitalSocial">{{ 'admin.societe.identite.fields.capital' | translate }}</label>
                      <input id="capitalSocial" type="number" [(ngModel)]="extras.capitalSocial" name="capitalSocial" min="0" />
                    </div>
                    <div class="field field--full">
                      <label for="siegeAdresse">{{ 'admin.societe.identite.fields.adresse' | translate }}</label>
                      <input id="siegeAdresse" type="text" [(ngModel)]="draft.siegeAdresse" name="siegeAdresse" required />
                    </div>
                    <div class="field">
                      <nf-ville-ma-select
                        id="societe-ville-siege"
                        [label]="'admin.societe.extras.fields.villeSiege' | translate"
                        [(ngModel)]="extras.villeSiegeAffichee"
                        name="villeSiege"
                      />
                    </div>
                    <div class="field">
                      <label for="codePostal">{{ 'admin.societe.contacts.fields.codePostal' | translate }}</label>
                      <input id="codePostal" type="text" [(ngModel)]="extras.codePostal" name="codePostal" />
                    </div>
                    <div class="field">
                      <label for="paysSiege">{{ 'admin.societe.extras.fields.paysSiege' | translate }}</label>
                      <input id="paysSiege" type="text" [(ngModel)]="extras.paysSiege" name="paysSiege" maxlength="3"
                        [placeholder]="'admin.societe.extras.fields.paysSiegePlaceholder' | translate" />
                    </div>
                  </div>
                </section>

                <section class="section">
                  <h2 class="section-title">{{ 'admin.societe.contacts.title' | translate }}</h2>
                  <div class="fields-grid">
                    <div class="field">
                      <label>{{ 'admin.societe.contacts.fields.telephone' | translate }}</label>
                      <nf-phone-ma-input [(ngModel)]="extras.telephone" name="telephone"></nf-phone-ma-input>
                    </div>
                    <div class="field">
                      <label for="email">{{ 'admin.societe.contacts.fields.email' | translate }}</label>
                      <input id="email" type="email" [(ngModel)]="extras.email" name="email" />
                    </div>
                    <div class="field">
                      <label for="siteWeb">{{ 'admin.societe.contacts.fields.siteWeb' | translate }}</label>
                      <input id="siteWeb" type="url" [(ngModel)]="extras.siteWeb" name="siteWeb"
                        [placeholder]="'admin.societe.contacts.fields.sitePlaceholder' | translate" />
                    </div>
                    <div class="field">
                      <label for="rlNom">{{ 'admin.societe.extras.fields.rlNom' | translate }}</label>
                      <input id="rlNom" type="text" [(ngModel)]="extras.representantLegalNom" name="rlNom" />
                    </div>
                    <div class="field">
                      <label for="rlQual">{{ 'admin.societe.extras.fields.rlQualite' | translate }}</label>
                      <input id="rlQual" type="text" [(ngModel)]="extras.representantLegalQualite" name="rlQual"
                        [placeholder]="'admin.societe.extras.fields.rlQualitePlaceholder' | translate" />
                    </div>
                  </div>
                </section>

                <section class="section">
                  <h2 class="section-title">{{ 'admin.societe.extras.title' | translate }}</h2>
                  <p class="hint">{{ 'admin.societe.extras.hint' | translate }}</p>
                  <div class="fields-grid">
                    <div class="field">
                      <label for="codeCourt">{{ 'admin.societe.extras.fields.codeCourtGroupe' | translate }}</label>
                      <input id="codeCourt" type="text" [(ngModel)]="extras.codeCourtGroupe" name="codeCourt" maxlength="16"
                        [placeholder]="'admin.societe.extras.fields.codeCourtPlaceholder' | translate" />
                    </div>
                    <div class="field">
                      <label for="devise">{{ 'admin.societe.extras.fields.devise' | translate }}</label>
                      <input id="devise" type="text" [(ngModel)]="extras.deviseReference" name="devise" maxlength="8" />
                    </div>
                    <div class="field">
                      <label for="moisCloture">{{ 'admin.societe.extras.fields.moisCloture' | translate }}</label>
                      <input id="moisCloture" type="number" [(ngModel)]="extras.moisClotureExercice" name="moisCloture"
                        min="1" max="12" step="1" />
                    </div>
                  </div>
                </section>

                <section class="section">
                  <div class="section-header">
                    <h2 class="section-title">{{ 'admin.societe.ribs.title' | translate }}</h2>
                    <nf-button type="button" variant="secondary" size="sm" (clicked)="addRib()">
                      {{ 'admin.societe.ribs.addNew' | translate }}
                    </nf-button>
                  </div>
                  @for (rib of extras.ribs; track rib.id; let i = $index) {
                    <div class="rib-card">
                      <div class="rib-fields">
                        <div class="field">
                          <label>{{ 'admin.societe.ribs.fields.banque' | translate }}</label>
                          <select [(ngModel)]="rib.banque" [name]="'banque-'+i">
                            @for (b of banques; track b) {
                              <option [value]="b">{{ b }}</option>
                            }
                          </select>
                        </div>
                        <div class="field">
                          <label>{{ 'admin.societe.ribs.fields.intitule' | translate }}</label>
                          <input type="text" [(ngModel)]="rib.intitule" [name]="'intitule-'+i"
                            [placeholder]="'admin.societe.ribs.fields.intitulePlaceholder' | translate" />
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
                      <nf-button type="button" variant="ghost" size="sm"
                        [title]="'admin.societe.ribs.removeTitle' | translate"
                        (clicked)="removeRib(i)">✕</nf-button>
                    </div>
                  }
                </section>
              }
              @case ('identifiants') {
                <section class="section">
                  <h2 class="section-title">{{ 'admin.societe.tabs.identifiants' | translate }}</h2>
                  <p class="hint">{{ 'admin.societe.identite.hint' | translate }}</p>
                  <div class="fields-grid">
                    <div class="field">
                      <label>{{ 'admin.societe.identite.fields.ice' | translate }}</label>
                      <nf-ice-input [(ngModel)]="draft.ice" name="ice"></nf-ice-input>
                    </div>
                    <div class="field">
                      <label for="if_num">{{ 'admin.societe.identite.fields.if' | translate }}</label>
                      <input id="if_num" type="text" [(ngModel)]="draft.if" name="if_num"
                        [placeholder]="'admin.societe.identite.fields.ifPlaceholder' | translate" />
                    </div>
                    <div class="field">
                      <label for="rc">{{ 'admin.societe.identite.fields.rc' | translate }}</label>
                      <input id="rc" type="text" [(ngModel)]="draft.rc" name="rc"
                        [placeholder]="'admin.societe.identite.fields.rcPlaceholder' | translate" />
                    </div>
                    <div class="field">
                      <label for="patente">{{ 'admin.societe.identite.fields.patente' | translate }}</label>
                      <input id="patente" type="text" [(ngModel)]="draft.patente" name="patente"
                        [placeholder]="'admin.societe.identite.fields.patentePlaceholder' | translate" />
                    </div>
                    <div class="field">
                      <label for="cnss">{{ 'admin.societe.identite.fields.cnss' | translate }}</label>
                      <input id="cnss" type="text" [(ngModel)]="draft.cnss" name="cnss"
                        [placeholder]="'admin.societe.identite.fields.cnssPlaceholder' | translate" />
                    </div>
                    <div class="field">
                      <label for="tvaIntra">{{ 'admin.societe.identite.fields.tvaIntra' | translate }}</label>
                      <input id="tvaIntra" type="text" [(ngModel)]="draft.tvaIntra" name="tvaIntra" />
                    </div>
                  </div>
                </section>
              }
              @case ('etablissements') {
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
              }
            }

            @if (activeTab() === 'identite' || activeTab() === 'identifiants') {
              <div class="form-actions">
                <nf-button type="submit" variant="primary">
                  {{ 'admin.common.actions.save' | translate }}
                </nf-button>
              </div>
            }
          </form>
          }
        } @else {
          <p class="empty empty--page">{{ 'admin.societe.empty' | translate }}</p>
        }
      </div>
    </nf-page-shell>
  `,
  styles: [
    ConfigDrivenSettingsPageStyles,
    `
    .settings-form { max-width: 960px; }

    .org-bar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
    }
    .org-bar__label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--nf-color-text-secondary);
    }
    .org-bar__select {
      min-width: 16rem;
      padding: 8px 12px;
      border: 1px solid var(--nf-color-border);
      border-radius: 6px;
      font-size: 13px;
      background: white;
    }

    .section {
      margin-bottom: 1.25rem;
      background: white;
      border: 1px solid var(--nf-color-border);
      border-radius: 0.875rem;
      padding: 1.25rem 1.5rem;
    }
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .section-title {
      margin: 0 0 1rem;
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--nf-text-primary);
    }
    .section-header .section-title { margin-bottom: 0; }
    .hint { font-size: 0.8125rem; color: var(--nf-color-text-muted); margin: 0 0 1rem; }
    .empty { font-size: 0.875rem; color: var(--nf-color-text-secondary); }
    .empty--page {
      padding: 1.5rem;
      text-align: center;
      background: white;
      border: 1px dashed var(--nf-color-border);
      border-radius: 0.875rem;
    }

    .badge-current {
      display: inline-block;
      padding: 2px 8px;
      background: var(--nf-color-primary-700);
      color: white;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 700;
    }

    .fields-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field--full { grid-column: 1 / -1; }
    .field--sm { min-width: 80px; max-width: 100px; }
    .field--rib { min-width: 280px; }
    label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--nf-color-text-secondary);
    }
    input[type="text"], input[type="email"], input[type="url"], input[type="number"], select {
      padding: 8px 12px;
      border: 1px solid var(--nf-color-border);
      border-radius: 6px;
      font-size: 13px;
      background: white;
    }
    input:focus, select:focus {
      outline: none;
      border-color: var(--nf-color-primary-600, var(--nf-color-teal-600));
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--nf-color-primary-600, #0d9488) 12%, transparent);
    }
    input[type="checkbox"] { width: 18px; height: 18px; margin-top: 6px; cursor: pointer; }

    .etabs-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 0.75rem; }
    .etab-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      background: var(--nf-color-bg-subtle);
      border: 1px solid var(--nf-color-border);
      border-radius: 0.75rem;
    }
    .etab-card.is-current {
      background: var(--nf-color-primary-50);
      border-color: var(--nf-color-primary-300);
    }
    .etab-icon { font-size: 1.4rem; }
    .etab-body { flex: 1; min-width: 0; }
    .etab-name { font-weight: 700; font-size: 0.88rem; color: var(--nf-text-primary); }
    .etab-meta { font-size: 0.74rem; color: var(--nf-color-text-secondary); }
    .etab-addr {
      font-size: 0.72rem;
      color: var(--nf-color-text-muted);
      margin-top: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .rib-card {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.875rem;
      background: var(--nf-color-bg-subtle);
      border-radius: 0.75rem;
      margin-bottom: 0.75rem;
      border: 1px solid var(--nf-color-border);
    }
    .rib-fields {
      flex: 1;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 0.875rem;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      padding-top: 0.25rem;
    }
  `],
})
export class SocietePage {
  private readonly societeService = inject(SocieteService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(ToastService);

  readonly modeleJDefinition = MODELE_J_IMPORT_DEFINITION;
  readonly banques = BANQUES_MA_RAISONS_SOCIALES;
  readonly formes = FORMES;

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

  readonly selectedSocieteId = signal<string>(this.societeService.currentSocieteId());
  readonly activeTab = signal<SocieteTab>('identite');

  readonly selectedSociete = computed<Societe | null>(
    () => this.societes().find((s) => s.id === this.selectedSocieteId()) ?? null,
  );

  readonly etablissements = computed(
    () => this.societeService.getEtablissementsBySocieteId(this.selectedSocieteId()),
  );

  readonly tabs = signal<TabItem[]>(this.buildTabs());

  constructor() {
    this.translate.onLangChange.pipe(takeUntilDestroyed()).subscribe(() => this.tabs.set(this.buildTabs()));
    this.translate.onTranslationChange.pipe(takeUntilDestroyed()).subscribe(() => this.tabs.set(this.buildTabs()));
  }

  extras: SocieteExtras = loadExtras(this.selectedSocieteId());
  draft: IdentityDraft = this.selectedSociete()
    ? draftFrom(this.selectedSociete()!)
    : {
        raisonSociale: '',
        formeJuridique: 'SARL',
        ice: '',
        if: '',
        rc: '',
        patente: '',
        cnss: '',
        tvaIntra: '',
        siegeAdresse: '',
      };

  onTabChange(id: string): void {
    this.activeTab.set(id as SocieteTab);
  }

  selectSociete(id: string): void {
    if (id === this.selectedSocieteId()) return;
    this.selectedSocieteId.set(id);
    this.hydrate(id);
  }

  setActive(id: string): void {
    this.societeService.setCurrentSociete(id);
  }

  formeLabel(forme: SocieteFormeJuridique): string {
    const key = FORME_JURIDIQUE_KEYS[forme];
    return key ? this.translate.instant(key) : forme;
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
    const id = this.selectedSocieteId();
    this.societeService.patchSociete(id, {
      raisonSociale: this.draft.raisonSociale,
      formeJuridique: this.draft.formeJuridique,
      ice: this.draft.ice,
      if: this.draft.if,
      rc: this.draft.rc,
      patente: this.draft.patente,
      cnss: this.draft.cnss,
      tvaIntra: this.draft.tvaIntra || undefined,
      siegeAdresse: this.draft.siegeAdresse,
    });
    saveExtras(id, this.extras);
    this.toast.success(this.translate.instant('admin.societe.toasts.saved'));
  }

  onModeleJImported(result: ReviewedExtraction): void {
    const row = result.acceptedRows[0];
    if (!row) {
      this.toast.error(this.translate.instant('admin.societe.smartImport.empty'));
      return;
    }
    const id = this.selectedSocieteId();
    const mapped = applyModeleJRow(row);
    const societePatch = Object.fromEntries(
      Object.entries(mapped.societe).filter(([, value]) => value !== undefined),
    ) as Partial<Societe>;
    this.societeService.patchSociete(id, societePatch);
    this.extras = {
      ...this.extras,
      ...Object.fromEntries(
        Object.entries(mapped.extras).filter(([, value]) => value !== undefined),
      ),
    };
    saveExtras(id, this.extras);
    const soc = this.selectedSociete();
    if (soc) this.draft = draftFrom(soc);
    this.activeTab.set('identite');
    this.toast.success(this.translate.instant('admin.societe.smartImport.applied'));
  }

  private buildTabs(): TabItem[] {
    return [
      { id: 'identite', label: this.translate.instant('admin.societe.tabs.identite') },
      { id: 'identifiants', label: this.translate.instant('admin.societe.tabs.identifiants') },
      { id: 'etablissements', label: this.translate.instant('admin.societe.tabs.etablissements') },
      { id: 'documents', label: this.translate.instant('admin.societe.tabs.documents') },
    ];
  }

  private hydrate(id: string): void {
    this.extras = loadExtras(id);
    const soc = this.societes().find((s) => s.id === id);
    if (soc) this.draft = draftFrom(soc);
  }
}
