package ma.nafura.etudes.api.request;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

/** Mise à jour de l'en-tête. Le contenu du bordereau passe par les endpoints DPGF. */
@Data
public class DossierEtudeUpdateDto {

    @Size(max = 500)
    private String objet;

    @Size(max = 100)
    private String clientId;

    @Size(max = 255)
    private String clientNom;

    /** User IAM (UUID) — rôle BTP_INGENIEUR requis. */
    @Size(max = 100)
    private String chargeEtudeUserId;

    @Size(max = 255)
    private String chargeEtudeNom;

    @Size(max = 100)
    private String cpsDocumentId;

    @Size(max = 100)
    private String bordereauDocumentId;

    private BigDecimal fraisGenerauxPercentDefaut;

    private BigDecimal margePercentDefaut;

    private BigDecimal tvaTauxDefaut;

    /** Sémantique non tranchée — voir Q15. Laisser null tant que ce n'est pas décidé. */
    private BigDecimal margeGlobalePercent;

    private String notes;

    // ── AO (finalize create / enrichissement en-tête) ─────────────────────────

    @Size(max = 100)
    private String aoReference;

    @Size(max = 20)
    private String aoType;

    private LocalDate dateLimiteDepot;

    private LocalDate dateOuverturePlis;

    @Size(max = 255)
    private String ville;

    private Integer delaiExecutionJours;

    private BigDecimal estimationMoaHt;

    private BigDecimal cautionProvisoire;

    private BigDecimal cautionDefinitive;

    private BigDecimal cautionRetenueGarantie;
}
