import { Component, input, output, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Lightweight code editor (textarea-based).
 * For full HTML/Thymeleaf highlighting, consider integrating CodeMirror 6 later.
 */
@Component({
  selector: 'nf-code-editor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="nf-code-editor" [class.nf-code-editor--disabled]="disabled()">
      <textarea
        #textarea
        class="nf-code-editor__input"
        [value]="value()"
        [disabled]="disabled()"
        [placeholder]="placeholder()"
        [attr.rows]="rows()"
        (input)="onInput($event)"
        (keydown.tab)="onTab($event)">
      </textarea>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .nf-code-editor {
        border: 1px solid var(--nf-border-default, #e0e0e0);
        border-radius: 6px;
        overflow: hidden;
        background: var(--nf-surface-code, #1e1e1e);
      }
      .nf-code-editor--disabled {
        opacity: 0.7;
        pointer-events: none;
      }
      .nf-code-editor__input {
        display: block;
        width: 100%;
        min-height: 200px;
        padding: 12px;
        margin: 0;
        border: none;
        resize: vertical;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 13px;
        line-height: 1.5;
        color: var(--nf-text-primary, #d4d4d4);
        background: transparent;
        box-sizing: border-box;
      }
      .nf-code-editor__input::placeholder {
        color: var(--nf-text-muted, #6b6b6b);
      }
      .nf-code-editor__input:focus {
        outline: none;
      }
    `,
  ],
})
export class CodeEditorComponent {
  /** Current value (one-way or two-way with model()). */
  readonly value = input<string>('');
  /** Placeholder text. */
  readonly placeholder = input<string>('');
  /** Approximate visible rows. */
  readonly rows = input<number>(16);
  /** Disable editing (e.g. system template). */
  readonly disabled = input<boolean>(false);
  /** Language hint for future syntax highlighting (e.g. 'html'). */
  readonly language = input<string>('html');

  /** Emits when content changes. */
  readonly valueChange = output<string>();

  readonly textarea = viewChild<ElementRef<HTMLTextAreaElement>>('textarea');

  onInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.valueChange.emit(target.value);
  }

  onTab(event: KeyboardEvent): void {
    event.preventDefault();
    const el = this.textarea()?.nativeElement;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = el.value.substring(0, start);
    const after = el.value.substring(end);
    const newVal = before + '  ' + after;
    el.value = newVal;
    el.selectionStart = el.selectionEnd = start + 2;
    this.valueChange.emit(newVal);
  }

  /** Insert text at cursor (e.g. from variable sidebar). */
  insertAtCursor(text: string): void {
    const el = this.textarea()?.nativeElement;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = el.value.substring(0, start);
    const after = el.value.substring(end);
    const newVal = before + text + after;
    el.value = newVal;
    const newPos = start + text.length;
    el.selectionStart = el.selectionEnd = newPos;
    el.focus();
    this.valueChange.emit(newVal);
  }
}
