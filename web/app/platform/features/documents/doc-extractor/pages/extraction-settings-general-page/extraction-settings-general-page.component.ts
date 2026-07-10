import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  DEFAULT_GENERAL_SETTINGS,
  ExtractionGeneralSettings,
  ExtractionSettingsService,
} from '../../services/extraction-settings.service';

@Component({
  selector: 'app-extraction-settings-general-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatFormFieldModule,
    MatOptionModule,
    MatIconModule,
    MatButtonModule,
    TranslateModule,
  ],
  templateUrl: './extraction-settings-general-page.component.html',
  styleUrl: './extraction-settings-general-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExtractionSettingsGeneralPage {
  private readonly settingsService = inject(ExtractionSettingsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly settings = toSignal<ExtractionGeneralSettings>(
    this.settingsService.getGeneralSettings(),
    { requireSync: true }
  );

  readonly saving = signal(false);
  readonly saved = signal(false);

  onAutoValidateChange(checked: boolean): void {
    this.saving.set(true);
    this.settingsService
      .updateGeneralSettings({ autoValidateAll: checked })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.saving.set(false);
        this.flashSaved();
      });
  }

  // Placeholder handler for future settings expansion (keeps UI in sync)
  onPolicyChange(policy: ExtractionGeneralSettings['autoValidationPolicy']): void {
    this.settingsService
      .updateGeneralSettings({ autoValidationPolicy: policy })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.flashSaved());
  }

  private flashSaved(): void {
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 1500);
  }
}

