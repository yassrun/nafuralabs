import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import type { Compte, CompteClasse, CompteType } from '../../models';
import { ButtonComponent } from '@lib/anatomy/components';


const TYPES: CompteType[] = [
  'CHARGE',
  'PRODUIT',
  'ACTIF',
  'PASSIF',
  'TIERS',
  'TRESORERIE',
];

const CLASSES: CompteClasse[] = [1, 2, 3, 4, 5, 6, 7];

interface DrawerForm {
  code: string;
  libelle: string;
  classe: CompteClasse;
  type: CompteType;
  parentCompteCode: string;
  isCollectif: boolean;
  isLettrable: boolean;
  isAuxiliaire: boolean;
  axeAnalytiqueObligatoire: boolean;
  isActive: boolean;
}

const EMPTY: DrawerForm = {
  code: '',
  libelle: '',
  classe: 6,
  type: 'CHARGE',
  parentCompteCode: '',
  isCollectif: false,
  isLettrable: false,
  isAuxiliaire: false,
  axeAnalytiqueObligatoire: false,
  isActive: true,
};

@Component({
  selector: 'app-compte-edit-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div class="dr__backdrop" (click)="onClose()"></div>
      <aside class="dr">
        <header class="dr__head">
          <div>
            <small>{{ (isCreate() ? 'finance.planComptable.drawer.createBadge' : 'finance.planComptable.drawer.editBadge') | translate }}</small>
            <h3>
              @if (isCreate()) {
                {{ 'finance.planComptable.drawer.createTitle' | translate }}
              } @else {
                {{ form().code }} — {{ form().libelle }}
              }
            </h3>
          </div>
          <nf-button variant="ghost" class="dr__close" (clicked)="onClose()">{{ 'finance.common.actions.close' | translate }}</nf-button>
        </header>

        <section class="dr__body">
          @if (errorMsg(); as msg) {
            <div class="dr__error">{{ msg }}</div>
          }

          <div class="dr__row dr__row--two">
            <label class="dr__field">
              <span>{{ 'finance.planComptable.form.fields.code' | translate }}</span>
              <input
                type="text"
                [ngModel]="form().code"
                (ngModelChange)="patch({ code: $event ?? '' })"
                [disabled]="!isCreate()"
                [attr.placeholder]="'finance.planComptable.drawer.codePlaceholder' | translate" />
            </label>
            <label class="dr__field">
              <span>{{ 'finance.planComptable.form.fields.classe' | translate }}</span>
              <select
                [ngModel]="form().classe"
                (ngModelChange)="patch({ classe: $event })">
                @for (c of classes; track c) {
                  <option [ngValue]="c">{{ c }}</option>
                }
              </select>
            </label>
          </div>

          <label class="dr__field">
            <span>{{ 'finance.planComptable.form.fields.libelle' | translate }}</span>
            <input
              type="text"
              [ngModel]="form().libelle"
              (ngModelChange)="patch({ libelle: $event ?? '' })"
              [attr.placeholder]="'finance.planComptable.drawer.libellePlaceholder' | translate" />
          </label>

          <div class="dr__row dr__row--two">
            <label class="dr__field">
              <span>{{ 'finance.planComptable.drawer.typeComptable' | translate }}</span>
              <select
                [ngModel]="form().type"
                (ngModelChange)="patch({ type: $event })">
                @for (t of types; track t) {
                  <option [ngValue]="t">{{ typeLabel(t) }}</option>
                }
              </select>
            </label>
            <label class="dr__field">
              <span>{{ 'finance.planComptable.form.fields.parent' | translate }}</span>
              <input
                type="text"
                [ngModel]="form().parentCompteCode"
                (ngModelChange)="patch({ parentCompteCode: $event ?? '' })"
                [attr.placeholder]="'finance.planComptable.drawer.parentPlaceholder' | translate" />
            </label>
          </div>

          <fieldset class="dr__check-group">
            <legend>{{ 'finance.planComptable.drawer.attributs' | translate }}</legend>
            <label class="dr__check">
              <input
                type="checkbox"
                [ngModel]="form().isCollectif"
                (ngModelChange)="patch({ isCollectif: $event })" />
              {{ 'finance.planComptable.drawer.attrs.collectif' | translate }}
            </label>
            <label class="dr__check">
              <input
                type="checkbox"
                [ngModel]="form().isLettrable"
                (ngModelChange)="patch({ isLettrable: $event })" />
              {{ 'finance.planComptable.drawer.attrs.lettrable' | translate }}
            </label>
            <label class="dr__check">
              <input
                type="checkbox"
                [ngModel]="form().isAuxiliaire"
                (ngModelChange)="patch({ isAuxiliaire: $event })" />
              {{ 'finance.planComptable.drawer.attrs.auxiliaire' | translate }}
            </label>
            <label class="dr__check">
              <input
                type="checkbox"
                [ngModel]="form().axeAnalytiqueObligatoire"
                (ngModelChange)="patch({ axeAnalytiqueObligatoire: $event })" />
              {{ 'finance.planComptable.drawer.attrs.analytiqueObligatoire' | translate }}
            </label>
            <label class="dr__check">
              <input
                type="checkbox"
                [ngModel]="form().isActive"
                (ngModelChange)="patch({ isActive: $event })" />
              {{ 'finance.planComptable.drawer.attrs.actif' | translate }}
            </label>
          </fieldset>

          @if (!isCreate() && current(); as c) {
            <div class="dr__usage">
              <strong>{{ 'finance.planComptable.drawer.usageTitle' | translate }}</strong>
              <p>
                {{ 'finance.planComptable.drawer.usageCount' | translate: { count: c.nbEcritures ?? 0 } }}
                @if ((c.nbEcritures ?? 0) > 0) {
                  {{ 'finance.planComptable.drawer.deleteBlocked' | translate }}
                }
              </p>
            </div>
          }
        </section>

        <footer class="dr__foot">
          @if (!isCreate() && current()) {
            <nf-button variant="danger" class="dr__btn dr__btn--danger" [disabled]="(current()?.nbEcritures ?? 0)> 0"
              (click)="onDelete()">
              {{ 'finance.common.actions.delete' | translate }}
            </nf-button>
          }
          <nf-button variant="ghost" class="dr__btn dr__btn--ghost" (clicked)="onClose()">
            {{ 'finance.common.actions.cancel' | translate }}
          </nf-button>
          <nf-button variant="primary" class="dr__btn dr__btn--primary" (clicked)="onSave()"  [disabled]="!canSave()">
            {{ (isCreate() ? 'finance.common.actions.create' : 'finance.common.actions.save') | translate }}
          </nf-button>
        </footer>
      </aside>
    }
  `,
  styles: [
    `
      .dr__backdrop {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.4);
        z-index: 99;
      }
      .dr {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: 480px;
        max-width: 100vw;
        background: var(--nf-color-surface);
        box-shadow: -8px 0 24px rgba(15, 23, 42, 0.18);
        z-index: 100;
        display: flex;
        flex-direction: column;
      }
      .dr__head {
        padding: 16px 20px;
        border-bottom: 1px solid var(--nf-color-border);
        display: flex;
        align-items: flex-start;
        gap: 8px;
      }
      .dr__head small {
        color: var(--nf-color-text-secondary);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .dr__head h3 {
        margin: 4px 0 0;
        font-size: 16px;
        color: var(--nf-text-primary);
      }
      .dr__close {
        margin-left: auto;
        background: transparent;
        border: 0;
        font-size: 22px;
        cursor: pointer;
        color: var(--nf-color-text-secondary);
      }
      .dr__body {
        flex: 1;
        overflow: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .dr__error {
        background: var(--nf-color-danger-50);
        color: var(--nf-color-danger-800);
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
      }
      .dr__row {
        display: flex;
        gap: 12px;
      }
      .dr__row--two > * {
        flex: 1;
      }
      .dr__field {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 13px;
      }
      .dr__field > span {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--nf-color-text-secondary);
        font-weight: 600;
      }
      .dr__field input,
      .dr__field select {
        padding: 8px 10px;
        border: 1px solid var(--nf-color-primary-200);
        border-radius: 6px;
        font-size: 13px;
      }
      .dr__field input:disabled {
        background: var(--nf-color-bg-muted);
      }
      .dr__check-group {
        border: 1px solid var(--nf-color-border);
        border-radius: 8px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .dr__check-group legend {
        padding: 0 6px;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--nf-color-text-secondary);
        font-weight: 600;
      }
      .dr__check {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: var(--nf-text-primary);
      }
      .dr__usage {
        background: var(--nf-color-bg-subtle);
        border: 1px solid var(--nf-color-border);
        border-radius: 8px;
        padding: 10px 12px;
        font-size: 12px;
        color: var(--nf-color-text-secondary);
      }
      .dr__usage strong {
        display: block;
        color: var(--nf-text-primary);
        margin-bottom: 4px;
      }
      .dr__foot {
        padding: 12px 20px;
        border-top: 1px solid var(--nf-color-border);
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        background: var(--nf-color-bg-subtle);
      }
      .dr__btn {
        padding: 8px 14px;
        border-radius: 6px;
        font-size: 13px;
        cursor: pointer;
        border: 1px solid transparent;
      }
      .dr__btn--ghost {
        background: var(--nf-color-surface);
        color: var(--nf-color-text-secondary);
        border-color: var(--nf-color-primary-200);
      }
      .dr__btn--primary {
        background: var(--nf-color-primary-700);
        color: var(--nf-color-surface);
      }
      .dr__btn--primary:hover:not(:disabled) {
        background: var(--nf-color-primary-800);
      }
      .dr__btn--primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .dr__btn--danger {
        background: var(--nf-color-surface);
        color: var(--nf-color-danger-600);
        border-color: var(--nf-color-danger-200);
        margin-right: auto;
      }
      .dr__btn--danger:hover:not(:disabled) {
        background: var(--nf-color-danger-50);
      }
      .dr__btn--danger:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `,
  ],
})
export class CompteEditDrawerComponent {
  private readonly translate = inject(TranslateService);

  readonly types = TYPES;
  readonly classes = CLASSES;

  private readonly _open = signal<boolean>(false);
  private readonly _current = signal<Compte | null>(null);
  private readonly _form = signal<DrawerForm>(EMPTY);
  private readonly _error = signal<string | null>(null);

  readonly open = computed(() => this._open());
  readonly current = computed(() => this._current());
  readonly form = computed(() => this._form());
  readonly errorMsg = computed(() => this._error());
  readonly isCreate = computed(() => !this._current());

  readonly canSave = computed(() => {
    const f = this._form();
    return /^[\dA-Z\-]{1,15}$/i.test(f.code) && f.libelle.trim().length > 0;
  });

  @Input() set openCompte(value: Compte | null | undefined) {
    if (value) {
      this._current.set(value);
      this._form.set({
        code: value.code,
        libelle: value.libelle,
        classe: value.classe,
        type: value.type,
        parentCompteCode: value.parentCompteCode ?? '',
        isCollectif: value.isCollectif,
        isLettrable: value.isLettrable,
        isAuxiliaire: value.isAuxiliaire,
        axeAnalytiqueObligatoire: value.axeAnalytiqueObligatoire ?? false,
        isActive: value.isActive,
      });
      this._error.set(null);
      this._open.set(true);
    }
  }

  @Input() set createMode(value: boolean) {
    if (value) {
      this._current.set(null);
      this._form.set({ ...EMPTY });
      this._error.set(null);
      this._open.set(true);
    }
  }

  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly saved = new EventEmitter<DrawerForm & { id?: string }>();
  @Output() readonly deleted = new EventEmitter<Compte>();

  patch(p: Partial<DrawerForm>): void {
    this._form.set({ ...this._form(), ...p });
  }

  typeLabel(t: CompteType): string {
    const key = `finance.planComptable.compteType.${t}`;
    const translated = this.translate.instant(key);
    return translated === key ? t : translated;
  }

  setError(msg: string | null): void {
    this._error.set(msg);
  }

  onSave(): void {
    if (!this.canSave()) return;
    const cur = this._current();
    this.saved.emit({ ...this._form(), id: cur?.id });
  }

  onDelete(): void {
    const cur = this._current();
    if (!cur) return;
    if ((cur.nbEcritures ?? 0) > 0) {
      this._error.set(
        this.translate.instant('finance.planComptable.drawer.deleteBlockedError', {
          count: cur.nbEcritures,
        }),
      );
      return;
    }
    this.deleted.emit(cur);
  }

  onClose(): void {
    this._open.set(false);
    this._current.set(null);
    this._error.set(null);
    this.closed.emit();
  }
}
