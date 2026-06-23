/**
 * `ArabicNumeralsToggleComponent` — toggle UI pour activer l'affichage des
 * chiffres en écriture arabe (٠-٩) au lieu des chiffres occidentaux (0-9).
 * Round 2 Phase 2 sub-C (squelette AR + RTL).
 *
 * Sélecteur : `<app-arabic-numerals-toggle [showLabel]="true"></app-arabic-numerals-toggle>`
 *
 * Branchement typique : menu profil utilisateur ou `language-switcher`, à
 * placer juste sous le `HijriToggleComponent` quand la langue active est `ar`.
 *
 * @see ArabicNumeralsService
 * @see HijriToggleComponent — pattern jumeau (calendrier hégire).
 */

import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

import { ArabicNumeralsService } from '@core/i18n/arabic-numerals.service';

@Component({
  selector: 'app-arabic-numerals-toggle',
  standalone: true,
  imports: [CommonModule, MatSlideToggleModule, MatTooltipModule, TranslateModule],
  template: `
    <mat-slide-toggle
      class="nf-arabic-numerals-toggle"
      [checked]="service.enabled()"
      (change)="service.toggle()"
      [matTooltip]="'i18n.numerals.toggle.tooltip' | translate"
      [attr.aria-label]="'i18n.numerals.toggle.label' | translate"
    >
      @if (showLabel) {
        <span class="nf-arabic-numerals-toggle__label">
          {{ 'i18n.numerals.toggle.label' | translate }}
        </span>
      }
    </mat-slide-toggle>
  `,
  styles: [
    `
      .nf-arabic-numerals-toggle__label {
        font-size: 13px;
        margin-inline-start: 8px;
      }
    `,
  ],
})
export class ArabicNumeralsToggleComponent {
  readonly service = inject(ArabicNumeralsService);

  /** Quand `false`, n'affiche que le toggle sans le label (utile dans menus compacts). */
  @Input() showLabel = true;
}
