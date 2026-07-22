package ma.nafura.etudes.api.response;

import java.util.UUID;

/** Résultat de validation d'un arbre importé (auto). */
public record BordereauValidationResult(
        UUID dpgfId,
        String numero,
        int articlesAcceptes,
        int articlesIgnores) {}
