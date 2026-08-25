/**
 * SEKTOR-187 — chaîne locale Arbre → Avancement → Attachements → Situations.
 *
 * Cette preuve statique protège la propagation de chantierId, son affichage dans
 * les vues aval et la possibilité de retirer le filtre sans perdre les autres
 * query params.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const expectSource = (label, source, fragments) => {
  for (const fragment of fragments) {
    if (!source.includes(fragment)) {
      throw new Error(`${label}: fragment absent: ${fragment}`);
    }
  }
};

const detail = read('sektor/sources/web/app/chantiers/chantier-detail/chantier-detail.page.ts');
const attachements = read('sektor/sources/web/app/chantiers/attachements/attachement-listing/attachement-listing.page.ts');
const saisie = read('sektor/sources/web/app/chantiers/attachements/attachement-saisie/attachement-saisie.page.ts');
const journal = read('sektor/sources/web/app/chantiers/journal/journal-chantier.page.ts');
const situations = read('sektor/sources/web/app/chantiers/situations/situation-listing/situation-listing.page.ts');

expectSource('fiche chantier', detail, [
  "navigate(['/chantiers/avancements/saisie', c.id])",
  "navigate(['/chantiers/attachements'], { queryParams: { chantierId: c.id } })",
  "navigate(['/chantiers/journal'], { queryParams: { chantierId: c.id } })",
  "[queryParams]=\"{ chantierId: c.id }\"",
]);

expectSource('liste attachements', attachements, [
  "queryParamMap.get('chantierId')",
  'if (chantierId) list = list.filter',
  'clearChantierFilter(): void',
  'queryParams: { chantierId: null }',
  "navigate(['/chantiers/attachements/saisie']",
]);

expectSource('saisie attachement', saisie, [
  "queryParamMap.get('chantierId')",
  'this.chantierId.set(requestedChantierId)',
  'return chantierId ? { chantierId } : undefined',
]);

expectSource('journal chantier', journal, [
  "queryParamMap.get('chantierId')",
  'if (chantierId) list = list.filter',
  'clearChantierFilter(): void',
  'queryParams: { chantierId: null }',
  "this.filteredChantierId() || (this.chantiers()[0]?.id ?? '')",
]);

expectSource('situations', situations, [
  "queryParamMap.get('chantierId')",
  'this.selectedChantier.set(chantierId)',
  'this.listingComponent?.onFilterChange(filters)',
  'queryParams: { chantierId: chantierId || null }',
  "queryParamsHandling: 'merge'",
]);

if (situations.includes('private readonly route =')) {
  throw new Error('situations: ActivatedRoute masque encore le membre protégé de ConfigDrivenListingPage');
}

console.log('PASS  SEKTOR-187: contexte chantier continu et filtres aval réversibles');
