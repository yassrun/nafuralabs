package ma.nafura.etudes.api.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

/** Candidat au versement bibliothèque (article DECOMPOSE). */
@Data
@Builder
public class CapitalisationArticleDto {
    private UUID noeudId;
    private UUID prixDpuId;
    private String codePropose;
    private String designation;
    private String unite;
    private String codeLot;
    private String codeFamille;
    private BigDecimal deboursSec;
    private int nbComposants;
    /** NOUVEAU | COLLISION | DEJA_VERSE */
    private String statut;
    private UUID ouvrageExistantId;
    private String ouvrageExistantCode;
    private List<CapitalisationRendementLigneDto> comparaisonRendements;
}
