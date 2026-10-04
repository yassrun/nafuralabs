import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { htmlToMarkdown, renderMarkdown } from '../../../utils/markdown';

/**
 * Markdown field. The value stored is the Markdown source; reading it renders sanitized HTML.
 */
@Component({
  selector: 'nf-richtext',
  standalone: true,
  imports: [TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RichtextComponent), multi: true }],
  template: `
    <div class="nf-richtext">
      <span class="nf-richtext__label">{{ label() | translate }}</span>
      @if (disabled() || readonly()) {
        <div class="nf-richtext__html" [innerHTML]="html()"></div>
      } @else {
        @if (toolbar() !== 'none') {
          <div class="nf-richtext__bar" role="toolbar">
            <button type="button" (click)="wrap('**', '**')">B</button>
            <button type="button" (click)="wrap('*', '*')"><em>I</em></button>
            <button type="button" (click)="insert('\n- ')">•</button>
            <button type="button" (click)="link()">↗</button>
            @if (toolbar() === 'full') {
              <button type="button" (click)="insert('\n## ')">H</button>
              <button type="button" (click)="insert('\n> ')">”</button>
            }
          </div>
        }
        <textarea
          class="nf-richtext__input"
          [value]="value()"
          [attr.maxlength]="maxLength()"
          [attr.aria-label]="label()"
          rows="6"
          (input)="onInput($event)"
          (paste)="onPaste($event)"></textarea>
      }
    </div>
  `,
  styles: `
    :host { display: block; }
    .nf-richtext { display: flex; flex-direction: column; gap: 6px; }
    .nf-richtext__label { font-size: 0.8125rem; color: var(--nf-text-secondary, #374151); }
    .nf-richtext__bar { display: flex; flex-wrap: wrap; gap: 4px; }
    .nf-richtext__bar button {
      min-width: 32px;
      border: 1px solid var(--nf-border-default, #e5e7eb);
      background: var(--nf-surface-card, #fff);
      border-radius: 6px;
      cursor: pointer;
    }
    .nf-richtext__input {
      width: 100%;
      min-height: 120px;
      border: 1px solid var(--nf-border-default, #e5e7eb);
      border-radius: 8px;
      padding: 8px;
      font: inherit;
      resize: vertical;
    }
    .nf-richtext__html { font-size: 0.9375rem; line-height: 1.5; overflow-wrap: anywhere; }
    .nf-richtext__html :where(p, ul, ol) { margin: 0 0 0.5rem; }
    @media (max-width: 767px) {
      .nf-richtext__bar button { min-height: 36px; }
    }
  `,
})
export class RichtextComponent implements ControlValueAccessor {
  readonly label = input('');
  readonly toolbar = input<'basic' | 'full' | 'none'>('basic');
  readonly readonly = input(false);
  readonly maxLength = input<number | undefined>(undefined);

  readonly value = signal('');
  readonly disabled = signal(false);
  readonly html = signal('');

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    const text = value ?? '';
    this.value.set(text);
    this.html.set(renderMarkdown(text));
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }

  onInput(event: Event): void {
    const text = (event.target as HTMLTextAreaElement).value;
    this.commit(text);
  }

  onPaste(event: ClipboardEvent): void {
    const html = event.clipboardData?.getData('text/html');
    if (!html) return;
    event.preventDefault();
    this.commit(htmlToMarkdown(html));
  }

  wrap(before: string, after: string): void {
    this.commit(`${this.value()}${before}${after}`);
  }

  insert(token: string): void {
    this.commit(`${this.value()}${token}`);
  }

  link(): void {
    this.commit(`${this.value()}[texte](https://)`);
  }

  private commit(text: string): void {
    this.value.set(text);
    this.html.set(renderMarkdown(text));
    this.onChange(text);
    this.onTouched();
  }
}
