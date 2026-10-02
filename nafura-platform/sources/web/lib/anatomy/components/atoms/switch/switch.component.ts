import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'nf-switch',
  standalone: true,
  template: `
    <label class="nf-switch" [class.nf-switch--disabled]="disabled()">
      <input
        type="checkbox"
        role="switch"
        [checked]="checked()"
        [disabled]="disabled()"
        [attr.aria-label]="label() || null"
        (change)="changed.emit($any($event.target).checked)"
      />
      <span class="nf-switch__track" aria-hidden="true">
        <span class="nf-switch__thumb"></span>
      </span>
      @if (label()) {
        <span class="nf-switch__label">{{ label() }}</span>
      }
    </label>
  `,
  styles: [`
    :host { display: inline-block; }
    .nf-switch { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; }
    .nf-switch input { position: absolute; opacity: 0; pointer-events: none; }
    .nf-switch__track {
      display: inline-flex;
      align-items: center;
      width: 36px;
      height: 20px;
      padding: 2px;
      border-radius: 999px;
      background: var(--nf-color-border, #cbd5e1);
      transition: background-color 160ms ease;
    }
    .nf-switch__thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--nf-color-surface, #fff);
      box-shadow: 0 1px 3px rgb(15 23 42 / 24%);
      transition: transform 160ms ease;
    }
    input:checked + .nf-switch__track { background: var(--nf-primary, #2563eb); }
    input:checked + .nf-switch__track .nf-switch__thumb { transform: translateX(16px); }
    input:focus-visible + .nf-switch__track { outline: 2px solid var(--nf-primary, #2563eb); outline-offset: 2px; }
    .nf-switch--disabled { cursor: not-allowed; opacity: 0.55; }
    .nf-switch__label { font-size: 0.875rem; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NfSwitchComponent {
  readonly checked = input(false);
  readonly disabled = input(false);
  readonly label = input('');
  readonly changed = output<boolean>();
}