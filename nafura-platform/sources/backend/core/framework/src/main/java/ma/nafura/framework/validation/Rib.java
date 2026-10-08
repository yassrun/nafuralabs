package ma.nafura.platform.framework.validation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

/**
 * RIB marocain : 24 chiffres, clé contrôlée (mod 97) sauf si {@link #strictKey()} est faux.
 * Chaîne vide ou {@code null} : valide (combiner avec {@code @NotBlank} si obligatoire).
 */
@Documented
@Constraint(validatedBy = RibValidator.class)
@Target({ ElementType.FIELD, ElementType.METHOD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT })
@Retention(RetentionPolicy.RUNTIME)
public @interface Rib {

    String message() default "RIB invalide — 24 chiffres et clé";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

    /** When true (default), the last two digits must match the mod-97 key. */
    boolean strictKey() default true;
}
