import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { ApiConfigService } from '@core/config/api-config.service';
import { ButtonComponent } from '@platform/lib/anatomy';

@Component({
  selector: 'app-company-document-identity',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslateModule, ButtonComponent],
  template: `
    <section class="section">
      <h2 class="section-title">{{ 'admin.societe.documents.title' | translate }}</h2>
      <p class="hint">{{ 'admin.societe.documents.hint' | translate }}</p>
      <div class="links">
        <a routerLink="/administration/settings" [queryParams]="{ section: 'branding' }">
          {{ 'admin.societe.documents.logoLink' | translate }}
        </a>
        <a routerLink="/administration/documents/settings">
          {{ 'admin.societe.documents.headerLink' | translate }}
        </a>
      </div>
      @if (error()) {
        <p class="error" role="alert">{{ error() | translate }}</p>
      }
      @if (values(); as identity) {
        <form (ngSubmit)="save()">
          <div class="fields-grid">
            @for (field of fields; track field.key) {
              <div class="field">
                <label [for]="'doc-' + field.key">{{ field.labelKey | translate }}</label>
                <input
                  [id]="'doc-' + field.key"
                  [name]="field.key"
                  [(ngModel)]="identity[field.key]"
                  maxlength="1000"
                  [required]="field.key === 'raisonSociale'"
                  (ngModelChange)="saved.set(false)" />
              </div>
            }
          </div>
          <div class="form-actions">
            <nf-button type="submit" variant="primary" [disabled]="saving()">
              {{ (saving() ? 'admin.societe.documents.saving' : 'admin.societe.documents.save') | translate }}
            </nf-button>
            @if (saved()) {
              <span class="status" role="status">{{ 'admin.societe.documents.saved' | translate }}</span>
            }
          </div>
        </form>
      }
    </section>
  `,
  styles: [`
    .section {
      background: white;
      border: 1px solid var(--nf-color-border);
      border-radius: 0.875rem;
      padding: 1.25rem 1.5rem;
    }
    .section-title {
      margin: 0 0 0.5rem;
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--nf-text-primary);
    }
    .hint {
      font-size: 0.8125rem;
      color: var(--nf-color-text-muted);
      margin: 0 0 1rem;
    }
    .links {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    .links a {
      font-size: 0.8125rem;
      font-weight: 600;
    }
    .error { color: var(--nf-color-danger-700); font-size: 0.8125rem; }
    .fields-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    .field { display: flex; flex-direction: column; gap: 6px; }
    label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--nf-color-text-secondary);
    }
    input {
      padding: 8px 12px;
      border: 1px solid var(--nf-color-border);
      border-radius: 6px;
      font-size: 13px;
    }
    .form-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .status { font-size: 0.8125rem; color: var(--nf-color-success-700); font-weight: 600; }
  `],
})
export class CompanyDocumentIdentityComponent {
  private readonly http = inject(HttpClient);
  private readonly url = inject(ApiConfigService).getApiBaseUrl() + '/api/v1/socle/company-document-identity';
  readonly values = signal<Record<string, string> | null>(null);
  readonly error = signal('');
  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly fields = [
    { key: 'raisonSociale', labelKey: 'admin.societe.identite.fields.raisonSociale' },
    { key: 'formeJuridique', labelKey: 'admin.societe.identite.fields.formeJuridique' },
    { key: 'capital', labelKey: 'admin.societe.identite.fields.capital' },
    { key: 'adresse', labelKey: 'admin.societe.identite.fields.adresse' },
    { key: 'ville', labelKey: 'admin.societe.extras.fields.villeSiege' },
    { key: 'telephone', labelKey: 'admin.societe.contacts.fields.telephone' },
    { key: 'email', labelKey: 'admin.societe.contacts.fields.email' },
    { key: 'siteWeb', labelKey: 'admin.societe.contacts.fields.siteWeb' },
    { key: 'ice', labelKey: 'admin.societe.identite.fields.ice' },
    { key: 'identifiantFiscal', labelKey: 'admin.societe.identite.fields.if' },
    { key: 'rc', labelKey: 'admin.societe.identite.fields.rc' },
    { key: 'patente', labelKey: 'admin.societe.identite.fields.patente' },
    { key: 'cnss', labelKey: 'admin.societe.identite.fields.cnss' },
    { key: 'tvaIntra', labelKey: 'admin.societe.identite.fields.tvaIntra' },
    { key: 'banque', labelKey: 'admin.societe.ribs.fields.banque' },
    { key: 'rib', labelKey: 'admin.societe.ribs.fields.rib' },
  ];
  constructor() { void this.load(); }
  private async load(): Promise<void> {
    try { this.values.set(await firstValueFrom(this.http.get<Record<string, string>>(this.url))); }
    catch { this.error.set('admin.societe.documents.loadError'); }
  }
  async save(): Promise<void> {
    this.saving.set(true);
    this.error.set('');
    try {
      this.values.set(await firstValueFrom(this.http.put<Record<string, string>>(this.url, this.values())));
      this.saved.set(true);
    } catch { this.error.set('admin.societe.documents.saveError'); }
    finally { this.saving.set(false); }
  }
}
