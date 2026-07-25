import {
  backendGateEtapesForUi,
  backendToUiEtape,
  libelleUiEtape,
  nextBackendEtape,
  prevBackendEtape,
  uiEtapePourGate,
  uiToBackendEtape,
} from './dossier-etape.util';

describe('dossier-etape.util', () => {
  it('projette les étapes backend 1–5 vers les 4 étapes UI', () => {
    expect(backendToUiEtape(1)).toBe(1);
    expect(backendToUiEtape(2)).toBe(2);
    expect(backendToUiEtape(3)).toBe(3);
    expect(backendToUiEtape(4)).toBe(3);
    expect(backendToUiEtape(5)).toBe(4);
  });

  it('mappe les transitions Suivant / Précédent', () => {
    expect(nextBackendEtape(1)).toBe(2);
    expect(nextBackendEtape(2)).toBe(3);
    expect(nextBackendEtape(3)).toBe(5);
    expect(nextBackendEtape(4)).toBeNull();

    expect(prevBackendEtape(2)).toBe(1);
    expect(prevBackendEtape(3)).toBe(2);
    expect(prevBackendEtape(4)).toBe(3);
    expect(prevBackendEtape(1)).toBeNull();
  });

  it('regroupe décomposition + consultation + chiffrage sur l’étape UI 3', () => {
    expect(backendGateEtapesForUi(3)).toEqual([3, 4, 5]);
    expect(backendGateEtapesForUi(4)).toEqual([5]);
  });

  it('route la correction vers la bonne étape UI', () => {
    expect(uiEtapePourGate(1)).toBe(1);
    expect(uiEtapePourGate(2)).toBe(2);
    expect(uiEtapePourGate(3)).toBe(3);
    expect(uiEtapePourGate(4)).toBe(3);
    expect(uiEtapePourGate(5)).toBe(3);
  });

  it('expose un libellé métier pour le listing', () => {
    expect(libelleUiEtape(4)).toContain('Décomposition');
    expect(libelleUiEtape(5)).toContain('Synthèse');
    expect(uiToBackendEtape(4)).toBe(5);
  });
});
