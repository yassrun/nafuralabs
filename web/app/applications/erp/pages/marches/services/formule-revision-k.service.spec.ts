import { FormuleRevisionKService } from './formule-revision-k.service';
import type { FormuleRevisionK } from '../models';

describe('FormuleRevisionKService', () => {
  let svc: FormuleRevisionKService;

  beforeEach(() => {
    svc = new FormuleRevisionKService();
  });

  it('calcule K avec un seul terme variable', () => {
    const formule: FormuleRevisionK = {
      termeFixe: 0.15,
      termesVariables: [{ coefficient: 0.85, indiceCode: 'BTP01', indiceBaseValeur: 1000 }],
    };
    const indices = new Map<string, number>([['BTP01', 1020]]);
    expect(svc.calculerK(formule, indices)).toBeCloseTo(0.15 + 0.85 * (1020 / 1000), 4);
  });

  it('retourne NaN si indice manquant', () => {
    const formule: FormuleRevisionK = {
      termeFixe: 1,
      termesVariables: [{ coefficient: 1, indiceCode: 'X', indiceBaseValeur: 1 }],
    };
    expect(Number.isNaN(svc.calculerK(formule, new Map()))).toBe(true);
  });
});
