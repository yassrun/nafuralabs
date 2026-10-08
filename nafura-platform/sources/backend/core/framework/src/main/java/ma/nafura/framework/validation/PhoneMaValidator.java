package ma.nafura.platform.framework.validation;

import java.util.regex.Pattern;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * Accepte E.164 {@code +212[567]\d{8}} et formes usuelles (0…, 212…, 00212…).
 */
public class PhoneMaValidator implements ConstraintValidator<PhoneMa, String> {

    private static final Pattern E164 = Pattern.compile("^\\+212[567]\\d{8}$");

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isBlank()) {
            return true;
        }
        return E164.matcher(toE164(value)).matches();
    }

    static String toE164(String raw) {
        String digits = raw.replaceAll("\\D", "");
        if (digits.startsWith("00212")) {
            digits = digits.substring(5);
        } else if (digits.startsWith("212") && digits.length() >= 12) {
            digits = digits.substring(3);
        } else if (digits.startsWith("0")) {
            digits = digits.substring(1);
        }
        return "+212" + digits;
    }
}
