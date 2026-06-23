# 12 — Exports CSV/XLSX + Impressions PDF

> **Sévérité** : P2
> **Estimation** : 1 sprint (S9–S10)
> **Dépendances** : `01-foundations`, `08-administration` (logo + ICE/IF société)

## Findings traités

- [ ] **F-27** Absence d'export CSV/Excel/PDF sur tous les tableaux
- [ ] **F-28** Impression / génération PDF invisible pour BC, devis, factures, situations, contrats

## Goal

1. Bouton « Exporter » sur **chaque listing** : CSV, XLSX (avec mise en forme), PDF (impression formattée)
2. **Templates documents imprimables** pour : BC fournisseur, Devis client, Facture (client + fournisseur), Situation, Contrat marché, Avenant, Bon de réception, Bon de sortie, Décompte général définitif (DGD), Fiche de paie, PPSPS, Déclaration AT CNSS

## Architecture

### Service centralisé

**Fichier** : `app/platform/lib/anatomy/services/export.service.ts`

```ts
@Injectable({ providedIn: 'root' })
export class ExportService {
  /**
   * Export CSV depuis array d'objets.
   */
  exportCsv<T>(data: T[], options: { filename: string; columns: ExportColumn<T>[]; delimiter?: string }): void;

  /**
   * Export XLSX avec formatting (headers gras, colonnes auto-sized, format MAD pour montants).
   */
  exportXlsx<T>(data: T[], options: { filename: string; sheetName?: string; columns: ExportColumn<T>[] }): void;

  /**
   * Imprime/télécharge PDF d'une page courante (via window.print + media print CSS).
   */
  printPage(): void;

  /**
   * Génère PDF depuis template HTML serveur (Puppeteer côté backend).
   */
  generatePdf(template: PdfTemplate, data: unknown): Promise<Blob>;
}
```

### Bibliothèques recommandées

- **CSV** : implémentation maison (50 lignes, suffisante)
- **XLSX** : `exceljs` (formatting, formules, multi-sheets)
- **PDF côté client** : `pdfmake` ou `jspdf` (limité)
- **PDF côté serveur** (recommandé) : `puppeteer` ou `playwright` headless rendant un template HTML — fidélité parfaite

---

## Task 12.1 — Bouton Exporter générique

**Composant** : `<nf-export-button>` au niveau `<nf-page-header>` actions :

```html
<nf-export-button
  [data]="rows()"
  [columns]="exportColumns"
  [filename]="'bons-commande-' + currentDate"
  [formats]="['csv', 'xlsx', 'print']">
</nf-export-button>
```

**UX** : dropdown avec 3 options (CSV / Excel / Imprimer).

**Acceptance criteria** :
- [ ] Bouton présent sur 100% des listings
- [ ] Export inclut filtres actifs (pas tout le dataset)
- [ ] Filename auto : `<entité>-YYYY-MM-DD-HH-mm.<ext>`
- [ ] Test : exporter listing BC, ouvrir dans Excel, vérifier formatage MAD

---

## Task 12.2 — Templates documents imprimables

**Pattern** : pour chaque type de document, un template HTML/CSS dédié.

**Fichier example** : `app/applications/erp/pages/achats/commandes/print/bc-print.template.ts`

```ts
@Component({
  selector: 'app-bc-print-template',
  standalone: true,
  template: `
    <article class="print-doc">
      <header class="print-header">
        <img [src]="company().logoUrl" alt="Logo" class="logo">
        <div class="company-info">
          <h1>{{ company().nom }}</h1>
          <p>{{ company().adresseSiege }}</p>
          <p>ICE: {{ company().ice }} · IF: {{ company().if }} · RC: {{ company().rc }}</p>
          <p>{{ company().telephone }} · {{ company().email }}</p>
        </div>
      </header>

      <section class="doc-title">
        <h2>BON DE COMMANDE N° {{ bc.numero }}</h2>
        <p>Date : {{ bc.dateEmission | date:'longDate':'':'fr-MA' }}</p>
      </section>

      <section class="parties">
        <div class="fournisseur">
          <h3>Fournisseur</h3>
          <p><strong>{{ bc.fournisseurNom }}</strong></p>
          <p>{{ bc.fournisseurAdresse }}</p>
          <p>ICE: {{ bc.fournisseurIce }}</p>
        </div>
        <div class="livraison">
          <h3>Livraison</h3>
          <p>Chantier: {{ bc.chantierCode }} — {{ bc.chantierNom }}</p>
          <p>Adresse: {{ bc.chantierAdresse }}</p>
          <p>Date prévue: {{ bc.dateLivraisonPrevue | date }}</p>
        </div>
      </section>

      <table class="lignes">
        <thead>
          <tr><th>#</th><th>Désignation</th><th>Qté</th><th>Unité</th><th>P.U. HT</th><th>Total HT</th></tr>
        </thead>
        <tbody>
          @for (l of bc.lignes; track l.id) {
            <tr>
              <td>{{ $index + 1 }}</td>
              <td>{{ l.designation }}</td>
              <td>{{ l.quantite }}</td>
              <td>{{ l.unite }}</td>
              <td>{{ l.prixUnitaireHt | mad:2 }}</td>
              <td>{{ l.totalHt | mad:2 }}</td>
            </tr>
          }
        </tbody>
        <tfoot>
          <tr><td colspan="5">Total HT</td><td>{{ bc.totalHt | mad:2 }}</td></tr>
          <tr><td colspan="5">TVA {{ bc.tvaTaux }}%</td><td>{{ bc.totalTva | mad:2 }}</td></tr>
          <tr><td colspan="5"><strong>Total TTC</strong></td><td><strong>{{ bc.totalTtc | mad:2 }}</strong></td></tr>
        </tfoot>
      </table>

      <section class="signatures">
        <div>Signature & Cachet Acheteur</div>
        <div>Signature & Cachet Fournisseur</div>
      </section>

      <footer class="print-footer">
        <p>{{ company().nom }} — {{ company().formeJuridique }} au capital de {{ company().capitalSocial | mad }} — {{ company().rc }}</p>
      </footer>
    </article>
  `,
  styles: [/* CSS @media print spécifique */],
})
export class BcPrintTemplate { /* inputs */ }
```

