import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
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

import type { LookupSearchFn } from '../../../tokens/lookup-searchers.token';
import {
  LOOKUP_COMBO_MIN_CHARS,
  type LookupComboOption,
  filterLookupHits,
  lookupDisplayLabel,
  resolveLookupEyeRoute,
} from './lookup-combobox.util';

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
export class NfSelectComponent implements ControlValueAccessor, OnChanges, OnInit, OnDestroy {
  private readonly lookupListRoutes = inject(LOOKUP_LIST_ROUTES);
  private readonly lookupRefNav = inject(LookupReferenceNavigationService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly host = inject(ElementRef<HTMLElement>);

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

  /** Known label when the current id is absent from `options` (orphan). */
  @Input() selectedLabel?: string;

  /** Server typeahead. When set, hits are not taken from dumped `options`. */
  @Input() lookupSearch?: LookupSearchFn;

  value = signal<string>('');
  focused = signal(false);
  touched = signal(false);
  /** Options shown in the native <select>, including a fallback label for the current value. */
  displayOptions = signal<NfSelectOption[]>([]);

  readonly comboOpen = signal(false);
  readonly comboQuery = signal('');
  readonly comboEditing = signal(false);
  readonly comboHits = signal<LookupComboOption[]>([]);
  readonly comboActive = signal(0);
  readonly comboError = signal<string | null>(null);

  private debounceHandle: ReturnType<typeof setTimeout> | null = null;
  private blurHandle: ReturnType<typeof setTimeout> | null = null;
  private searchGen = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options'] || changes['selectedLabel']) {
      this.syncDisplayOptions();
      this.refreshComboHits();
    }
  }

  ngOnInit(): void {
    this.syncDisplayOptions();
  }

  ngOnDestroy(): void {
    if (this.debounceHandle) clearTimeout(this.debounceHandle);
    if (this.blurHandle) clearTimeout(this.blurHandle);
  }

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.value.set(value ?? '');
    this.comboEditing.set(false);
    this.comboQuery.set('');
    this.comboOpen.set(false);
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

  isCombobox(): boolean {
    return !!this.lookupKey?.trim();
  }

  comboInputValue(): string {
    if (this.comboEditing()) {
      return this.comboQuery();
    }
    return lookupDisplayLabel(this.value(), this.displayOptions(), this.selectedLabel);
  }

  comboPlaceholder(): string {
    return this.placeholder?.trim() || 'Taper au moins 2 caractères';
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

  onComboFocus(): void {
    if (this.disabled) return;
    this.focused.set(true);
    this.comboEditing.set(true);
    if (!this.value()) {
      this.comboQuery.set('');
    } else {
      this.comboQuery.set(
        lookupDisplayLabel(this.value(), this.displayOptions(), this.selectedLabel)
      );
    }
  }

  onComboInput(event: Event): void {
    const next = (event.target as HTMLInputElement).value ?? '';
    this.comboEditing.set(true);
    this.comboQuery.set(next);
    if (this.debounceHandle) clearTimeout(this.debounceHandle);
    this.debounceHandle = setTimeout(() => this.refreshComboHits(true), 300);
  }

  onComboBlur(): void {
    this.focused.set(false);
    this.touched.set(true);
    this.onTouched();
    if (this.blurHandle) clearTimeout(this.blurHandle);
    this.blurHandle = setTimeout(() => {
      this.comboOpen.set(false);
      this.comboEditing.set(false);
      this.comboQuery.set('');
      this.cdr.markForCheck();
    }, 150);
  }

  onComboKeydown(event: KeyboardEvent): void {
    if (this.disabled) return;
    const hits = this.comboHits();
    if (event.key === 'Escape') {
      event.preventDefault();
      this.comboOpen.set(false);
      this.comboEditing.set(false);
      this.comboQuery.set('');
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!this.comboOpen()) {
        this.refreshComboHits(true);
        return;
      }
      if (!hits.length) return;
      this.comboActive.set((this.comboActive() + 1) % hits.length);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!hits.length) return;
      this.comboActive.set((this.comboActive() - 1 + hits.length) % hits.length);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const hit = hits[this.comboActive()];
      if (hit) this.pickCombo(hit);
    }
  }

  pickCombo(opt: LookupComboOption): void {
    if (opt.disabled) return;
    this.value.set(opt.value);
    this.onChange(opt.value);
    this.comboOpen.set(false);
    this.comboEditing.set(false);
    this.comboQuery.set('');
    this.syncDisplayOptions();
  }

  comboEmptyHint(): boolean {
    return this.comboOpen() && this.comboQuery().trim().length < LOOKUP_COMBO_MIN_CHARS;
  }

  comboNoHits(): boolean {
    return (
      this.comboOpen() &&
      this.comboQuery().trim().length >= LOOKUP_COMBO_MIN_CHARS &&
      this.comboHits().length === 0 &&
      !this.comboError()
    );
  }

  retryComboSearch(): void {
    void this.refreshComboHits(true);
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: MouseEvent): void {
    if (!this.comboOpen()) return;
    if (this.host.nativeElement.contains(event.target as Node)) return;
    this.comboOpen.set(false);
    this.comboEditing.set(false);
    this.comboQuery.set('');
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

  effectiveEyeRoute(): string | undefined {
    return resolveLookupEyeRoute(this.effectiveListRoute(), this.value());
  }

  hasListShortcut(): boolean {
    return this.lookupRefNav.canOpen(this.effectiveEyeRoute() ?? this.effectiveListRoute());
  }

  openListShortcut(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const route = this.effectiveEyeRoute();
    if (!route) {
      return;
    }
    this.lookupRefNav.openListingInNewTab(route);
  }

  listShortcutLabel(): string {
    const shortcut = this.listShortcut ?? this.createShortcut;
    if (shortcut?.label?.trim()) {
      return shortcut.label.trim();
    }
    return this.value()?.trim() ? 'Voir la fiche' : 'Voir la liste';
  }

  private async refreshComboHits(openIfReady = false): Promise<void> {
    const query = this.comboQuery();
    const trimmed = query.trim();
    this.comboError.set(null);

    if (this.lookupSearch) {
      if (trimmed.length < LOOKUP_COMBO_MIN_CHARS) {
        this.comboHits.set([]);
        this.comboActive.set(0);
        if (openIfReady) {
          this.comboOpen.set(true);
        }
        this.cdr.markForCheck();
        return;
      }
      const gen = ++this.searchGen;
      if (openIfReady) {
        this.comboOpen.set(true);
      }
      try {
        const hits = await this.lookupSearch(query);
        if (gen !== this.searchGen) return;
        this.comboHits.set(hits);
        this.comboActive.set(0);
      } catch {
        if (gen !== this.searchGen) return;
        this.comboHits.set([]);
        this.comboError.set('Impossible de charger les résultats');
      }
      this.cdr.markForCheck();
      return;
    }

    const hits = filterLookupHits(this.displayOptions(), query);
    this.comboHits.set(hits);
    this.comboActive.set(0);
    if (openIfReady) {
      this.comboOpen.set(true);
    }
    this.cdr.markForCheck();
  }

  private syncDisplayOptions(): void {
    const opts = this.options ?? [];
    const current = this.value();
    if (current && !opts.some((o) => o.value === current)) {
      const fallbackLabel = lookupDisplayLabel(current, opts, this.selectedLabel);
      this.displayOptions.set([{ value: current, label: fallbackLabel }, ...opts]);
    } else {
      this.displayOptions.set(opts);
    }
    if (!this.isCombobox() && current) {
      queueMicrotask(() => {
        if (this.value() !== current) return;
        this.value.set('');
        this.value.set(current);
        this.cdr.markForCheck();
      });
    } else {
      this.cdr.markForCheck();
    }
  }
}
