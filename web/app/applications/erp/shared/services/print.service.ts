import { Injectable } from '@angular/core';

/**
 * Centralized print service for ERP pages.
 * Each method applies a brief CSS-class animation before delegating to `globalThis.print()`.
 */
@Injectable({ providedIn: 'root' })
export class PrintService {
  private triggerPrint(title?: string): void {
    if (title) {
      const prev = document.title;
      document.title = title;
      document.body.classList.add('print-preparing');
      setTimeout(() => {
        document.body.classList.remove('print-preparing');
        globalThis.print();
        document.title = prev;
      }, 150);
    } else {
      document.body.classList.add('print-preparing');
      setTimeout(() => {
        document.body.classList.remove('print-preparing');
        globalThis.print();
      }, 150);
    }
  }

  /** Generic situation / meter / ledger print. */
  printSituation(title?: string): void {
    this.triggerPrint(title);
  }

  /** Print a client invoice (facture). */
  printFacture(title?: string): void {
    this.triggerPrint(title);
  }

  /** Print a credit note (avoir). */
  printAvoir(title?: string): void {
    this.triggerPrint(title);
  }

  /** Print a project budget sheet. */
  printBudget(title?: string): void {
    this.triggerPrint(title);
  }

  /** Print a legal register (registres légaux). */
  printLegaux(title?: string): void {
    this.triggerPrint(title);
  }
}