**CSS @media print** :

```scss
@media print {
  @page { size: A4; margin: 1.5cm; }

  .print-doc { font-family: 'Times New Roman', serif; color: #000; }
  .print-header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 1rem; }
  .logo { max-height: 80px; }
  // Pas de couleurs vibrantes en print, pas d'ombres
}
```

**Templates obligatoires** (par ordre de priorité business) :

1. **Facture client** (priorité 1 — vente)
2. **Facture fournisseur** (priorité 1 — Achats)
3. **BC fournisseur** (priorité 1)
4. **Devis client** (priorité 1)
5. **Situation de travaux**
6. **Contrat marché**
7. **Avenant**
8. **Bon de réception**
9. **Bon de sortie**
10. **DGD (Décompte Général Définitif)**
11. **Fiche de paie**
12. **PPSPS**
13. **Déclaration AT CNSS**
14. **PV de réception** (provisoire / définitive)

**Acceptance criteria** (par template) :
- [ ] En-tête société complet (logo + nom + ICE + IF + RC + capital)
- [ ] Sections clairement délimitées
- [ ] Mentions légales (par ex. facture : « En cas de retard de paiement, intérêt au taux légal applicable »)
- [ ] Signatures et cachets
- [ ] Numérotation conforme société
- [ ] Pied de page : pagination + référence société
- [ ] Test : impression PDF lisible, envoyable au MOA

---

## Task 12.3 — Génération PDF côté serveur (optionnelle MVP, recommandée prod)

**Workflow** :
1. Frontend appelle `/api/print/<docType>/<id>`
2. Backend rend le template HTML avec données et company config
3. Headless browser (Puppeteer/Playwright) génère PDF
4. Backend retourne stream PDF

**Avantages** :
- Fidélité parfaite (no browser quirks)
- Polices custom (logo brandé)
- Watermarks, signatures électroniques

**MVP** : utiliser `window.print()` côté client.

---

## Task 12.4 — Numérotation auto conforme

**Concept** : chaque document doit avoir un numéro unique conforme société.

**Modèle** (cf 08-Task 8.4) :

```ts
export interface NumberingSequence {
  id: string;
  entityType: string;       // 'BC', 'FACTURE', 'SITUATION', etc.
  prefix: string;           // 'BC-'
  yearMode: 'YYYY' | 'YY' | 'NONE';
  monthMode: 'MM' | 'NONE';
  separator: '-' | '/';
  numberPad: number;        // 4, 5, 6 chiffres
  resetAnnually: boolean;
  currentValue: number;
  companyId: string;
}
```

**Service** : `NumberingService.generate(entityType: string): string`

**Acceptance criteria** :
- [ ] Format paramétrable par société dans `/administration/parametres/numerotation`
- [ ] Reset annuel automatique
- [ ] Pas de doublon (mock : utiliser localStorage compteur)

---

## Task 12.5 — Audit log export

**Sur les exports critiques** (factures, BC > seuil, déclarations CNSS), enregistrer dans audit log :
- Qui a exporté
- Quand
- Quelle entité
- Quel format (CSV/XLSX/PDF)

**Acceptance criteria** :
- [ ] Audit entry créé à chaque export d'entité financière
- [ ] Visible dans `/administration/audit-log`

---

## Tests

### E2E

```ts
test('export listing BC en CSV', async ({ page }) => {
  await page.goto('/achats/commandes');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('button', { name: 'Exporter' }).click().then(() => page.locator('text=CSV').click()),
  ]);
  expect(download.suggestedFilename()).toMatch(/bons-commande-\d{4}-\d{2}-\d{2}\.csv/);
});

test('impression PDF facture', async ({ page }) => {
  await page.goto('/marches/factures/FM-2026-00001');
  // Open print preview
  await page.locator('button', { name: 'Imprimer' }).click();
  // Vérifier que la print preview contient bien :
  await expect(page.locator('.print-header')).toContainText(/ICE.*IF.*RC/);
});
```
