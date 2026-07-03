import { TestBed } from '@angular/core/testing';

import type { AppelOffre, Fournisseur } from '../models';

import { ScoringAOService } from './scoring-ao.service';

describe('ScoringAOService', () => {
  let service: ScoringAOService;

  const fournisseurs: Fournisseur[] = [
    { id: 'fa', code: 'F-A', raisonSociale: 'A', pays: 'MA', conditionsPaiementParDefaut: '30j', notation: 5, categories: [], isActive: true, createdAt: '2026-01-01' },
    { id: 'fb', code: 'F-B', raisonSociale: 'B', pays: 'MA', conditionsPaiementParDefaut: '30j', notation: 3, categories: [], isActive: true, createdAt: '2026-01-01' },
  ];

  const ao: AppelOffre = {
    id: 'ao1',
    numero: 'AO-1',
    objet: 'Test',
    fournisseurInvitesIds: ['fa', 'fb'],
    dateLimiteDepot: '2026-02-01',
    status: 'PUBLIEE',
    chantierId: 'ch-1',
    lignes: [
      { id: 'aol1', aoId: 'ao1', articleId: 'x', quantite: 10, uomCode: 'u' },
    ],
    reponses: [
      {
        id: 'r1',
        aoId: 'ao1',
        fournisseurId: 'fa',
        dateReponse: '2026-01-02',
        totalHt: 100_000,
        delaiLivraisonJours: 5,
        retenue: true,
        lignes: [{ id: 'rl1', reponseId: 'r1', aoLigneId: 'aol1', prixUnitaireHt: 10_000, totalHt: 100_000 }],
      },
      {
        id: 'r2',
        aoId: 'ao1',
        fournisseurId: 'fb',
        dateReponse: '2026-01-02',
        totalHt: 120_000,
        delaiLivraisonJours: 50,
        retenue: false,
        lignes: [{ id: 'rl2', reponseId: 'r2', aoLigneId: 'aol1', prixUnitaireHt: 12_000, totalHt: 120_000 }],
      },
    ],
    createdAt: '2026-01-01',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScoringAOService);
  });

  it('attribue le score prix maximal au moins-disant (total HT minimal)', () => {
    const rows = service.computeScores(ao, fournisseurs);
    const a = rows.find((x) => x.fournisseurId === 'fa');
    const b = rows.find((x) => x.fournisseurId === 'fb');
    expect(a && b).toBeTruthy();
    expect((a!.scoreDetail.prix ?? 0) >= (b!.scoreDetail.prix ?? 0)).toBe(true);
  });

  it('marque TOP le meilleur fournisseur non exclu', () => {
    const rows = service.computeScores(ao, fournisseurs);
    const tops = rows.filter((x) => x.recommandation === 'TOP');
    expect(tops.length).toBe(1);
    expect(tops[0].fournisseurId).toBe('fa');
  });
});
