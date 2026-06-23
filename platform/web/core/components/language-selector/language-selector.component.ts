/**
 * Language Selector Component
 * 
 * Component for selecting the application language.
 * Displays available languages and allows switching between them.
 */

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs/operators';
import {
  Check,
  ChevronDown,
  Globe,
  LucideAngularModule,
} from 'lucide-angular';
import { I18nService } from '../../i18n/i18n.service';
import { type SupportedLanguage } from '../../i18n/i18n.config';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="nf-lang">
      <button
        type="button"
        class="nf-lang__trigger"
        (click)="toggleOpen()"
        [attr.aria-expanded]="open()"
        [attr.aria-label]="'Select language'">
        <lucide-icon name="globe" [size]="18" aria-hidden="true"></lucide-icon>
        <span class="nf-lang__code">{{ currentLanguageCode() }}</span>
        <lucide-icon name="chevron-down" [size]="16" aria-hidden="true"></lucide-icon>
      </button>

      @if (open()) {
        <div class="nf-lang__dropdown">
          @for (lang of availableLanguages; track lang.code) {
            <button
              type="button"
              class="nf-lang__option"
              [class.is-active]="currentLanguage() === lang.code"
              (click)="selectLanguage(lang.code); open.set(false)">
              <span class="nf-lang__flag">{{ lang.icon }}</span>
              <span>{{ lang.label }}</span>
              @if (currentLanguage() === lang.code) {
                <lucide-icon name="check" [size]="16" class="nf-lang__check" aria-hidden="true"></lucide-icon>
              }
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
      position: relative;
    }

    .nf-lang__trigger {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      height: 34px;
      padding: 0 0.5rem;
      border: 1px solid transparent;
      border-radius: var(--nf-radius-lg, 0.5rem);
      background: transparent;
      color: var(--nf-text-secondary, #4b5563);
      cursor: pointer;
      font-size: var(--nf-font-size-sm, 0.875rem);
      font-weight: 500;
      transition: background var(--nf-transition-fast, 100ms ease);
    }

    .nf-lang__trigger:hover {
      background: var(--nf-surface-hover, #f9fafb);
    }

    .nf-lang__code {
      font-size: var(--nf-font-size-xs, 0.75rem);
      font-weight: 600;
      letter-spacing: 0.03em;
    }

    .nf-lang__dropdown {
      position: absolute;
      top: calc(100% + 4px);
      inset-inline-end: 0;
      min-width: 160px;
      border: 1px solid var(--nf-border-default, #e5e7eb);
      border-radius: var(--nf-radius-xl, 0.75rem);
      background: var(--nf-color-surface, #ffffff);
      box-shadow: var(--nf-shadow-lg);
      padding: var(--nf-space-1, 0.25rem);
      z-index: var(--nf-z-dropdown, 100);
    }

    .nf-lang__option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.5rem;
      border: none;
      border-radius: var(--nf-radius-md, 0.375rem);
      background: transparent;
      color: var(--nf-text-primary, #111827);
      font-size: var(--nf-font-size-sm, 0.875rem);
      cursor: pointer;
      transition: background var(--nf-transition-fast, 100ms ease);
    }

    .nf-lang__option:hover {
      background: var(--nf-surface-hover, #f9fafb);
    }

    .nf-lang__option.is-active {
      background: var(--nf-primary-subtle, #eff6ff);
    }

    .nf-lang__flag {
      font-size: 1.125rem;
    }

    .nf-lang__check {
      margin-inline-start: auto;
      color: var(--nf-color-primary, #3b82f6);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSelectorComponent {
  private readonly i18n = inject(I18nService);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly availableLanguages = [
    { code: 'fr' as SupportedLanguage, label: 'Français', icon: '🇫🇷' },
    { code: 'en' as SupportedLanguage, label: 'English', icon: '🇬🇧' },
    { code: 'ar' as SupportedLanguage, label: 'العربية', icon: '🇲🇦' },
  ];

  // Use a writable signal that we update manually
  readonly currentLanguage = signal<SupportedLanguage>(
    this.i18n.getCurrentLanguage() as SupportedLanguage
  );
  readonly open = signal(false);

  // Listen to language changes and update the signal
  private readonly languageChange$ = this.i18n.onLanguageChange().pipe(
    startWith(this.i18n.getCurrentLanguage())
  );
  private readonly languageChangeSignal = toSignal(
    this.languageChange$,
    { initialValue: this.i18n.getCurrentLanguage() }
  )!;

  constructor() {
    // Update the signal whenever the language changes
    effect(() => {
      const lang = this.languageChangeSignal();
      if (lang) {
        this.currentLanguage.set(lang as SupportedLanguage);
      }
    });
  }

  readonly currentLanguageCode = computed(() => this.currentLanguage().toUpperCase());

  toggleOpen(): void {
    this.open.update((isOpen) => !isOpen);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as Node | null;
    if (!target) {
      return;
    }
    if (!this.elementRef.nativeElement.contains(target)) {
      this.open.set(false);
    }
  }

  selectLanguage(lang: SupportedLanguage): void {
    // Update signal immediately for instant UI feedback
    this.currentLanguage.set(lang);
    this.i18n.useLanguage(lang).subscribe({
      next: () => {
        // Language change is also handled by the effect() above
        // This ensures the signal stays in sync even if the service emits a different value
        this.i18n.persistLanguagePreference(lang);
      },
      error: () => {
        // Revert on error
        this.currentLanguage.set(this.i18n.getCurrentLanguage() as SupportedLanguage);
      }
    });
  }

}
