package ma.nafura.chantiers.api.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalTime;
import lombok.Data;

@Data
public class CalendrierCreneauWriteDto {

    /** ISO-8601 : 1 = lundi … 7 = dimanche. Requis pour la semaine type. */
    @Min(1)
    @Max(7)
    private Integer jourSemaine;

    @NotNull
    private LocalTime heureDebut;

    @NotNull
    private LocalTime heureFin;

    private Boolean lendemain;
}
