import {
  estOuvertPourDelai,
  kindDelaiListing,
  labelDelaiListing,
  labelDepotRestantHeader,
  variantDelaiListing,
} from './dossier-listing-delai.util';

const TODAY = new Date(2026, 8, 11);

describe('dossier-listing-delai', () => {
  it('marque en retard une étude ouverte dont le dépôt est passé', () => {
    const item = { status: 'IN_PROGRESS' as const, aoDateLimiteDepot: '2026-09-10' };
    expect(kindDelaiListing(item, TODAY)).toBe('EN_RETARD');
    expect(labelDelaiListing(null, item, TODAY)).toBe('En retard');
    expect(variantDelaiListing(null, item)).toBe('danger');
  });

  it('ne crie pas retard sur un dossier déjà clos', () => {
    expect(kindDelaiListing({ status: 'FINAL_APPROVED', aoDateLimiteDepot: '2026-09-01' }, TODAY)).toBe('CLOS');
    expect(estOuvertPourDelai('REJECTED')).toBe(false);
  });

  it('affiche J-n dans les 7 jours', () => {
    const item = { status: 'ASSIGNED' as const, aoDateLimiteDepot: '2026-09-14' };
    expect(kindDelaiListing(item, TODAY)).toBe('J7');
    expect(labelDelaiListing(null, item, TODAY)).toBe('J-3');
    expect(labelDelaiListing(null, { status: 'ASSIGNED', aoDateLimiteDepot: '2026-09-11' }, TODAY)).toBe(
      "Aujourd'hui",
    );
  });

  it('reste neutre sans date', () => {
    expect(kindDelaiListing({ status: 'DRAFT', aoDateLimiteDepot: null }, TODAY)).toBe('SANS_DATE');
    expect(labelDelaiListing(null, { status: 'DRAFT' }, TODAY)).toBe('—');
  });

  it('compte les jours restants pour l’en-tête', () => {
    expect(labelDepotRestantHeader({ status: 'IN_PROGRESS', aoDateLimiteDepot: '2026-09-25' }, TODAY)).toBe(
      '14 j restants',
    );
    expect(labelDepotRestantHeader({ status: 'IN_PROGRESS', aoDateLimiteDepot: '2026-09-12' }, TODAY)).toBe(
      '1 j restant',
    );
    expect(labelDepotRestantHeader({ status: 'IN_PROGRESS', aoDateLimiteDepot: '2026-09-09' }, TODAY)).toBe(
      '2 j de retard',
    );
    expect(labelDepotRestantHeader({ status: 'FINAL_APPROVED', aoDateLimiteDepot: '2026-09-01' }, TODAY)).toBe(
      'Clos',
    );
  });
});
