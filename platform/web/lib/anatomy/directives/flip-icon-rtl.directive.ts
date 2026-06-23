import { Directive, ElementRef, OnDestroy, inject } from '@angular/core';

/**
 * FlipIconRtlDirective
 *
 * Mirrors the host element along the inline axis when the document direction
 * is RTL (`<html dir="rtl">`). Restores the original transform when
 * direction switches back to LTR.
 *
 * Use on directional icons whose meaning is tied to reading direction
 * (chevrons, arrow-forward / arrow-back, undo/redo, sort indicators, etc.).
 * Symmetric icons (close, menu, search) should NOT use this directive.
 *
 * The implementation listens to `<html dir>` attribute mutations via a
 * `MutationObserver` so a runtime language switch (FR ↔ AR) reflects
 * immediately without a page reload.
 *
 * Round 2 Phase 2 sub-B — squelette RTL Nafura ERP.
 *
 * @example
 * <mat-icon appFlipIconRtl>chevron_right</mat-icon>
 * <lucide-icon name="arrow-right" appFlipIconRtl></lucide-icon>
 */
@Directive({
  selector: '[appFlipIconRtl]',
  standalone: true,
})
export class FlipIconRtlDirective implements OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly observer: MutationObserver | null;

  constructor() {
    this.update();
    if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
      this.observer = new MutationObserver(() => this.update());
      this.observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['dir'],
      });
    } else {
      this.observer = null;
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private update(): void {
    if (typeof document === 'undefined') return;
    const node = this.el.nativeElement;
    if (!node || !node.style) return;
    const isRtl = document.documentElement.dir === 'rtl';
    node.style.transform = isRtl ? 'scaleX(-1)' : '';
  }
}
