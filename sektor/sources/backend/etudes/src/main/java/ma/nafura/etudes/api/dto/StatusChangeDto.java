package ma.nafura.etudes.api.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Changement de statut d'une entité. Contrat générique (fiche / workflow).
 *
 * <p>Stockage actuel : Postgres ({@code transitions_etude}). Le store pourra
 * basculer vers Elasticsearch sans changer ce DTO.
 */
public record StatusChangeDto(
        UUID id,
        String fromStatus,
        String toStatus,
        String action,
        String actor,
        OffsetDateTime at,
        String motif) {}
