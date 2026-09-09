package ma.nafura.chantiers.api.dto;

import java.time.LocalTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalendrierCreneauDto {

    /** ISO-8601 : 1 = lundi … 7 = dimanche. Absent sur un créneau d'ouverture exceptionnelle. */
    private Integer jourSemaine;

    private LocalTime heureDebut;

    private LocalTime heureFin;

    /** Shift nuit : heureFin tombe le lendemain (ex. 22:00 → 06:00). */
    private boolean lendemain;
}
