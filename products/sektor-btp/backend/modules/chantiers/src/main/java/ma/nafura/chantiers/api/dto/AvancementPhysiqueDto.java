package ma.nafura.chantiers.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AvancementPhysiqueDto {

    private String id;
    private String chantierId;
    private String chantierCode;
    private String chantierName;
    private String lotId;
    private String lotCode;
    private String lotDesignation;
    private String posteId;
    private LocalDate date;
    private BigDecimal quantiteRealisee;
    private BigDecimal cumulQuantite;
    private BigDecimal pourcentage;
    private String saisieParId;
    private String saisieParName;
    private String notes;
    private String status;
    private int photosCount;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
