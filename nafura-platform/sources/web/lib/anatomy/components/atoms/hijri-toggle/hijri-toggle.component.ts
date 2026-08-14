/**
 * `HijriToggleComponent` — toggle UI pour activer l'affichage parallèle des
 * dates hégire (Phase 4.3 / Wave D / agent D3).
 *
 * Sélecteur : `<app-hijri-toggle [showLabel]="true"></app-hijri-toggle>`
 *
 * Branchement typique : menu profil utilisateur ou `language-switcher`.
 *
 * @see HijriCalendarService
 */

import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

import { HijriCalendarService } from '@core/i18n/hijri-calendar.service';

@Component({
  selector: 'app-hijri-toggle',
  standalone: true,
  imports: [CommonModule, MatSlideToggleModule, MatTooltipModule, TranslateModule],
  template: `
    <mat-slide-toggle
      class="nf-hijri-toggle"
      [checked]="hijri.enabled()"
      (change)="hijri.toggle()"
      [matTooltip]="'i18n.hijri.toggle.tooltip' | translate"
      [attr.aria-label]="'i18n.hijri.toggle.label' | translate"
    >
      @if (showLabel) {
        <span class="nf-hijri-toggle__label">
          {{ 'i18n.hijri.toggle.label' | translate }}
        </span>
      }
    </mat-slide-toggle>
  `,
  styles: [
    `
      .nf-hijri-toggle__label {
        font-size: 13px;
        margin-left: 8px;
      }
    `,
  ],
})
export class HijriToggleComponent {
  readonly hijri = inject(HijriCalendarService);

  /** Quand `false`, n'affiche que le toggle sans le label (utile dans menus compacts). */
  @Input() showLabel = true;
}
