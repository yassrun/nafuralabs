import { humanizeCleStable, toPanierLigne } from './consultation-panier-ligne';

describe('toPanierLigne', () => {
  it('préfère le nom catalogue à la clé technique', () => {
    expect(
      toPanierLigne('plaques-de-platre-ba13', {
        code: 'BA13',
        name: 'Plaques de plâtre BA13',
      }),
    ).toEqual({
      cleStable: 'plaques-de-platre-ba13',
      code: 'BA13',
      libelle: 'Plaques de plâtre BA13',
    });
  });

  it('n’affiche pas deux fois le slug', () => {
    const row = toPanierLigne('echafaudages-et-moyens-d-acces', {
      code: 'echafaudages-et-moyens-d-acces',
      name: 'echafaudages-et-moyens-d-acces',
    });
    expect(row.code).toBe('echafaudages-et-moyens-d-acces');
    expect(row.libelle).toBe(humanizeCleStable('echafaudages-et-moyens-d-acces'));
    expect(row.libelle).not.toBe(row.code);
  });
});
