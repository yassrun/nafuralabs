import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnDestroy,
  forwardRef,
  inject,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';

import { ButtonComponent } from '@platform/lib/anatomy';

import { ItemsApiService } from '@app/catalogue/services/items-api.service';
import {
  openCatalogItemPicker,
} from '@app/etudes/dossiers/components/catalog-item-pick-dialog/catalog-item-pick-dialog.component';
import type { ArticlePickerContext } from './article-picker.component';

@Component({
  selector: 'app-article-picker-field',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ArticlePickerFieldComponent),
      multi: true,
    },
  ],
  template: `
    <div class="apf">
      <nf-button
        variant="secondary"
        size="sm"
        [fullWidth]="true"
        data-testid="article-picker-open"
        [disabled]="disabled"
        (clicked)="open()"
      >
        {{ label() || 'Choisir un article' }}
      </nf-button>
      @if (value && !disabled) {
        <nf-button variant="ghost" size="sm" (clicked)="clear()">Effacer</nf-button>
      }
    </div>
  `,
  styles: `
    .apf { display: flex; align-items: center; gap: 0.5rem; width: 100%; }
    .apf nf-button:first-child { flex: 1; min-width: 12rem; }
  `,
})
export class ArticlePickerFieldComponent implements ControlValueAccessor, OnDestroy {
  private readonly dialog = inject(MatDialog);
  private readonly itemsApi = inject(ItemsApiService);

  @Input() context: Extract<ArticlePickerContext, 'stock' | 'lookup'> = 'lookup';

  readonly label = signal('');
  value: string | null = null;
  disabled = false;

  private alive = true;
  private onChange: (v: string | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.value = value || null;
    if (this.value) void this.resolveLabel(this.value);
    else this.label.set('');
  }

  registerOnChange(fn: (v: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  ngOnDestroy(): void {
    this.alive = false;
  }

  async open(): Promise<void> {
    if (this.disabled) return;
    this.onTouched();
    const result = await openCatalogItemPicker(this.dialog, { context: this.context, uniteOptions: [] });
    if (!result?.itemId) return;
    this.value = result.itemId;
    this.label.set([result.code, result.name].filter(Boolean).join(' — ') || result.name);
    this.onChange(this.value);
  }

  clear(): void {
    this.value = null;
    this.label.set('');
    this.onChange(null);
    this.onTouched();
  }

  private async resolveLabel(id: string): Promise<void> {
    try {
      const item = await this.itemsApi.getById(id);
      if (!this.alive || this.value !== id) return;
      this.label.set([item.code, item.name].filter(Boolean).join(' — ') || item.name);
    } catch {
      if (this.alive && this.value === id) this.label.set(id);
    }
  }
}
