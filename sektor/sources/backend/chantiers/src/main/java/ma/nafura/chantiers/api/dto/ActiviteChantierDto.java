package ma.nafura.chantiers.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ActiviteChantierDto {

    private String id;
    private String chantierId;
    private String parentActiviteId;
    private String zoneId;
    private String libelle;

    private ma.nafura.chantiers.domain.calendrier.CalendrierActivite calendrierSpecifique;
    private String code;
    private String forme;
    private String natureCode;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    /** Null = à qualifier. Jalon = 0. Phase = null (durée agrégée non stockée). */
    private Integer dureeMinutesOuvrees;
    private int ordre;
    private java.util.List<ma.nafura.chantiers.domain.activite.PlanningAllocation> planningAllocations;
    private BigDecimal avancementPercent;
    private String status;
    private List<ActiviteRattachementDto> rattachements;
}
