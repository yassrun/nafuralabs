import { FormControl } from '@angular/forms';

import {
  amoValidator,
  cnssValidator,
  computeRibKey,
  iceValidator,
  ifValidator,
  isValidAmo,
  isValidCnss,
  isValidIce,
  isValidIf,
  isValidPatente,
  isValidPhoneMa,
  isValidRc,
  isValidRib,
  patenteValidator,
  phoneMaValidator,
  rcValidator,
  ribValidator,
  stripNonDigits,
} from './ma-validators';

/**
 * Unit tests — Validateurs MA (M-MA-01).
 *
 * Couvre :
 *  - ICE : 15 chiffres exacts.
 *  - RIB : 24 chiffres + algorithme clé 97.
 *  - IF / CNSS / AMO / Patente / RC : règles de longueur MA.
 *  - Téléphone MA : E.164 `+212[567]XXXXXXXX`.
 */
describe('ma-validators — référentiels légaux MA', () => {
  describe('stripNonDigits', () => {
    it('retire tous les caractères non numériques', () => {
      expect(stripNonDigits('00212 6-12.34.56 78')).toBe('00212612345678');
      expect(stripNonDigits('XXX YYY 12345')).toBe('12345');
      expect(stripNonDigits(null)).toBe('');
      expect(stripNonDigits(undefined)).toBe('');
    });
  });

  describe('ICE', () => {
    it('isValidIce — 15 chiffres exacts → true', () => {
      expect(isValidIce('001234567890123')).toBe(true);
      expect(isValidIce('00123 45678 90123')).toBe(true);
    });

    it('isValidIce — moins ou plus de 15 chiffres → false', () => {
      expect(isValidIce('001234567890')).toBe(false);
      expect(isValidIce('0012345678901234')).toBe(false);
      expect(isValidIce('')).toBe(false);
      expect(isValidIce(null)).toBe(false);
    });

    it('iceValidator — vide → null (champ optionnel)', () => {
      expect(iceValidator()(new FormControl(''))).toBeNull();
      expect(iceValidator()(new FormControl(null))).toBeNull();
    });

    it('iceValidator — ICE invalide → erreur typée', () => {
      const res = iceValidator()(new FormControl('1234'));
      expect(res).not.toBeNull();
      expect(res!['ice']).toBeDefined();
    });

    it('iceValidator — ICE valide → null', () => {
      expect(iceValidator()(new FormControl('001234567890123'))).toBeNull();
    });
  });

  describe('RIB — clé 97', () => {
    it('computeRibKey — exemple connu : banque 011 / agence 81000 / compte 50000000000050', () => {
      // Calcul attendu : on valide la bijectivité.
      const key = computeRibKey('011', '81000', '50000000000050');
      expect(key.length).toBe(2);
      // Reconstruction → mod 97 = 0
      const concat24 = '011' + '81000' + '50000000000050' + key;
      let rem = 0;
      for (const ch of concat24) rem = (rem * 10 + Number(ch)) % 97;
      expect(rem).toBe(0);
    });

    it('isValidRib — strictKey: true rejette mauvaise clé', () => {
      const banque = '011';
      const agence = '81000';
      const compte = '50000000000050';
      const goodKey = computeRibKey(banque, agence, compte);
      const badKey = (Number(goodKey) === 97 ? 0 : Number(goodKey) + 1).toString().padStart(2, '0');
      expect(isValidRib(banque + agence + compte + goodKey, true)).toBe(true);
      expect(isValidRib(banque + agence + compte + badKey, true)).toBe(false);
    });

    it('isValidRib — strictKey: false n\'exige que la longueur 24', () => {
      expect(isValidRib('011' + '81000' + '50000000000050' + '99', false)).toBe(true);
      expect(isValidRib('123', false)).toBe(false);
    });

    it('ribValidator par défaut tolérant (24 chiffres suffit)', () => {
      const v = ribValidator();
      expect(v(new FormControl(''))).toBeNull();
      expect(v(new FormControl('123'))).not.toBeNull();
      expect(v(new FormControl('011 81000 50000000000050 99'))).toBeNull();
    });

    it('ribValidator strictKey signale clé incorrecte', () => {
      const v = ribValidator({ strictKey: true });
      const wrong = '011' + '81000' + '50000000000050' + '00';
      const goodKey = computeRibKey('011', '81000', '50000000000050');
      const good = '011' + '81000' + '50000000000050' + goodKey;
      expect(v(new FormControl(wrong))!['rib']).toBeDefined();
      expect(v(new FormControl(good))).toBeNull();
    });
  });

  describe('IF', () => {
    it('isValidIf — 7 ou 8 chiffres → true', () => {
      expect(isValidIf('1234567')).toBe(true);
      expect(isValidIf('12345678')).toBe(true);
    });

    it('isValidIf — autres longueurs → false', () => {
      expect(isValidIf('123456')).toBe(false);
      expect(isValidIf('123456789')).toBe(false);
      expect(isValidIf('')).toBe(false);
    });

    it('ifValidator', () => {
      expect(ifValidator()(new FormControl(''))).toBeNull();
      expect(ifValidator()(new FormControl('1234567'))).toBeNull();
      expect(ifValidator()(new FormControl('12'))!['if']).toBeDefined();
    });
  });

  describe('CNSS / AMO / Patente / RC', () => {
    it('CNSS — 7 à 9 chiffres', () => {
      expect(isValidCnss('1234567')).toBe(true);
      expect(isValidCnss('123456789')).toBe(true);
      expect(isValidCnss('123456')).toBe(false);
      expect(cnssValidator()(new FormControl('12'))!['cnss']).toBeDefined();
    });

    it('AMO — 7 à 9 chiffres', () => {
      expect(isValidAmo('1234567')).toBe(true);
      expect(isValidAmo('123456789')).toBe(true);
      expect(isValidAmo('123')).toBe(false);
      expect(amoValidator()(new FormControl('12'))!['amo']).toBeDefined();
    });

    it('Patente — 7 à 10 chiffres', () => {
      expect(isValidPatente('1234567')).toBe(true);
      expect(isValidPatente('1234567890')).toBe(true);
      expect(isValidPatente('12345678901')).toBe(false);
      expect(patenteValidator()(new FormControl('12'))!['patente']).toBeDefined();
    });

    it('RC — 4 à 8 chiffres', () => {
      expect(isValidRc('1234')).toBe(true);
      expect(isValidRc('12345678')).toBe(true);
      expect(isValidRc('123')).toBe(false);
      expect(rcValidator()(new FormControl('12'))!['rc']).toBeDefined();
    });
  });

  describe('Téléphone MA', () => {
    it('accepte différents formats équivalents', () => {
      expect(isValidPhoneMa('+212612345678')).toBe(true);
      expect(isValidPhoneMa('00212612345678')).toBe(true);
      expect(isValidPhoneMa('0612345678')).toBe(true);
      expect(isValidPhoneMa('+212 7 12 34 56 78')).toBe(true);
      expect(isValidPhoneMa('+212 5 22 33 44 55')).toBe(true);
    });

    it('rejette les numéros invalides', () => {
      expect(isValidPhoneMa('')).toBe(false);
      expect(isValidPhoneMa('612345')).toBe(false);
      expect(isValidPhoneMa('+33612345678')).toBe(false);
      expect(isValidPhoneMa('+2120912345678')).toBe(false); // commence par 0
      expect(phoneMaValidator()(new FormControl('123'))!['phoneMa']).toBeDefined();
      expect(phoneMaValidator()(new FormControl('+212612345678'))).toBeNull();
    });
  });
});
