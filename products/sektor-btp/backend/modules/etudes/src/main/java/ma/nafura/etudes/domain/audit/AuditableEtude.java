package ma.nafura.etudes.domain.audit;

/**
 * Marqueur pour l'écouteur d'audit lot 1 (pas d'AuditingEntityListener dans platform/).
 */
public interface AuditableEtude {

    String getCreatedBy();

    void setCreatedBy(String createdBy);

    String getUpdatedBy();

    void setUpdatedBy(String updatedBy);
}
