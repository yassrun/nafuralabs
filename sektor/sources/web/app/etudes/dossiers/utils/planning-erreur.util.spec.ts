import { messagePlanningErreur } from './planning-erreur.util';

describe('messagePlanningErreur', () => {
  it('traduit un code métier', () => {
    expect(messagePlanningErreur({ error: { code: 'etudes.planning.dates_invalides' } })).toBe(
      'La date de fin doit être après la date de début.',
    );
  });

  it('garde un message API déjà lisible', () => {
    expect(messagePlanningErreur({ error: { message: 'Réseau indisponible' } })).toBe(
      'Réseau indisponible',
    );
  });

  it('fournit un fallback', () => {
    expect(messagePlanningErreur({})).toBe('Enregistrement impossible.');
  });
});
