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
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private int ordre;
    private BigDecimal avancementPercent;
    private String status;
    private List<ActiviteRattachementDto> rattachements;
}
