package ma.nafura.etudes.api.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Value;
import ma.nafura.etudes.domain.model.StatutDossierEtude;
import ma.nafura.etudes.service.gate.ResultatGate;

/**
 * Vue compacte pour l'entête du dossier d'étude — une seule lecture agrégée.
 */
@Value
@Builder
public class DossierEtudeSyntheseDto {

    UUID id;
    String numero;
    String objet;
    String clientId;
    String clientNom;
    UUID appelOffreClientId;
    StatutDossierEtude status;
    int currentStep;
    /** Phase métier : BORDEREAU | CHIFFRAGE | VALIDATION_N1 | VALIDATION_N2 | VALIDEE | DEVIS | TERMINE */
    String phase;
    String validationEtape;
    int bordereauRevision;
    boolean structureVerrouillee;
    boolean modifiable;
    int nombreArticles;
    int anomaliesBloquantes;
    BigDecimal totalHt;
    UUID devisGenereId;
    String devisNumero;
    String approvalRequestId;
    String prochainApprobateurRole;
    String prochainApprobateurNom;
    String motifRefus;
    String createdBy;
    String updatedBy;
    OffsetDateTime updatedAt;
    List<ResultatGate> gates;
    /** CTA principal conseillé pour l'UI. */
    String actionPrincipale;
}
