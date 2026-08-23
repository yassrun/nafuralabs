import { DpgfService } from './dpgf.service';

describe('DpgfService', () => {
  const service = new DpgfService();

  it('toDevisLignes produit un chapitre et des ouvrages', () => {
    const dpgf = {
      id: 'dpgf-1',
      numero: 'DPGF-2026-001',
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

  it('sumTotalHT agrège les totaux article', () => {
    const hierarchie = [
      {
        id: 'lot1',
        type: 'LOT' as const,
        code: '01',
        libelle: 'Lot 1',
        enfants: [
          {
            id: 'a1',
            type: 'ARTICLE' as const,
            code: '01.01.001',
            libelle: 'Pose',
            total: 50,
          },
        ],
      },
    ];
    expect(service.sumTotalHT(hierarchie)).toBe(50);
  });
});
