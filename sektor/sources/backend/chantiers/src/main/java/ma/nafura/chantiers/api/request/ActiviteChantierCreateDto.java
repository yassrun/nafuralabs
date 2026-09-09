package ma.nafura.chantiers.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import lombok.Data;

@Data
public class ActiviteChantierCreateDto {

    @NotBlank
    private String libelle;

    private ma.nafura.chantiers.domain.calendrier.CalendrierActivite calendrierSpecifique;
    private Boolean utiliserCalendrierChantier;

    /** PHASE / ACTIVITE / JALON — défaut ACTIVITE. */
    private String forme;

    /** Classification ; absente = à qualifier. */
    private String natureCode;

    private String code;

    @NotNull
    private LocalDate dateDebut;

    /**
     * Date de fin visible (fin incluse). Facultative si {@link #dureeMinutesOuvrees} est fournie
     * (activité). Obligatoirement égale à {@link #dateDebut} pour un jalon.
     */
    private LocalDate dateFin;

    /** Minutes ouvrées. Jalon = 0. Absente + dates explicites = à qualifier. */
    private Integer dureeMinutesOuvrees;

    private String parentActiviteId;

    private String zoneId;

    private Integer ordre;

    private String status;
}
