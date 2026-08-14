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
    <div class="nf-code-editor" [class.nf-code-editor--readonly]="disabled()">
      <textarea
        #textarea
        class="nf-code-editor__input"
        [value]="value()"
        [readonly]="disabled()"
        [attr.aria-readonly]="disabled() ? 'true' : null"
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
        background: var(--nf-surface-code, #f9fafb);
      }
      /* Read-only: still selectable and copyable (system templates must be readable). */
      .nf-code-editor--readonly {
        background: var(--nf-surface-hover, #f3f4f6);
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
        /* Paired with --nf-surface-code; never use --nf-text-primary here. */
        color: var(--nf-text-code, #111827);
        background: transparent;
        box-sizing: border-box;
      }
      .nf-code-editor__input:read-only {
        cursor: default;
      }
      .nf-code-editor__input::placeholder {
        color: var(--nf-text-code-muted, #6b7280);
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
    if (this.disabled()) return;
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

  /**
   * Place the caret at the start of a 1-based line and scroll it into view.
   * Used to jump to the line reported by a template render error.
   */
  revealLine(line: number): void {
    const el = this.textarea()?.nativeElement;
    if (!el || line < 1) return;
    const lines = el.value.split('\n');
    const target = Math.min(line, lines.length);
    const offset = lines.slice(0, target - 1).reduce((sum, l) => sum + l.length + 1, 0);
    el.focus();
    el.selectionStart = offset;
    el.selectionEnd = offset + (lines[target - 1]?.length ?? 0);
    // Approximate scroll: line height is fixed by the monospace style above.
    const lineHeight = el.scrollHeight / Math.max(lines.length, 1);
    el.scrollTop = Math.max(0, (target - 3) * lineHeight);
  }

  /** Insert text at cursor (e.g. from variable sidebar). No-op when read-only. */
  insertAtCursor(text: string): void {
    if (this.disabled()) return;
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
