import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';

export interface FormErrorSummaryItem {
  /** Dot-path for nested controls, e.g. `address.city` */
  path: string;
  label: string;
  message: string;
}

function formatValidatorMessage(errorKey: string, payload: unknown): string {
  if (payload == null || typeof payload !== 'object') {
    const map: Record<string, string> = {
      required: 'Champ obligatoire',
      email: 'Adresse e-mail invalide',
      minlength: 'Trop court',
      maxlength: 'Trop long',
      min: 'Valeur trop petite',
      max: 'Valeur trop grande',
      pattern: 'Format invalide',
    };
    return map[errorKey] ?? errorKey;
  }
  const p = payload as Record<string, unknown>;
  switch (errorKey) {
    case 'minlength':
      return `Minimum ${p['requiredLength'] ?? '?'} caractères`;
    case 'maxlength':
      return `Maximum ${p['requiredLength'] ?? '?'} caractères`;
    case 'min':
      return `Minimum : ${p['min']}`;
    case 'max':
      return `Maximum : ${p['max']}`;
    case 'pattern':
      return String(p['message'] ?? 'Format invalide');
    default:
      return errorKey;
  }
}

function walkInvalidControls(
  control: AbstractControl | null,
  labelMap: Record<string, string>,
  parentPath: string,
  out: FormErrorSummaryItem[],
): void {
  if (!control || control.disabled) return;

  if (control instanceof FormGroup) {
    for (const key of Object.keys(control.controls)) {
      const child = control.get(key);
      const next = parentPath ? `${parentPath}.${key}` : key;
      walkInvalidControls(child, labelMap, next, out);
    }
    return;
  }

  if (control instanceof FormArray) {
    control.controls.forEach((c, i) => {
      const next = `${parentPath}.${i}`;
      walkInvalidControls(c, labelMap, next, out);
    });
    return;
  }

  if (control instanceof FormControl && control.invalid && control.touched) {
    const errs = control.errors;
    if (!errs) return;
    const errKey = Object.keys(errs)[0];
    const shortPath = parentPath.includes('.') ? parentPath.split('.').pop()! : parentPath;
    out.push({
      path: parentPath,
      label: labelMap[parentPath] ?? labelMap[shortPath] ?? shortPath,
      message: formatValidatorMessage(errKey, errs[errKey]),
    });
  }
}

/**
 * Lists invalid touched controls on a form for accessibility and faster correction.
 */
@Component({
  selector: 'nf-form-error-summary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (visible()) {
      <div class="nf-form-error-summary" role="alert" aria-live="polite">
        <div class="nf-form-error-summary__title">{{ title() }}</div>
        <ul class="nf-form-error-summary__list">
          @for (e of items(); track e.path) {
            <li>
              <button type="button" class="nf-form-error-summary__link" (click)="onPick(e.path)">
                <strong>{{ e.label }}</strong>
                <span class="nf-form-error-summary__msg"> — {{ e.message }}</span>
              </button>
            </li>
          }
        </ul>
      </div>
    }
  `,
  styles: [`
    .nf-form-error-summary {
      margin-bottom: 1rem;
      padding: 0.75rem 1rem;
      border: 1px solid #fecaca;
      border-radius: 0.5rem;
      background: #fef2f2;
      color: #7f1d1d;
    }
    .nf-form-error-summary__title {
      font-weight: 700;
      font-size: 0.875rem;
      margin-bottom: 0.35rem;
    }
    .nf-form-error-summary__list {
      margin: 0;
      padding-left: 1.1rem;
      font-size: 0.82rem;
    }
    .nf-form-error-summary__link {
      display: inline;
      padding: 0;
      border: 0;
      background: none;
      color: inherit;
      cursor: pointer;
      text-align: left;
      font: inherit;
      text-decoration: underline;
    }
    .nf-form-error-summary__link:hover { color: #991b1b; }
    .nf-form-error-summary__msg { font-weight: 500; }
  `],
})
export class FormErrorSummaryComponent {
  /** Root form (typically a FormGroup). */
  form = input.required<AbstractControl | null>();

  /** Human labels keyed by control path (same as `formControlName` path). */
  labelMap = input<Record<string, string>>({});

  title = input<string>('Veuillez corriger les erreurs suivantes :');

  /** When true, summary is shown if there are invalid touched fields. */
  show = input<boolean>(false);

  readonly itemPick = output<string>();

  readonly items = computed(() => {
    const root = this.form();
    if (!root) return [];
    const out: FormErrorSummaryItem[] = [];
    walkInvalidControls(root, this.labelMap(), '', out);
    return out;
  });

  readonly visible = computed(() => this.show() && this.items().length > 0);

  onPick(path: string): void {
    this.itemPick.emit(path);
    const id = `nf-field-${path.replace(/\./g, '-')}`;
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const focusable = el?.querySelector<HTMLElement>(
      'input, select, textarea, button, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.focus();
  }
}
