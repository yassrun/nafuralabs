import type { Metre, Ouvrage } from '../models';
import { DpgfService } from './dpgf.service';

describe('DpgfService', () => {
  const service = new DpgfService();

  it('agrège totaux par lot puis total général', () => {
    const ouv: Ouvrage = {
      id: 'ouv-x',
      code: 'X',
      designation: 'Test',
      category: 'AUTRE',
      unite: 'm²',
      prixUnitaireHt: 10,
      uniteMain: { heures: 0, tauxHoraire: 0, total: 0 },
      composants: [],
      fraisGenerauxPercent: 0,
      beneficePercent: 0,
      isActive: true,
      derniereMaj: '2026-01-01',
    };
    const map = new Map<string, Ouvrage>([['ouv-x', ouv]]);
    const metre: Metre = {
      id: 'm1',
      numero: 'MET-1',
      projetNom: 'P',
      dateMetre: '2026-01-01',
      metreurId: 'u1',
      status: 'TERMINE',
      lignes: [
        {
          id: 'l1',
          metreId: 'm1',
          ouvrageId: 'ouv-x',
          unite: 'm²',
          quantiteCalculee: 5,
          lotCode: '01',
          sousLotCode: '01.01',
        },
        {
          id: 'l2',
          metreId: 'm1',
          ouvrageId: 'ouv-x',
          unite: 'm²',
          quantiteCalculee: 3,
          lotCode: '02',
          sousLotCode: '02.01',
        },
      ],
    };
    const draft = service.generateFromMetre(metre, map, 20);
    expect(draft.totalHT).toBe(80);
    expect(draft.hierarchie.length).toBe(2);
    expect(service.sumTotalHT(draft.hierarchie)).toBe(80);
  });

  it('toDevisLignes produit un chapitre et des ouvrages', () => {
    const dpgf = {
      id: 'dpgf-1',
      numero: 'DPGF-2026-001',
      metreId: 'm1',
      projetNom: 'Projet',
      hierarchie: [
        {
          id: 'lot1',
          type: 'LOT' as const,
          code: '01',
          libelle: 'Lot 1',
          enfants: [
            {
              id: 'sl1',
              type: 'SOUS_LOT' as const,
              code: '01.01',
              libelle: 'SL',
              enfants: [
                {
                  id: 'a1',
                  type: 'ARTICLE' as const,
                  code: '01.01.001',
                  libelle: 'Pose',
                  articleId: 'ouv-x',
                  quantite: 2,
                  unite: 'm²',
                  prixUnitaire: 15,
                  total: 30,
                },
              ],
            },
          ],
        },
      ],
      totalHT: 30,
      tvaTaux: 20,
      totalTva: 6,
      totalTTC: 36,
    };
    const lignes = service.toDevisLignes(dpgf, 'dev-new');
    expect(lignes[0].type).toBe('CHAPITRE');
    expect(lignes.filter((l) => l.type === 'OUVRAGE').length).toBe(1);
    expect(lignes[1].totalHt).toBe(30);
  });
});
