import { computeMatchingThreeWay, DEFAULT_MATCHING_TOLERANCE } from './matching-three-way';
import type { BonCommande } from '../models';
import type { FactureFournisseur } from '../../finance/models';
import type { InventoryTx } from '../../inventory/models';

describe('computeMatchingThreeWay', () => {
  const bc: BonCommande = {
    id: 'bc-x',
    numero: 'BC-TEST-001',
    fournisseurId: 'f1',
    dateCreation: '2026-01-01',
    dateLivraisonPrevue: '2026-02-01',
    conditionsPaiement: '30j',
    totalHt: 1000,
    tvaTaux: 20,
    totalTtc: 1200,
    status: 'VALIDE',
    totalLivreHt: 1000,
    totalFactureHt: 0,
    lignes: [
      {
        id: 'l1',
        bcId: 'bc-x',
        articleId: 'art-a',
        quantite: 10,
        quantiteLivree: 10,
        quantiteFacturee: 0,
        prixUnitaireHt: 100,
        totalHt: 1000,
      },
    ],
  };

  const reception: InventoryTx = {
    id: 'rec-1',
    txNumber: 'REC-1',
    txType: 'RECEPTION',
    txDate: '2026-01-10',
    bcId: 'bc-x',
    bcNumero: 'BC-TEST-001',
    status: 'VALIDE',
    lines: [
      {
        id: 'rl1',
        txId: 'rec-1',
        lineNumber: 1,
        articleId: 'art-a',
        quantity: 10,
        uomId: 'u1',
        bcLigneId: 'l1',
        unitPrice: 100,
        totalPrice: 1000,
      },
    ],
  };

  it('ECART_BLOQUE si prix facture hors tolérance ±2%', () => {
    const ff: FactureFournisseur = {
      id: 'ff-1',
      numeroInterne: 'FF-1',
      numeroFournisseur: 'X-1',
      fournisseurId: 'f1',
      bcId: 'bc-x',
      bcNumero: 'BC-TEST-001',
      dateFacture: '2026-01-15',
      dateReception: '2026-01-15',
      dateEcheance: '2026-02-15',
      totalHt: 10 * 150,
      totalTva: 0,
      totalTtc: 10 * 150,
      netAPayerTtc: 10 * 150,
      cumulRegleTtc: 0,
      resteARegler: 10 * 150,
      status: 'BROUILLON',
      lignes: [
        {
          id: 'fl1',
          factureId: 'ff-1',
          ordre: 1,
          designation: 'A',
          bcLigneId: 'l1',
          compteCode: '6111',
          quantite: 10,
          prixUnitaireHt: 150,
          totalHt: 1500,
          tvaTaux: 0,
        },
      ],
    };
    const m = computeMatchingThreeWay(bc, [reception], ff, DEFAULT_MATCHING_TOLERANCE);
    expect(m.status).toBe('ECART_BLOQUE');
    expect(m.matched3Way).toBe(false);
    expect(m.lignes[0].bloquant).toBe(true);
  });

  it('matched3Way vrai si BC, BL et facture alignés dans les tolérances', () => {
    const ff: FactureFournisseur = {
      id: 'ff-2',
      numeroInterne: 'FF-2',
      numeroFournisseur: 'X-2',
      fournisseurId: 'f1',
      bcId: 'bc-x',
      bcNumero: 'BC-TEST-001',
      dateFacture: '2026-01-15',
      dateReception: '2026-01-15',
      dateEcheance: '2026-02-15',
      totalHt: 1000,
      totalTva: 0,
      totalTtc: 1000,
      netAPayerTtc: 1000,
      cumulRegleTtc: 0,
      resteARegler: 1000,
      status: 'BROUILLON',
      lignes: [
        {
          id: 'fl2',
          factureId: 'ff-2',
          ordre: 1,
          designation: 'A',
          bcLigneId: 'l1',
          compteCode: '6111',
          quantite: 10,
          prixUnitaireHt: 100,
          totalHt: 1000,
          tvaTaux: 0,
        },
      ],
    };
    const m = computeMatchingThreeWay(bc, [reception], ff, DEFAULT_MATCHING_TOLERANCE);
    expect(m.status).toBe('FACTURE_COMPLET');
    expect(m.matched3Way).toBe(true);
  });
});
