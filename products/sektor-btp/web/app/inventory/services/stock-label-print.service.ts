import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StockLabelPrintService {
  private readonly doc = inject(DOCUMENT);

  /**
   * Multi-étiquettes 50×30 mm (M-STK-05) — fenêtre d’impression navigateur.
   */
  openArticleLabels(
    article: { id: string; code: string; name: string },
    options?: { lot?: string; emplacementCode?: string; copies?: number },
  ): void {
    const lot = options?.lot ?? '';
    const emp = options?.emplacementCode ?? '';
    const copies = Math.min(24, Math.max(1, options?.copies ?? 6));
    const payload = `nafura://article/${encodeURIComponent(article.id)}?lot=${encodeURIComponent(lot)}&emp=${encodeURIComponent(emp)}`;
    const win = this.doc.defaultView?.open('', '_blank', 'noopener,width=720,height=1040');
    if (!win) return;
    const esc = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    win.document.write(`<!DOCTYPE html><html><head><title>Étiquettes ${esc(article.code)}</title>
      <style>
        @page { size: A4; margin: 8mm; }
        body { font-family: system-ui, sans-serif; margin: 0; }
        .grid { display: grid; grid-template-columns: repeat(4, 50mm); gap: 4mm; }
        .tag { width: 50mm; height: 30mm; border: 0.2mm solid var(--nf-text-primary); box-sizing: border-box; padding: 2mm; display: flex; flex-direction: column; justify-content: space-between; font-size: 8pt; }
        .code { font-weight: 700; font-size: 9pt; }
        .qr { align-self: center; width: 14mm; height: 14mm; }
        .tag-title { font-size: 10pt; margin: 0 0 4mm; }
        .tag-payload { font-size: 6pt; word-break: break-all; }
      </style></head><body>
      <p class="tag-title">${esc(article.name)} — ${esc(article.code)}</p>
      <div class="grid">${Array.from({ length: copies }, () => `<div class="tag"><div class="code">${esc(article.code)}</div><div class="qr"><img alt="" width="56" height="56" src="https://api.qrserver.com/v1/create-qr-code/?size=56x56&data=${encodeURIComponent(payload)}" /></div><div class="tag-payload">${esc(payload)}</div></div>`).join('')}</div>
      <script>window.onload = () => { window.print(); };</script>
      </body></html>`);
    win.document.close();
  }
}
