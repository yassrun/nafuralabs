import {
  estOuvertPourDelai,
  kindDelaiListing,
  labelDelaiListing,
  variantDelaiListing,
} from './dossier-listing-delai.util';

const TODAY = new Date(2026, 8, 11);

describe('dossier-listing-delai', () => {
  it('marque en retard une étude ouverte dont le dépôt est passé', () => {
    const item = { status: 'EN_ETUDE', aoDateLimiteDepot: '2026-09-10' };
    expect(kindDelaiListing(item, TODAY)).toBe('EN_RETARD');
    expect(labelDelaiListing(null, item, TODAY)).toBe('En retard');
    expect(variantDelaiListing(null, item)).toBe('danger');
  });

  it('ne crie pas retard sur un dossier déjà clos', () => {
    expect(kindDelaiListing({ status: 'GAGNE', aoDateLimiteDepot: '2026-09-01' }, TODAY)).toBe('CLOS');
    expect(estOuvertPourDelai('NE_PAS_ETUDIER')).toBe(false);
  });

  it('affiche J-n dans les 7 jours', () => {
    const item = { status: 'AFFECTE', aoDateLimiteDepot: '2026-09-14' };
    expect(kindDelaiListing(item, TODAY)).toBe('J7');
    expect(labelDelaiListing(null, item, TODAY)).toBe('J-3');
    expect(labelDelaiListing(null, { status: 'AFFECTE', aoDateLimiteDepot: '2026-09-11' }, TODAY)).toBe(
      "Aujourd'hui",
    );
  });

  it('reste neutre sans date', () => {
    expect(kindDelaiListing({ status: 'BROUILLON', aoDateLimiteDepot: null }, TODAY)).toBe('SANS_DATE');
    expect(labelDelaiListing(null, { status: 'BROUILLON' }, TODAY)).toBe('—');
  });
});
