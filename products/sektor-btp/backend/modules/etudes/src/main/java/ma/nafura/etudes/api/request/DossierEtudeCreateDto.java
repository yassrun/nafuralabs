package ma.nafura.etudes.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Data;

@Data
public class DossierEtudeCreateDto {

    @NotBlank
    @Size(max = 500)
    private String objet;

    /** Optionnel — généré (DE-NNNN) si absent. */
    @Size(max = 50)
    private String numero;

    /** Partner UUID (rôle CLIENT) — optionnel jusqu'à conclusion du marché. */
    @Size(max = 100)
    private String clientId;

    /** Nom MOA libre (CPS / saisie) — requis si pas de clientId Partner. */
    @Size(max = 255)
    private String clientNom;

    /** User IAM (UUID) — rôle BTP_INGENIEUR requis. */
    @NotBlank
    @Size(max = 100)
    private String chargeEtudeUserId;

    @Size(max = 255)
    private String chargeEtudeNom;

    @Size(max = 100)
    private String cpsDocumentId;

    @Size(max = 100)
    private String bordereauDocumentId;

    private UUID appelOffreClientId;

    /** ETUDE (défaut) ou MARCHE_EXISTANT — cf. entrée B du lot 7. */
    @Size(max = 30)
    private String origine;

    private String notes;

    // ── AO unifié (S5) — si dateLimiteDepot présent → crée aussi un AOC lié ──

    /** Référence AO (générée si absente lors de la création AOC). */
    @Size(max = 100)
    private String aoReference;

    /** PUBLIC / PRIVE — défaut PUBLIC. */
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
