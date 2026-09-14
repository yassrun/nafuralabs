package ma.nafura.etudes.service;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import ma.nafura.etudes.api.dto.StatusChangeDto;
import ma.nafura.etudes.domain.audit.TransitionEtude;
import ma.nafura.etudes.repository.TransitionEtudeRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Consigne les transitions de l'étude et du devis dans le journal métier
 * (continuite-etude-devis-chantier AC-6).
 *
 * <p>Store actuel : Postgres ({@code transitions_etude}). Lecture via
 * {@link #listerPourEntite}. Remplacement prévu par Elasticsearch, même DTO.
 *
 * <p>Un même geste atomique (gain, conversion) consigne plusieurs transitions avec le même
 * {@code correlationId} : c'est ce qui relie l'écriture étude et l'écriture devis. L'acteur
 * vient de {@link UserContext}, la date est posée à la persistance. La consignation vit dans
 * la transaction de la mutation : si elle échoue, rien n'est écrit, ni état ni journal.
 */
@Service
public class TransitionEtudeService {

    private final TransitionEtudeRepository repository;
    private final JdbcTemplate jdbc;

    public TransitionEtudeService(TransitionEtudeRepository repository) {
        this(repository, null);
    }

    @Autowired
    public TransitionEtudeService(TransitionEtudeRepository repository, JdbcTemplate jdbc) {
        this.repository = repository;
        this.jdbc = jdbc;
    }

    /**
     * Consigne une transition (étude ou devis) rattachée à un geste atomique.
     *
     * @param entiteType     {@link TransitionEtude#ENTITE_DOSSIER} ou {@link TransitionEtude#ENTITE_DEVIS}
     * @param entiteId       identifiant de l'entité
     * @param ancienStatut   statut avant la transition (jamais null)
     * @param nouveauStatut  statut après la transition (jamais null)
     * @param correlationId  identifiant commun du geste (gain, conversion, …)
     * @param motif          motif éventuel (dérogation AC-4, autre)
     */
    @Transactional
    public void consigner(
            String entiteType,
            String entiteId,
            String ancienStatut,
            String nouveauStatut,
            UUID correlationId,
            String motif) {
        consigner(entiteType, entiteId, ancienStatut, nouveauStatut, correlationId, motif, null);
    }

    @Transactional
    public void consigner(
            String entiteType,
            String entiteId,
            String ancienStatut,
            String nouveauStatut,
            UUID correlationId,
            String motif,
            String action) {
        consignerInterne(
                entiteType, entiteId, ancienStatut, nouveauStatut, correlationId, motif,
                null, null, null, action);
    }

    /**
     * Consigne une transition de gain avec les valeurs discriminantes de la décision (AC-4).
     */
    @Transactional
    public void consignerGain(
            String entiteType,
            String entiteId,
            String ancienStatut,
            String nouveauStatut,
            UUID correlationId,
            String motif,
            BigDecimal montantVenteHt,
            BigDecimal debourseInitialHt,
            BigDecimal margeHt) {
        consignerInterne(
                entiteType, entiteId, ancienStatut, nouveauStatut, correlationId, motif,
                montantVenteHt, debourseInitialHt, margeHt, "GAGNE");
    }

    private void consignerInterne(
            String entiteType,
            String entiteId,
            String ancienStatut,
            String nouveauStatut,
            UUID correlationId,
            String motif,
            BigDecimal montantVenteHt,
            BigDecimal debourseInitialHt,
            BigDecimal margeHt,
            String action) {
        TransitionEtude entree = TransitionEtude.builder()
                .tenantId(TenantContext.getTenantId())
                .entiteType(entiteType)
                .entiteId(entiteId)
                .ancienStatut(ancienStatut)
                .nouveauStatut(nouveauStatut)
                .action(StringUtils.hasText(action) ? action.trim() : null)
                .correlationId(correlationId)
                .motif(StringUtils.hasText(motif) ? motif.trim() : null)
                .montantVenteHt(montantVenteHt)
                .debourseInitialHt(debourseInitialHt)
                .margeHt(margeHt)
                .acteur(acteurCourant())
                .build();
        repository.save(entree);
    }

    /** Historique d'une fiche, plus récent en premier. */
    @Transactional(readOnly = true)
    public List<StatusChangeDto> listerPourEntite(String entiteType, String entiteId) {
        List<TransitionEtude> rows = repository
                .findByTenantIdAndEntiteTypeAndEntiteIdOrderByDateTransitionAsc(
                        TenantContext.getTenantId(), entiteType, entiteId)
                .stream()
                .sorted(Comparator.comparing(TransitionEtude::getDateTransition).reversed())
                .toList();
        Map<String, String> actorLabels = resolveActorLabels(rows);
        return rows.stream().map(row -> toDto(row, actorLabels)).toList();
    }

    private static StatusChangeDto toDto(TransitionEtude row, Map<String, String> actorLabels) {
        return new StatusChangeDto(
                row.getId(),
                row.getAncienStatut(),
                row.getNouveauStatut(),
                row.getAction(),
                labelActeur(row.getActeur(), actorLabels),
                row.getDateTransition(),
                row.getMotif());
    }

    /** E-mail stable ; le nom d'affichage se résout à la lecture. */
    private String acteurCourant() {
        String email = UserContext.getUserEmail();
        if (StringUtils.hasText(email) && email.contains("@")) {
            return email.trim();
        }
        UUID userId = UserContext.getUserIdOrNull();
        return userId != null ? userId.toString() : "system";
    }

    private static String labelActeur(String raw, Map<String, String> labels) {
        if (!StringUtils.hasText(raw) || "system".equalsIgnoreCase(raw)) {
            return "Système";
        }
        String key = raw.trim().toLowerCase(Locale.ROOT);
        String hit = labels.get(key);
        return hit != null ? hit : raw.trim();
    }

    private Map<String, String> resolveActorLabels(List<TransitionEtude> rows) {
        Map<String, String> labels = new HashMap<>();
        for (TransitionEtude row : rows) {
            String raw = row.getActeur();
            if (!StringUtils.hasText(raw) || "system".equalsIgnoreCase(raw)) {
                continue;
            }
            String key = raw.trim().toLowerCase(Locale.ROOT);
            if (labels.containsKey(key)) {
                continue;
            }
            String name = lookupUserLabel(raw.trim());
            if (StringUtils.hasText(name)) {
                labels.put(key, name);
            }
        }
        return labels;
    }

    /** Même requête que {@code ChargeEtudeService} : nom, sinon e-mail. */
    private String lookupUserLabel(String raw) {
        if (jdbc == null || !StringUtils.hasText(raw)) {
            return raw;
        }
        UUID id = parseUuid(raw);
        List<String> found =
                id != null
                        ? jdbc.query(
                                "SELECT COALESCE(NULLIF(TRIM(name), ''), email) FROM app_user WHERE id = ?",
                                (rs, n) -> rs.getString(1),
                                id)
                        : jdbc.query(
                                "SELECT COALESCE(NULLIF(TRIM(name), ''), email) FROM app_user WHERE lower(email) = lower(?)",
                                (rs, n) -> rs.getString(1),
                                raw.trim());
        return found.stream().filter(StringUtils::hasText).findFirst().orElse(raw);
    }

    private static UUID parseUuid(String raw) {
        try {
            return UUID.fromString(raw.trim());
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }
}
