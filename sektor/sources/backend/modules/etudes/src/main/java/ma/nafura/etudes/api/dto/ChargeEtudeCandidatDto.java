package ma.nafura.etudes.api.dto;

/**
 * Candidat au poste de chargé d'étude — user tenant avec rôle {@code BTP_INGENIEUR}.
 */
public record ChargeEtudeCandidatDto(String userId, String email, String displayName) {}
