import {
  Component,
  input,
  output,
  computed,
  ViewChild,
  ElementRef,
  AfterViewInit,
  isDevMode,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';

/**
 * Button variant types.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost' | 'stroked';

/**
 * Button size types.
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Button Component
 *
 * Wrapper around Material button with consistent styling.
 *
 * @stable
 *
 * @example
 * <nf-button variant="primary" icon="add">Create Item</nf-button>
 * <nf-button variant="danger" [loading]="isSaving">Delete</nf-button>
 * <nf-button variant="ghost" icon="refresh" (clicked)="refresh()"></nf-button>
 */
/** Lucide icons for nf-button resolve from the app-level registry (`provideAppLucideIcons`). */
const LUCIDE_ICON_NAME_ALIASES: Record<string, string> = {
  close: 'x',
  launch: 'external-link',
  today: 'calendar',
  table: 'table-2',
  // Material icon names still used on legacy pages
  arrow_back: 'arrow-left',
  delete: 'trash-2',
};

@Component({
  selector: 'nf-button',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    LucideAngularModule,
  ],
  template: `
    <button
      mat-button
      [class]="buttonClasses()"
      [disabled]="disabled() || loading()"
      [matTooltip]="tooltip()"
      [matTooltipDisabled]="!tooltip()"
      (click)="onClick($event)"
    >
      @if (loading()) {
        <span class="nf-button__icon-slot">
          <mat-spinner class="nf-button__spinner" diameter="20"></mat-spinner>
        </span>
      } @else if (icon() && iconPosition() === 'left') {
        @if (iconLibrary() === 'lucide') {
          <lucide-icon
            [name]="resolvedLucideIcon()"
            [size]="iconSize()"
            class="nf-button__icon nf-button__icon--left">
          </lucide-icon>
        } @else {
          <mat-icon class="nf-button__icon nf-button__icon--left">{{ icon() }}</mat-icon>
        }
      }

      <span #contentRef class="nf-button__content"><ng-content></ng-content></span>

      @if (!loading() && icon() && iconPosition() === 'right') {
        @if (iconLibrary() === 'lucide') {
          <lucide-icon
            iconPositionEnd
            [name]="resolvedLucideIcon()"
            [size]="iconSize()"
            class="nf-button__icon nf-button__icon--right">
          </lucide-icon>
        } @else {
          <mat-icon class="nf-button__icon nf-button__icon--right">{{ icon() }}</mat-icon>
        }
      }
    </button>
  `,
  styles: [`
    :host {
      display: inline-block;
    }

    :host(.nf-button--full-width) {
      display: block;
      width: 100%;
    }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0;
      line-height: 1;
      font-weight: 500;
      border-radius: 6px;
      transition: all 0.2s ease;
    }

    .nf-button__content {
      display: inline-flex;
      align-items: center;
      gap: var(--nf-button-content-gap, 0.375rem);
      line-height: 1;
      min-width: 0;
    }

    /* Icon-only: hide empty content so icon centers in the button */
    .nf-button__content:empty {
      display: none;
    }

    /* Icon-only: symmetric padding and no line-height so icon centers vertically */
    .nf-button--sm:has(.nf-button__content:empty) {
      padding: 4px;
    }
    .nf-button--md:has(.nf-button__content:empty) {
      padding: 8px;
    }
    .nf-button--lg:has(.nf-button__content:empty) {
      padding: 12px;
    }

    /* Center icon glyph inside mat-icon (fixes uneven font metrics) */
    .nf-button .mat-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      margin: 0;
      line-height: 0;
      flex-shrink: 0;
    }

    // Sizes
    .nf-button--sm {
      padding: 4px 12px;
      font-size: 0.8125rem;
      min-height: 32px;
    }

    .nf-button--md {
      padding: 8px 16px;
      font-size: 0.875rem;
      min-height: 40px;
    }

    .nf-button--lg {
      padding: 12px 24px;
      font-size: 1rem;
      min-height: 48px;
    }

    // Variants (COLOR-SYSTEM semantic tokens)
    // Primary/Danger: force white text+icon so Material theme does not override
    .nf-button--primary {
      background-color: var(--nf-primary);
      color: var(--nf-color-text-inverse, #fff) !important;

      .mat-icon,
      .nf-button__content {
        color: inherit !important;
      }

      &:hover:not(:disabled) {
        background-color: var(--nf-primary-hover);
      }

      &:active:not(:disabled) {
        background-color: var(--nf-primary-active);
      }
    }

    .nf-button--secondary {
      background-color: transparent;
      color: var(--nf-color-gray-700, #374151) !important;
      border: 1px solid var(--nf-primary);

      .mat-icon,
      .nf-button__content {
        color: inherit !important;
      }

      &:hover:not(:disabled) {
        background-color: var(--nf-primary-subtle);
      }
    }

    .nf-button--stroked {
      background-color: transparent;
      color: var(--nf-color-gray-700, #374151) !important;
      border: 1px solid var(--nf-primary);

      .mat-icon,
      .nf-button__content {
        color: inherit !important;
      }

      &:hover:not(:disabled) {
        background-color: var(--nf-primary-subtle);
      }
    }

    .nf-button--tertiary {
      background-color: var(--nf-surface-hover);
      color: var(--nf-text-primary);

      &:hover:not(:disabled) {
        background-color: var(--nf-color-gray-200);
      }

      &.nf-button--active {
        color: var(--nf-primary);

        .mat-icon,
        .nf-button__content {
          color: inherit;
        }
      }
    }

    .nf-button--danger {
      background-color: var(--nf-color-danger-600, #dc2626);
      color: var(--nf-color-text-inverse, #fff) !important;

      .mat-icon,
      .nf-button__content {
        color: inherit !important;
      }

      &:hover:not(:disabled) {
        background-color: var(--nf-color-danger-700, #b91c1c);
      }
    }

    .nf-button--ghost {
      background-color: transparent;
      color: var(--nf-text-secondary);

      &:hover:not(:disabled) {
        background-color: var(--nf-surface-hover);
      }

      &.nf-button--active {
        color: var(--nf-primary);

        .mat-icon,
        .nf-button__content {
          color: inherit;
        }
      }
    }

    // Full width
    .nf-button--full-width {
      width: 100%;
    }

    // Disabled
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    // Spinner (in place of left icon: same slot, same size, centered in slot)
    .nf-button__icon-slot {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .nf-button__icon-slot .nf-button__spinner {
      --mdc-circular-progress-active-indicator-color: currentColor;
      display: block;
      margin: 0;
      width: 20px !important;
      height: 20px !important;
    }

    .nf-button__icon-slot .nf-button__spinner ::ng-deep svg {
      display: block;
      margin: 0 auto;
    }

    .nf-button--sm .nf-button__icon-slot {
      width: 18px;
      height: 18px;
    }

    .nf-button--sm .nf-button__icon-slot .nf-button__spinner {
      width: 18px !important;
      height: 18px !important;
    }

    .nf-button--lg .nf-button__icon-slot {
      width: 24px;
      height: 24px;
    }

    .nf-button--lg .nf-button__icon-slot .nf-button__spinner {
      width: 24px !important;
      height: 24px !important;
    }

    // Icons
    .nf-button__icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
      vertical-align: middle;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .nf-button__icon--left {
      margin-right: var(--nf-button-icon-text-gap, 10px);
    }

    .nf-button__icon--right {
      margin-left: var(--nf-button-icon-text-gap, 10px);
    }

    button:has(.nf-button__content:empty) .nf-button__icon--left,
    button:has(.nf-button__content:empty) .nf-button__icon--right {
      margin-left: 0;
      margin-right: 0;
    }

    .nf-button--sm .nf-button__icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .nf-button--lg .nf-button__icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    /* Lucide icons: inherit color and size from slot */
    .nf-button lucide-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
      vertical-align: middle;
      color: inherit;
      flex-shrink: 0;
    }
  `],
})
export class ButtonComponent implements AfterViewInit {
  @ViewChild('contentRef') private contentRef?: ElementRef<HTMLElement>;

