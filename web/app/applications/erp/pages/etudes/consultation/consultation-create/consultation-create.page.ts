import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import {
  ButtonComponent,
  PageHeaderComponent,
  PageShellComponent,
  ToastService,
} from '@lib/anatomy';

import { ConsultationApiService } from '../services';

@Component({
  selector: 'app-consultation-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    PageShellComponent,
    PageHeaderComponent,
    ButtonComponent,
  ],
  template: `
    <nf-page-shell [scroll]="true">
      <nf-page-header [config]="headerConfig"></nf-page-header>
      <section class="create-form">
        <p class="hint">
          Renseignez l’objet de la consultation. Vous saisirez ensuite le bordereau
          manuellement (lots, postes), puis la décomposition et le chiffrage.
        </p>

        <div class="fields" [formGroup]="form">
          <label class="field">
            <span class="field__label">Objet de la consultation <em>*</em></span>
            <input
              class="field__input"
              type="text"
              formControlName="objet"
              autocomplete="off"
              placeholder="Ex. Consultation lots gros œuvre" />
          </label>

          <div class="grid-2">
            <label class="field">
              <span class="field__label">N° (optionnel — généré si vide)</span>
              <input class="field__input" type="text" formControlName="numero" autocomplete="off" />
            </label>
            <label class="field">
              <span class="field__label">Chantier (nom, optionnel)</span>
              <input class="field__input" type="text" formControlName="chantierName" autocomplete="off" />
            </label>
          </div>

          <label class="field">
            <span class="field__label">Notes (optionnel)</span>
            <textarea class="field__input field__textarea" rows="3" formControlName="notes"></textarea>
          </label>

          <footer>
            <nf-button variant="secondary" (clicked)="cancel()">Annuler</nf-button>
            <nf-button
              variant="primary"
              [disabled]="form.invalid || saving()"
              (clicked)="save()">
              Créer la consultation
            </nf-button>
          </footer>
        </div>
      </section>
    </nf-page-shell>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .create-form {
      display: grid;
      gap: 1rem;
      max-width: 48rem;
      padding: 0 1.5rem 1.5rem;
    }
    .hint {
      margin: 0;
      padding: 0.85rem 1rem;
      border-radius: 0.5rem;
      background: color-mix(in srgb, var(--nf-color-primary, #2563eb) 8%, transparent);
      border: 1px solid color-mix(in srgb, var(--nf-color-primary, #2563eb) 22%, transparent);
      color: var(--nf-color-text, #1a1a1a);
      font-size: 0.875rem;
      line-height: 1.45;
    }
    .fields { display: grid; gap: 1rem; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .field { display: grid; gap: 0.35rem; }
    .field__label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--nf-color-text, #1a1a1a);
    }
    .field__label em { color: #dc2626; font-style: normal; }
    .field__input {
      width: 100%;
      box-sizing: border-box;
      height: 2.5rem;
      padding: 0.5rem 0.75rem;
      font-size: 1rem;
      border: 1px solid var(--nf-color-border, #d1d5db);
      border-radius: 0.375rem;
      background: #fff;
      color: inherit;
    }
    .field__input:focus {
      outline: none;
      border-color: var(--nf-color-primary, #3b82f6);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
    }
    .field__textarea { height: auto; min-height: 5rem; resize: vertical; }
    footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem; }
    @media (max-width: 640px) {
      .grid-2 { grid-template-columns: 1fr; }
    }
  `],
})
export class ConsultationCreatePage {
  private readonly api = inject(ConsultationApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly headerConfig = { title: 'Nouvelle consultation' };
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    objet: ['', [Validators.required, Validators.minLength(1)]],
    numero: [''],
    chantierName: [''],
    notes: [''],
  });

  async save(): Promise<void> {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    const value = this.form.getRawValue();
    try {
      const created = await this.api.create({
        objet: value.objet.trim(),
        numero: value.numero.trim() || undefined,
        chantierName: value.chantierName.trim() || undefined,
        notes: value.notes.trim() || undefined,
      });
      this.toast.success('Consultation créée — importez le bordereau / CPS');
      await this.router.navigate(['/etudes/consultation', created.id]);
    } catch {
      this.toast.error('Échec de la création de la consultation');
      this.saving.set(false);
    }
  }

  cancel(): void {
    void this.router.navigate(['/etudes/consultation']);
  }
}
