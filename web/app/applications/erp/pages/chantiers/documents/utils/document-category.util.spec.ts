import type { DocumentChantier } from '../models';
import {
  categoryForType,
  countByCategory,
  typesForCategory,
} from './document-category.util';

describe('document category utilities', () => {
  it('maps every business document type to its smart category', () => {
    expect(categoryForType('MARCHE')).toBe('CONTRACTS');
    expect(categoryForType('PLAN')).toBe('PLANS_STUDIES');
    expect(categoryForType('PV_RECEPTION')).toBe('EXECUTION');
    expect(categoryForType('FACTURE')).toBe('PURCHASES_FINANCE');
    expect(categoryForType('PPSPS')).toBe('HSE_ADMIN');
    expect(categoryForType('AUTRE')).toBe('OTHER');
  });

  it('returns all server types represented by a selected category', () => {
    expect(typesForCategory('CONTRACTS')).toEqual(['MARCHE', 'AVENANT', 'CAUTION_BANCAIRE']);
    expect(typesForCategory('')).toEqual([]);
  });

  it('counts documents by virtual folder without changing the document model', () => {
    const base: Omit<DocumentChantier, 'id' | 'type'> = {
      chantierId: 'ch-1',
      chantierCode: 'CH-001',
      titre: 'Document',
      fichier: 'document.pdf',
      taille: 100,
      uploadedAt: '2026-07-18',
      uploadedPar: 'User',
    };
    const documents: DocumentChantier[] = [
      { ...base, id: '1', type: 'MARCHE' },
      { ...base, id: '2', type: 'PLAN' },
      { ...base, id: '3', type: 'NOTE_CALCUL' },
    ];

    expect(countByCategory(documents)).toEqual({
      CONTRACTS: 1,
      PLANS_STUDIES: 2,
      EXECUTION: 0,
      PURCHASES_FINANCE: 0,
      HSE_ADMIN: 0,
      OTHER: 0,
    });
  });
});