  // Inputs
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
  icon = input<string | undefined>(undefined);
  /** 'material' = mat-icon (default), 'lucide' = lucide-icon (use kebab-case names e.g. trash-2, plus). */
  iconLibrary = input<'material' | 'lucide'>('lucide');
  iconPosition = input<'left' | 'right'>('left');
  loading = input<boolean>(false);
  disabled = input<boolean>(false);
  fullWidth = input<boolean>(false);
  /** When true (ghost or tertiary), text and icon use primary color. Default false. */
  active = input<boolean>(false);

  /** Tooltip text shown on hover. */
  tooltip = input<string>('');

  /** Icon size in px for Lucide (sm: 18, md: 20, lg: 24). */
  iconSize = computed(() => {
    const s = this.size();
    return s === 'sm' ? 18 : s === 'lg' ? 24 : 20;
  });

  resolvedLucideIcon = computed(() => {
    const name = this.icon();
    if (!name) return name;
    return LUCIDE_ICON_NAME_ALIASES[name] ?? name;
  });

  // Outputs
  clicked = output<MouseEvent>();

  // Computed classes
  buttonClasses = computed(() => {
    const classes = [
      'nf-button',
      `nf-button--${this.variant()}`,
      `nf-button--${this.size()}`,
    ];

    if (this.fullWidth()) {
      classes.push('nf-button--full-width');
    }

    if (this.active()) {
      classes.push('nf-button--active');
    }

    return classes.join(' ');
  });

  ngAfterViewInit(): void {
    if (!isDevMode()) return;
    const v = this.variant();
    const hasIcon = !!this.icon();
    const contentEmpty =
      !this.contentRef?.nativeElement?.textContent?.trim();
    if (!hasIcon || !contentEmpty) return;
    if (v === 'danger') {
      console.warn(
        '[nf-button] UX: Danger buttons must not be icon-only. Add a visible label (e.g. "Delete"). See BUTTONS-UX-SEMANTICS.md.'
      );
    } else if (v === 'primary') {
      console.warn(
        '[nf-button] UX: Primary page actions should not be icon-only. Add a visible label. See BUTTONS-UX-SEMANTICS.md.'
      );
    }
  }

  onClick(event: MouseEvent): void {
    if (!this.disabled() && !this.loading()) {
      this.clicked.emit(event);
    }
  }
}
