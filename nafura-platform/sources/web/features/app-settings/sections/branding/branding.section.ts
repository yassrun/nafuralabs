import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { ToastService } from '@lib/anatomy';
import { ApiConfigService } from '@core/config/api-config.service';
import type { AppBrandingSettings } from '../../models';
import { AppSettingsApiService } from '../../models';
import {
  BrandColorSlot,
  DEFAULT_ACCENT_COLOR,
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_SECONDARY_COLOR,
} from './branding.config';

const LOGO_MAX_BYTES = 2 * 1024 * 1024;
const FAVICON_MAX_BYTES = 500 * 1024;
const LOGO_ACCEPT = '.png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml';
const FAVICON_ACCEPT = '.png,.ico,.svg,image/png,image/x-icon,image/svg+xml';

export interface BrandingSectionSavePayload {
  settings: AppBrandingSettings;
  logoFile: File | null;
  faviconFile: File | null;
}

function buildAssetUrl(baseUrl: string, path: string | null): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return path.startsWith('/') ? base + path : base + '/' + path;
}

@Component({
  selector: 'app-app-settings-branding-section',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <section class="settings-section">
      <h3>{{ 'appSettings.branding.title' | translate }}</h3>
      @if (loading) {
        <div class="loading">
          <span>{{ 'Loading' | translate }}</span>
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="grid">
            <p class="hint appearance-hint">{{ 'appSettings.branding.appearanceHint' | translate }}</p>

            <div class="upload-block full-width">
              <label class="field-label">{{ 'appSettings.branding.logo' | translate }}</label>
              <div class="upload-area">
                <div class="thumb" *ngIf="logoPreviewUrl() as url">
                  <img [src]="url" alt="" />
                </div>
                <div class="thumb placeholder" *ngIf="!logoPreviewUrl()">
                  <span>—</span>
                </div>
                <div class="upload-meta">
                  <span class="file-info">{{ logoFileName() || '—' }}</span>
                  <span class="file-size" *ngIf="logoFileName()">{{ logoFileSize() }}</span>
                  <div class="upload-actions">
                    <button type="button" mat-stroked-button (click)="logoInput.click()" [disabled]="logoUploading()">
                      {{ 'appSettings.branding.logo.change' | translate }}
                    </button>
                    <button type="button" mat-stroked-button (click)="removeLogo()" [disabled]="!logoPreviewUrl() && !logoFileName()">
                      {{ 'appSettings.branding.logo.remove' | translate }}
                    </button>
                    <button
                      type="button"
                      mat-stroked-button
                      (click)="extractColors()"
                      [disabled]="!logoPreviewUrl() || extracting()">
                      {{
                        extracting()
                          ? ('appSettings.branding.extractColors.loading' | translate)
                          : ('appSettings.branding.extractColors' | translate)
                      }}
                    </button>
                  </div>
                  <input
                    #logoInput
                    type="file"
                    [accept]="logoAccept"
                    class="hidden-file"
                    (change)="onLogoFileChange($event)" />
                </div>
              </div>
              <p class="hint">{{ 'appSettings.branding.logo.hint' | translate }}</p>
              <p class="hint">{{ 'appSettings.branding.extractColors.hint' | translate }}</p>
            </div>

            @if (candidates().length) {
              <div class="candidates full-width">
                <label class="field-label">{{ 'appSettings.branding.candidates' | translate }}</label>
                <div class="candidate-row">
                  @for (c of candidates(); track c) {
                    <button
                      type="button"
                      class="candidate-swatch"
                      [style.background]="c"
                      [attr.title]="c"
                      (click)="applyCandidate(c)"></button>
                  }
                </div>
                <div class="slot-picker">
                  <span class="hint">{{ 'appSettings.branding.activeSlot' | translate }}:</span>
                  <button
                    type="button"
                    class="slot-btn"
                    [class.active]="activeSlot() === 'primaryColor'"
                    (click)="activeSlot.set('primaryColor')">
                    {{ 'appSettings.branding.primaryColor' | translate }}
                  </button>
                  <button
                    type="button"
                    class="slot-btn"
                    [class.active]="activeSlot() === 'secondaryColor'"
                    (click)="activeSlot.set('secondaryColor')">
                    {{ 'appSettings.branding.secondaryColor' | translate }}
                  </button>
                  <button
                    type="button"
                    class="slot-btn"
                    [class.active]="activeSlot() === 'accentColor'"
                    (click)="activeSlot.set('accentColor')">
                    {{ 'appSettings.branding.accentColor' | translate }}
                  </button>
                </div>
              </div>
            }

            <div class="color-block full-width">
              <label class="field-label">{{ 'appSettings.branding.primaryColor' | translate }}</label>
              <div class="color-row">
                <input
                  type="color"
                  class="color-swatch"
                  [value]="colorValue('primaryColor')"
                  (input)="onColorPickerInput('primaryColor', $event)" />
                <input
                  type="text"
                  class="color-hex"
                  [value]="colorValue('primaryColor')"
                  (input)="onHexInput('primaryColor', $event)"
                  placeholder="{{ 'appSettings.branding.primaryColor.default' | translate }}" />
                <button type="button" class="reset-btn" (click)="resetColor('primaryColor')">
                  {{ 'appSettings.branding.primaryColor.reset' | translate }}
                </button>
              </div>
            </div>

            <div class="color-block full-width">
              <label class="field-label">{{ 'appSettings.branding.secondaryColor' | translate }}</label>
              <div class="color-row">
                <input
                  type="color"
                  class="color-swatch"
                  [value]="colorValue('secondaryColor')"
                  (input)="onColorPickerInput('secondaryColor', $event)" />
                <input
                  type="text"
                  class="color-hex"
                  [value]="colorValue('secondaryColor')"
                  (input)="onHexInput('secondaryColor', $event)" />
                <button type="button" class="reset-btn" (click)="resetColor('secondaryColor')">
                  {{ 'appSettings.branding.primaryColor.reset' | translate }}
                </button>
              </div>
            </div>

            <div class="color-block full-width">
              <label class="field-label">{{ 'appSettings.branding.accentColor' | translate }}</label>
              <div class="color-row">
                <input
                  type="color"
                  class="color-swatch"
                  [value]="colorValue('accentColor')"
                  (input)="onColorPickerInput('accentColor', $event)" />
                <input
                  type="text"
                  class="color-hex"
                  [value]="colorValue('accentColor')"
                  (input)="onHexInput('accentColor', $event)" />
                <button type="button" class="reset-btn" (click)="resetColor('accentColor')">
                  {{ 'appSettings.branding.primaryColor.reset' | translate }}
                </button>
              </div>
            </div>

            <div class="color-preview" *ngIf="colorValue('primaryColor')">
              <span class="preview-label">{{ 'appSettings.branding.primaryColor.preview' | translate }}</span>
              <div class="preview-card">
                <div class="preview-accent" [style.background]="colorValue('primaryColor')"></div>
                <div class="preview-bar">
                  <span class="preview-chip" [style.background]="colorValue('primaryColor')"></span>
                  <span class="preview-chip" [style.background]="colorValue('secondaryColor')"></span>
                  <span class="preview-chip" [style.background]="colorValue('accentColor')"></span>
                </div>
                <button
                  type="button"
                  class="preview-btn"
                  [style.background]="colorValue('primaryColor')"
                  [style.color]="previewContrast()">
                  Button
                </button>
              </div>
            </div>

            <div class="upload-block full-width">
              <label class="field-label">{{ 'appSettings.branding.favicon' | translate }}</label>
              <div class="upload-area">
                <div class="thumb" *ngIf="faviconPreviewUrl() as url">
                  <img [src]="url" alt="" />
                </div>
                <div class="thumb placeholder" *ngIf="!faviconPreviewUrl()">
                  <span>—</span>
                </div>
                <div class="upload-meta">
                  <span class="file-info">{{ faviconFileName() || '—' }}</span>
                  <span class="file-size" *ngIf="faviconFileName()">{{ faviconFileSize() }}</span>
                  <div class="upload-actions">
                    <button type="button" mat-stroked-button (click)="faviconInput.click()" [disabled]="faviconUploading()">
                      {{ 'appSettings.branding.logo.change' | translate }}
                    </button>
                    <button type="button" mat-stroked-button (click)="removeFavicon()" [disabled]="!faviconPreviewUrl() && !faviconFileName()">
                      {{ 'appSettings.branding.logo.remove' | translate }}
                    </button>
                  </div>
                  <input
                    #faviconInput
                    type="file"
                    [accept]="faviconAccept"
                    class="hidden-file"
                    (change)="onFaviconFileChange($event)" />
                </div>
              </div>
              <p class="hint">{{ 'appSettings.branding.favicon.hint' | translate }}</p>
            </div>
          </div>

          <div class="actions">
            <button
              mat-flat-button
              color="primary"
              type="submit"
              [disabled]="loading || saving || form.pristine">
              {{ 'appSettings.branding.save' | translate }}
            </button>
          </div>
        </form>
      }
    </section>
  `,
  styles: [
    `
      .settings-section {
        border: 1px solid var(--nf-border-default, #e5e7eb);
        border-radius: 12px;
        padding: 1.25rem;
        background: var(--nf-color-surface, #fff);
      }
      .settings-section h3 {
        margin: 0 0 1rem;
      }
      .loading {
        padding: 1rem;
        color: var(--nf-color-text-muted, #6b7280);
      }
      .grid {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }
      .full-width {
        grid-column: 1 / -1;
      }
      .field-label {
        display: block;
        margin-bottom: 0.35rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--nf-color-text, #111827);
      }
      .color-block .color-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .color-swatch {
        width: 44px;
        height: 36px;
        padding: 2px;
        border: 1px solid var(--nf-border-default, #e5e7eb);
        border-radius: 8px;
        cursor: pointer;
      }
      .color-hex {
        width: 100px;
        padding: 0.4rem 0.5rem;
        font-family: ui-monospace, monospace;
        font-size: 0.875rem;
        border: 1px solid var(--nf-border-default, #e5e7eb);
        border-radius: 8px;
      }
      .reset-btn {
        padding: 0.35rem 0.6rem;
        font-size: 0.8125rem;
        background: var(--nf-color-bg-muted, #f3f4f6);
        border: 1px solid var(--nf-border-default, #e5e7eb);
        border-radius: 8px;
        cursor: pointer;
      }
      .reset-btn:hover {
        background: var(--nf-color-surface-hover, #f9fafb);
      }
      .color-preview {
        margin-top: 0.25rem;
      }
      .preview-label {
        font-size: 0.75rem;
        color: var(--nf-color-text-muted, #6b7280);
      }
      .preview-card {
        margin-top: 0.35rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-width: 220px;
      }
      .preview-accent {
        height: 4px;
        border-radius: 2px;
      }
      .preview-bar {
        display: flex;
        gap: 0.35rem;
      }
      .preview-chip {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        border: 1px solid var(--nf-border-default, #e5e7eb);
      }
      .preview-btn {
        padding: 0.4rem 0.75rem;
        border: none;
        border-radius: 8px;
        font-size: 0.875rem;
        cursor: default;
      }
      .candidates .candidate-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      }
      .candidate-swatch {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        border: 1px solid var(--nf-border-default, #e5e7eb);
        cursor: pointer;
        padding: 0;
      }
      .slot-picker {
        margin-top: 0.6rem;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.4rem;
      }
      .slot-btn {
        padding: 0.3rem 0.55rem;
        font-size: 0.75rem;
        border-radius: 999px;
        border: 1px solid var(--nf-border-default, #e5e7eb);
        background: var(--nf-color-bg-muted, #f3f4f6);
        cursor: pointer;
      }
      .slot-btn.active {
        border-color: var(--nf-color-primary, #1d4ed8);
        background: color-mix(in srgb, var(--nf-color-primary, #1d4ed8) 12%, white);
        font-weight: 600;
      }
      .upload-block .upload-area {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
      }
      .thumb {
        width: 80px;
        height: 80px;
        flex-shrink: 0;
        border: 1px solid var(--nf-border-default, #e5e7eb);
        border-radius: 8px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--nf-color-bg-muted, #f3f4f6);
      }
      .thumb img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
      .thumb.placeholder span {
        color: var(--nf-color-text-muted, #6b7280);
      }
      .upload-meta {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }
      .file-info {
        font-size: 0.875rem;
        color: var(--nf-color-text, #111827);
      }
      .file-size {
        font-size: 0.75rem;
        color: var(--nf-color-text-muted, #6b7280);
      }
      .upload-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .hidden-file {
        position: absolute;
        width: 0;
        height: 0;
        opacity: 0;
      }
      .hint {
        margin: 0.35rem 0 0;
        font-size: 0.75rem;
        color: var(--nf-color-text-muted, #6b7280);
      }
      .appearance-hint {
        margin: 0 0 0.25rem;
      }
      .actions {
        margin-top: 1.25rem;
        display: flex;
        justify-content: flex-end;
      }
    `,
  ],
})
export class BrandingSectionComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AppSettingsApiService);
  private readonly apiConfig = inject(ApiConfigService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly logoAccept = LOGO_ACCEPT;
  readonly faviconAccept = FAVICON_ACCEPT;

  @Input() data: AppBrandingSettings | null = null;
  @Input() loading = false;
  @Input() saving = false;

  @Output() save = new EventEmitter<BrandingSectionSavePayload>();

  readonly form = this.fb.group({
    tenantDisplayName: this.fb.control<string | null>(null),
    primaryColor: this.fb.control<string | null>(DEFAULT_PRIMARY_COLOR),
    secondaryColor: this.fb.control<string | null>(DEFAULT_SECONDARY_COLOR),
    accentColor: this.fb.control<string | null>(DEFAULT_ACCENT_COLOR),
    logoUrl: this.fb.control<string | null>(null),
    faviconUrl: this.fb.control<string | null>(null),
  });

  readonly logoUploading = signal(false);
  readonly faviconUploading = signal(false);
  readonly extracting = signal(false);
  readonly candidates = signal<string[]>([]);
  readonly activeSlot = signal<BrandColorSlot>('primaryColor');
  readonly logoFileName = signal<string | null>(null);
  readonly faviconFileName = signal<string | null>(null);
  readonly logoFileSize = signal<string>('');
  readonly faviconFileSize = signal<string>('');

  private logoFile: File | null = null;
  private faviconFile: File | null = null;

  readonly logoPreviewUrl = computed(() => {
    const url = this.form.get('logoUrl')?.value;
    if (!url) return null;
    return buildAssetUrl(this.apiConfig.getApiBaseUrl(), url);
  });

  readonly faviconPreviewUrl = computed(() => {
    const url = this.form.get('faviconUrl')?.value;
    if (!url) return null;
    return buildAssetUrl(this.apiConfig.getApiBaseUrl(), url);
  });

  readonly previewContrast = computed(() => contrastText(this.colorValue('primaryColor')));

  ngOnChanges(): void {
    if (!this.data) return;
    this.form.patchValue(
      {
        tenantDisplayName: this.data.tenantDisplayName ?? null,
        primaryColor: this.data.primaryColor ?? DEFAULT_PRIMARY_COLOR,
        secondaryColor: this.data.secondaryColor ?? DEFAULT_SECONDARY_COLOR,
        accentColor: this.data.accentColor ?? DEFAULT_ACCENT_COLOR,
        logoUrl: this.data.logoUrl ?? null,
        faviconUrl: this.data.faviconUrl ?? null,
      },
      { emitEvent: false }
    );
    this.form.markAsPristine();
    this.logoFileName.set(null);
    this.faviconFileName.set(null);
    this.logoFileSize.set('');
    this.faviconFileSize.set('');
    this.logoFile = null;
    this.faviconFile = null;
  }

  colorValue(slot: BrandColorSlot): string {
    const fallback =
      slot === 'primaryColor'
        ? DEFAULT_PRIMARY_COLOR
        : slot === 'secondaryColor'
          ? DEFAULT_SECONDARY_COLOR
          : DEFAULT_ACCENT_COLOR;
    return this.form.get(slot)?.value ?? fallback;
  }

  onColorPickerInput(slot: BrandColorSlot, event: Event): void {
    const input = event.target as HTMLInputElement;
    const v = input?.value;
    if (v) this.form.patchValue({ [slot]: v }, { emitEvent: true });
  }

  onHexInput(slot: BrandColorSlot, event: Event): void {
    const input = event.target as HTMLInputElement;
    let v = (input?.value ?? '').trim();
    if (!v.startsWith('#')) v = '#' + v;
    if (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(v)) {
      this.form.patchValue({ [slot]: v }, { emitEvent: true });
    }
  }

  resetColor(slot: BrandColorSlot): void {
    const value =
      slot === 'primaryColor'
        ? DEFAULT_PRIMARY_COLOR
        : slot === 'secondaryColor'
          ? DEFAULT_SECONDARY_COLOR
          : DEFAULT_ACCENT_COLOR;
    this.form.patchValue({ [slot]: value }, { emitEvent: true });
  }

  applyCandidate(hex: string): void {
    this.form.patchValue({ [this.activeSlot()]: hex }, { emitEvent: true });
    this.form.markAsDirty();
  }

  async extractColors(): Promise<void> {
    if (!this.form.get('logoUrl')?.value) {
      this.toast.error(this.translate.instant('appSettings.branding.extractColors.noLogo'));
      return;
    }
    this.extracting.set(true);
    try {
      const result = await firstValueFrom(this.api.extractBrandColors());
      this.candidates.set(result.candidates ?? []);
      this.form.patchValue(
        {
          primaryColor: result.suggested?.primary ?? DEFAULT_PRIMARY_COLOR,
          secondaryColor: result.suggested?.secondary ?? DEFAULT_SECONDARY_COLOR,
          accentColor: result.suggested?.accent ?? DEFAULT_ACCENT_COLOR,
        },
        { emitEvent: true }
      );
      this.form.markAsDirty();
      this.toast.success(this.translate.instant('appSettings.branding.extractColors.success'));
    } catch (err) {
      const status = err instanceof HttpErrorResponse ? err.status : 0;
      if (status === 503) {
        this.toast.error(this.translate.instant('appSettings.branding.extractColors.aiUnavailable'));
      } else if (status === 400) {
        const msg =
          typeof (err as HttpErrorResponse).error === 'object' &&
          (err as HttpErrorResponse).error?.message
            ? String((err as HttpErrorResponse).error.message)
            : this.translate.instant('appSettings.branding.extractColors.noLogo');
        this.toast.error(msg);
      } else {
        this.toast.error(this.translate.instant('appSettings.branding.extractColors.error'));
      }
    } finally {
      this.extracting.set(false);
    }
  }

  private normalizeHex(hex: string, fallback: string): string {
    let h = hex.replace(/^#/, '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return h.length === 6 ? '#' + h : fallback;
  }

  async onLogoFileChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.item(0) ?? null;
    input.value = '';
    if (!file) return;
    const ext = (file.name.split('.').pop() ?? '').toLowerCase();
    if (!['png', 'jpg', 'jpeg', 'svg'].includes(ext)) {
      this.toast.error('Invalid logo type. Use PNG, JPG, or SVG.');
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      this.toast.error('Logo must be 2MB or less.');
      return;
    }
    this.logoUploading.set(true);
    this.logoFileName.set(file.name);
    this.logoFileSize.set(formatBytes(file.size));
    try {
      const res = await firstValueFrom(this.api.uploadLogo(file));
      const url = typeof res === 'string' ? res : res?.url ?? null;
      if (url) {
        this.form.patchValue({ logoUrl: url }, { emitEvent: true });
        this.form.markAsDirty();
        this.candidates.set([]);
      }
    } catch {
      this.toast.error('Failed to upload logo.');
      this.logoFileName.set(null);
      this.logoFileSize.set('');
    } finally {
      this.logoUploading.set(false);
    }
  }

  async onFaviconFileChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.item(0) ?? null;
    input.value = '';
    if (!file) return;
    const ext = (file.name.split('.').pop() ?? '').toLowerCase();
    if (!['png', 'ico', 'svg'].includes(ext)) {
      this.toast.error('Invalid favicon type. Use PNG, ICO, or SVG.');
      return;
    }
    if (file.size > FAVICON_MAX_BYTES) {
      this.toast.error('Favicon must be 500KB or less.');
      return;
    }
    this.faviconUploading.set(true);
    this.faviconFileName.set(file.name);
    this.faviconFileSize.set(formatBytes(file.size));
    try {
      const res = await firstValueFrom(this.api.uploadFavicon(file));
      const url = typeof res === 'string' ? res : res?.url ?? null;
      if (url) {
        this.form.patchValue({ faviconUrl: url }, { emitEvent: true });
        this.form.markAsDirty();
      }
    } catch {
      this.toast.error('Failed to upload favicon.');
      this.faviconFileName.set(null);
      this.faviconFileSize.set('');
    } finally {
      this.faviconUploading.set(false);
    }
  }

  removeLogo(): void {
    this.form.patchValue({ logoUrl: null }, { emitEvent: true });
    this.form.markAsDirty();
    this.logoFileName.set(null);
    this.logoFileSize.set('');
    this.logoFile = null;
    this.candidates.set([]);
  }

  removeFavicon(): void {
    this.form.patchValue({ faviconUrl: null }, { emitEvent: true });
    this.form.markAsDirty();
    this.faviconFileName.set(null);
    this.faviconFileSize.set('');
    this.faviconFile = null;
  }

  submit(): void {
    const raw = this.form.getRawValue();
    const primary = raw.primaryColor
      ? this.normalizeHex(raw.primaryColor, DEFAULT_PRIMARY_COLOR)
      : null;
    const secondary = raw.secondaryColor
      ? this.normalizeHex(raw.secondaryColor, DEFAULT_SECONDARY_COLOR)
      : null;
    const accent = raw.accentColor
      ? this.normalizeHex(raw.accentColor, DEFAULT_ACCENT_COLOR)
      : null;
    this.save.emit({
      settings: {
        tenantDisplayName: (this.data?.tenantDisplayName ?? raw.tenantDisplayName?.trim()) || null,
        primaryColor: primary || null,
        secondaryColor: secondary || null,
        accentColor: accent || null,
        logoUrl: raw.logoUrl?.trim() || null,
        faviconUrl: raw.faviconUrl?.trim() || null,
      },
      logoFile: this.logoFile,
      faviconFile: this.faviconFile,
    });
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function contrastText(hex: string): string {
  if (!hex) return '#ffffff';
  const h = hex.replace(/^#/, '');
  const hex6 = h.length === 3 ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2] : h;
  if (hex6.length !== 6) return '#ffffff';
  const r = parseInt(hex6.slice(0, 2), 16) / 255;
  const g = parseInt(hex6.slice(2, 4), 16) / 255;
  const b = parseInt(hex6.slice(4, 6), 16) / 255;
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return L > 0.179 ? '#000000' : '#ffffff';
}
