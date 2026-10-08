package ma.nafura.platform.framework.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * Valide un ICE : 15 chiffres exactement (pas d'algorithme de clé publié par la DGI).
 */
public class IceValidator implements ConstraintValidator<Ice, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isBlank()) {
            return true;
        }
        String digits = value.replaceAll("\\D", "");
        return digits.length() == 15;
    }
}
