import { TestBed } from '@angular/core/testing';

import { BanqueAdapterRegistry } from './banque.registry';
import { AwbAdapter } from './awb.adapter';
import { BmceAdapter } from './bmce.adapter';
import { CihAdapter } from './cih.adapter';
import { BpAdapter } from './bp.adapter';

describe('BanqueAdapterRegistry', () => {
  let registry: BanqueAdapterRegistry;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    registry = TestBed.inject(BanqueAdapterRegistry);
  });

  it('expose 4 adaptateurs MA (AWB, BMCE, CIH, BP)', () => {
    const codes = registry.all().map((a) => a.code).sort();
    expect(codes).toEqual(['AWB', 'BMCE', 'BP', 'CIH']);
  });

  it('résout un adaptateur par code (insensible à la casse)', () => {
    expect(registry.resolve('AWB')).toBeInstanceOf(AwbAdapter);
    expect(registry.resolve('bmce')).toBeInstanceOf(BmceAdapter);
    expect(registry.resolve('cih')).toBeInstanceOf(CihAdapter);
    expect(registry.resolve('Bp')).toBeInstanceOf(BpAdapter);
  });

  it('renvoie null pour code inconnu', () => {
    expect(registry.resolve('XYZ')).toBeNull();
  });

  it('envoyer un virement batch (mock) génère un XML traçable et accusé', async () => {
    const awb = registry.resolve('AWB');
    expect(awb).not.toBeNull();
    const res = await awb!.envoyerVirementBatch(
      [
        { id: 'v1', beneficiaire: 'Cimar', rib: 'MA640070101001000123456789', montant: 12500, motif: 'Facture FF-001' },
        { id: 'v2', beneficiaire: 'Sika', rib: 'MA640070101001000987654321', montant: 8400, motif: 'Facture FF-002' },
      ],
      '2026-05-15',
    );
    expect(res.status).toBe('SUCCES');
    expect(res.accuse).toMatch(/^AWB-VIR-/);
    expect(res.data?.nbVirements).toBe(2);
    expect(res.data?.montantTotal).toBe(20900);
    expect(res.data?.xml).toContain('banque="AWB"');
    expect(res.data?.xml).toContain('Cimar');
  });

  it('mode PROD renvoie EN_ATTENTE pour relevé bancaire', async () => {
    const cih = registry.resolve('CIH');
    cih!.setMode('PROD');
    const res = await cih!.recupererReleveBancaire('001-COMPTE', '2026-05-01', '2026-05-31');
    expect(res.status).toBe('EN_ATTENTE');
  });

  it('relevé bancaire mock contient ≥ 1 écriture avec bankRef typée', async () => {
    const bmce = registry.resolve('BMCE');
    bmce!.setMode('MOCK');
    const res = await bmce!.recupererReleveBancaire('011-COMPTE-DEMO', '2026-05-01', '2026-05-31');
    expect(res.status).toBe('SUCCES');
    expect(res.data?.length ?? 0).toBeGreaterThan(0);
    expect(res.data?.[0].bankRef).toContain('BMCE');
  });

  it('soldes mock retourne autant d entrées que demandé', async () => {
    const bp = registry.resolve('BP');
    const res = await bp!.recupererSoldes(['C1', 'C2', 'C3']);
    expect(res.status).toBe('SUCCES');
    expect(res.data?.length).toBe(3);
    expect(res.data?.[0].devise).toBe('MAD');
  });
});
