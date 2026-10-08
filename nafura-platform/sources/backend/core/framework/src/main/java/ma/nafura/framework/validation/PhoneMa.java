package ma.nafura.platform.framework.validation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

/**
 * Téléphone marocain stocké en E.164 ({@code +212} + 9 chiffres commençant par 5, 6 ou 7).
 * Chaîne vide ou {@code null} : valide (combiner avec {@code @NotBlank} si obligatoire).
 */
@Documented
@Constraint(validatedBy = PhoneMaValidator.class)
@Target({ ElementType.FIELD, ElementType.METHOD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT })
@Retention(RetentionPolicy.RUNTIME)
public @interface PhoneMa {

    String message() default "Numéro marocain invalide — format +212 5/6/7 XXXXXXXX";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
