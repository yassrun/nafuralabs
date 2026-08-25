package ma.nafura.chantiers.api.request;

import java.time.LocalDate;
import lombok.Data;

@Data
public class ActiviteChantierUpdateDto {

    private String libelle;

    private LocalDate dateDebut;

    private LocalDate dateFin;

    private String parentActiviteId;

    private String zoneId;

    private Integer ordre;

    private String status;

    /** % saisi uniquement pour activité sans rattachement (AC-9). */
    private java.math.BigDecimal avancementPercent;
}
