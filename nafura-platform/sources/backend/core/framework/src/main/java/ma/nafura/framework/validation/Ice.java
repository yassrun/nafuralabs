package ma.nafura.platform.framework.validation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

/**
 * ICE marocain (Identifiant Commun de l'Entreprise) : exactement 15 chiffres.
 * Chaîne vide ou {@code null} : valide (combiner avec {@code @NotBlank} si obligatoire).
 */
@Documented
@Constraint(validatedBy = IceValidator.class)
@Target({ ElementType.FIELD, ElementType.METHOD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT })
@Retention(RetentionPolicy.RUNTIME)
public @interface Ice {

    String message() default "ICE invalide — 15 chiffres requis";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
