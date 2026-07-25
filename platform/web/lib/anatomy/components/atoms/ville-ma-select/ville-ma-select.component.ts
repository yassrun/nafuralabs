import {
  ChangeDetectionStrategy,
  Component,
  Input,
  forwardRef,
  signal,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';

import {
  findVilleByNom,
  villeSelectOptions,
} from '../../../../referentiels/geo-ma';
import { NfSelectComponent, NfSelectOption } from '../select';

let nextUniqueId = 0;

/**
 * Ville MA Select — sélecteur de ville marocaine adossé au référentiel
 * géographique (`@lib/referentiels/geo-ma`).
 *
 * Valeur = **nom canonique** de la ville (ex. `"Béni Mellal"`), libellé =
 * `"Ville — Région"`. Les valeurs legacy saisies en texte libre sont
 * rattachées au référentiel quand possible (insensible casse / accents) ;
 * sinon elles restent affichées en tête de liste sans être perdues.
 *
 * Ancrage marocain assumé, comme `ice-input` / `rib-input` /
 * `phone-ma-input`.
 */
@Component({
  selector: 'nf-ville-ma-select',
  standalone: true,
  imports: [FormsModule, NfSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => VilleMaSelectComponent),
      multi: true,
    },
  ],
  template: `
    <nf-select
      [id]="id"
      [label]="label"
      [placeholder]="placeholder"
      [options]="options"
      [required]="required"
      [disabled]="disabled"
      [error]="error"
      [class]="class"
      [ngModel]="displayValue()"
      (ngModelChange)="onSelect($event)"
    />
  `,
})
export class VilleMaSelectComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() placeholder = 'Sélectionner une ville';
  @Input() required = false;
  @Input() error?: string | null;
  @Input() disabled = false;
  @Input() class?: string;
  @Input() id = `nf-ville-ma-select-${nextUniqueId++}`;

  readonly options: NfSelectOption[] = villeSelectOptions();

  /** Valeur affichée dans le select (canonique quand rattachable). */
  readonly displayValue = signal<string>('');

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null | undefined): void {
    const raw = (value ?? '').trim();
    // Rattache le legacy au nom canonique ("beni mellal" → "Béni Mellal") ;
    // les valeurs inconnues restent telles quelles (nf-select les affiche
    // en tête de liste sans les perdre).
    this.displayValue.set(findVilleByNom(raw)?.nom ?? raw);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onSelect(value: string | null | undefined): void {
    const nom = (value ?? '').trim();
    this.displayValue.set(nom);
    this.onChange(nom);
    this.onTouched();
  }
}
