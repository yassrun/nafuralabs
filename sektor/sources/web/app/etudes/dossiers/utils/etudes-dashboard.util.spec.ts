import type { DossierEtude } from '@app/etudes/models';

import { buildEtudesDashboard, motifAttention } from './etudes-dashboard.util';

const TODAY = new Date(2026, 8, 11);
const ME = 'user-ing';

function dossier(partial: Partial<DossierEtude>): DossierEtude {
  return {
    id: partial.id ?? 'id',
    numero: partial.numero ?? 'ET-0001',
    objet: partial.objet ?? 'Étude',
    currentStep: 1,
    status: partial.status ?? 'EN_ETUDE',
    version: partial.version ?? 1,
    ...partial,
  };
}

describe('etudes-dashboard', () => {
  it('classe en retard avant J-7 et avant la file d’attente', () => {
    const rows = [
      dossier({
        id: 'att',
        numero: 'ET-3',
        status: 'A_DECIDER',
        aoDateLimiteDepot: '2026-10-01',
      }),
      dossier({
        id: 'j7',
        numero: 'ET-2',
        status: 'AFFECTE',
        aoDateLimiteDepot: '2026-09-14',
      }),
      dossier({
        id: 'late',
        numero: 'ET-1',
        status: 'EN_ETUDE',
        aoDateLimiteDepot: '2026-09-01',
      }),
    ];

    const vm = buildEtudesDashboard(rows, ME, TODAY);
    expect(vm.attention.map((a) => a.numero)).toEqual(['ET-1', 'ET-2', 'ET-3']);
    expect(vm.kpis.find((k) => k.id === 'en-retard')?.count).toBe(1);
    expect(vm.kpis.find((k) => k.id === 'j7')?.count).toBe(1);
    expect(vm.kpis.find((k) => k.id === 'en-attente')?.count).toBe(2);
  });

  it('compte mes études sur le chargé connecté', () => {
    const rows = [
      dossier({ id: 'a', chargeEtudeUserId: ME, status: 'EN_ETUDE' }),
      dossier({ id: 'b', chargeEtudeUserId: 'autre', status: 'EN_ETUDE' }),
    ];
    const vm = buildEtudesDashboard(rows, ME, TODAY);
    expect(vm.kpis.find((k) => k.id === 'mes-etudes')?.count).toBe(1);
  });

  it('compte mes études quand un lot est délégué', () => {
    const rows = [
      dossier({
        id: 'lot',
        chargeEtudeUserId: 'autre',
        lotChargeUserIds: [ME],
        status: 'EN_ETUDE',
      }),
      dossier({ id: 'autre', chargeEtudeUserId: 'autre', status: 'EN_ETUDE' }),
    ];
    const vm = buildEtudesDashboard(rows, ME, TODAY);
    expect(vm.kpis.find((k) => k.id === 'mes-etudes')?.count).toBe(1);
  });

  it('ne met pas un chiffrage en cours dans la file d’attente', () => {
    expect(motifAttention({ status: 'EN_ETUDE', aoDateLimiteDepot: '2026-10-01' }, TODAY)).toBeNull();
    expect(motifAttention({ status: 'AFFECTE', aoDateLimiteDepot: '2026-10-01' }, TODAY)).toBe(
      'ATTENTE',
    );
  });
});
