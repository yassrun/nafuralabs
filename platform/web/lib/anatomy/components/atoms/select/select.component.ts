import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  inject,
  forwardRef,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LOOKUP_LIST_ROUTES } from '../../../tokens/lookup-list-routes.token';
import { LookupReferenceNavigationService } from '../../../services/lookup-reference-navigation.service';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';

export interface NfSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/** Opens the listing for a referential in a new tab. */
export interface NfSelectListShortcut {
  /** When omitted, resolved from {@link lookupKey} / {@link listRoute}. */
  route?: string;
  label?: string;
}

let nextUniqueId = 0;

@Component({
  selector: 'nf-select',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './select.component.html',
  styleUrl: './select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NfSelectComponent),
      multi: true,
    },
  ],
})
export class NfSelectComponent implements ControlValueAccessor, OnChanges, OnInit {
  private readonly lookupListRoutes = inject(LOOKUP_LIST_ROUTES);
  private readonly lookupRefNav = inject(LookupReferenceNavigationService);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() label?: string;
  @Input() placeholder?: string;
  @Input() options: NfSelectOption[] = [];
  @Input() required = false;
  @Input() error?: string | null;
  @Input() disabled = false;
  @Input() class?: string;
  @Input() id = `nf-select-${nextUniqueId++}`;

  /** Shortcut to open the related listing (e.g. clients list). */
  @Input() listShortcut?: NfSelectListShortcut | null;

  /** @deprecated Use {@link listShortcut} — kept for backward compatibility. */
  @Input() createShortcut?: NfSelectListShortcut | null;

  /** Resolves listing route via app-provided {@link LOOKUP_LIST_ROUTES}. */
  @Input() lookupKey?: string;

  /** Explicit listing route (overrides lookupKey resolution). */
  @Input() listRoute?: string;

  /** @deprecated Use {@link listRoute} */
  @Input() createRoute?: string;

  value = signal<string>('');
  focused = signal(false);
  touched = signal(false);
  /** Options shown in the dropdown, including a fallback label for the current value. */
  displayOptions = signal<NfSelectOption[]>([]);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options']) {
      this.syncDisplayOptions();
    }
  }

  ngOnInit(): void {
    this.syncDisplayOptions();
  }

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.value.set(value ?? '');
    this.syncDisplayOptions();
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

  onValueChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const newValue = selectElement.value;
    this.value.set(newValue);
    this.onChange(newValue);
  }

  onFocus(): void {
    this.focused.set(true);
  }

  onBlur(): void {
    this.focused.set(false);
    this.touched.set(true);
    this.onTouched();
  }

  shouldShowError(): boolean {
    return !!(this.error && this.touched());
  }

  effectiveListRoute(): string | undefined {
    const shortcut = this.listShortcut ?? this.createShortcut;
    const fromShortcut = shortcut?.route?.trim();
    if (fromShortcut) {
      return fromShortcut;
    }
    const explicit = (this.listRoute ?? this.createRoute)?.trim();
    if (explicit) {
      return explicit;
    }
    const key = this.lookupKey?.trim();
    if (!key) {
      return undefined;
    }
    return this.lookupListRoutes[key];
  }

  hasListShortcut(): boolean {
    return this.lookupRefNav.canOpen(this.effectiveListRoute());
  }

  openListShortcut(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const route = this.effectiveListRoute();
    if (!route) {
      return;
    }
    this.lookupRefNav.openListingInNewTab(route);
  }

  listShortcutLabel(): string {
    const shortcut = this.listShortcut ?? this.createShortcut;
    return shortcut?.label?.trim() || 'Voir la liste';
  }

  private syncDisplayOptions(): void {
    const opts = this.options ?? [];
    const current = this.value();
    if (current && !opts.some((o) => o.value === current)) {
      const fallbackLabel =
        opts.find((o) => o.label.toLowerCase().includes(current.toLowerCase()))?.label ?? current;
      this.displayOptions.set([{ value: current, label: fallbackLabel }, ...opts]);
    } else {
      this.displayOptions.set(opts);
    }
    this.cdr.markForCheck();
  }
}

