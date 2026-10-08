package ma.nafura.platform.framework.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * RIB MA : 24 chiffres = banque(3) + agence(5) + compte(14) + clé(2).
 * Clé : {@code (N · 100 + clé) mod 97 = 0} où N est les 22 premiers chiffres.
 */
public class RibValidator implements ConstraintValidator<Rib, String> {

    private boolean strictKey = true;

    @Override
    public void initialize(Rib annotation) {
        strictKey = annotation.strictKey();
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isBlank()) {
            return true;
        }
        String digits = value.replaceAll("\\D", "");
        if (digits.length() != 24) {
            return false;
        }
        if (!strictKey) {
            return true;
        }
        String body = digits.substring(0, 22);
        String key = digits.substring(22, 24);
        return computeKey(body).equals(key);
    }

    /** Clé RIB sur les 22 premiers chiffres (banque + agence + compte). */
    static String computeKey(String twentyTwoDigits) {
        int rem = 0;
        for (char ch : (twentyTwoDigits + "00").toCharArray()) {
            rem = (rem * 10 + (ch - '0')) % 97;
        }
        return String.format("%02d", 97 - rem);
    }
}
