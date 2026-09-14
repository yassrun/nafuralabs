import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, inject, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/** Preserve print CSS in an isolated document, without allowing scripts or same-origin access. */
@Component({
  selector: 'app-document-preview',
  standalone: true,
  template: `<div class="sheet" [style.width.px]="794 * scale()" [style.height.px]="1123 * scale()"><iframe [srcdoc]="source" sandbox=""
    [style.transform]="'scale(' + scale() + ')'" title="Aperçu du document"></iframe></div>`,
  styles: [`:host { display: block; box-sizing: border-box; min-width: 0; min-height: 480px; height: 100%; overflow: auto; padding: 20px; background: #e8ebef; }
    .sheet { margin: 0 auto; background: white; box-shadow: 0 2px 10px #00000018; }
    iframe { width: 794px; height: 1123px; border: 0; background: white; transform-origin: top left; }`],
})
export class DocumentPreviewComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() html = '';
  @Input() marginTop = 15;
  @Input() marginRight = 12;
  @Input() marginBottom = 15;
  @Input() marginLeft = 12;
  private readonly sanitizer = inject(DomSanitizer);
  private readonly element = inject(ElementRef<HTMLElement>);
  private observer?: ResizeObserver;
  readonly scale = signal(1);
  source: SafeHtml | null = null;

  ngAfterViewInit(): void {
    this.observer = new ResizeObserver(([entry]) => {
      this.scale.set(Math.min(1, entry.contentRect.width / 794));
    });
    this.observer.observe(this.element.nativeElement);
  }

  ngOnDestroy(): void { this.observer?.disconnect(); }

  ngOnChanges(): void {
    // Only self-contained print assets are needed. Block network requests as well as scripts.
    const policy = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'">`;
    const document = /<head\b[^>]*>/i.test(this.html)
      ? this.html.replace(/<head\b[^>]*>/i, (head) => head + policy)
      : policy + this.html;
    // Chromium applies PDF margins during printing, but @page has no effect on screen.
    const margins = [this.marginTop, this.marginRight, this.marginBottom, this.marginLeft]
      .map(value => `${Number.isFinite(value) ? Math.max(0, value) : 15}mm`).join(' ');
    const screenMargins = `<style>@media screen { body { box-sizing: border-box !important; margin: 0 !important; padding: ${margins} !important; } }</style>`;
    const preview = /<\/head\s*>/i.test(document)
      ? document.replace(/<\/head\s*>/i, screenMargins + '</head>')
      : document + screenMargins;
    this.source = this.sanitizer.bypassSecurityTrustHtml(preview);
  }
}
