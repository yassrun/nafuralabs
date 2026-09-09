package ma.nafura.chantiers.api.dto;

import lombok.Builder;
import lombok.Data;

/**
 * Capacités métier L1 du planning (SEKTOR-327). A01–A03 (semaine, report,
 * publication) absents volontairement.
 */
@Data
@Builder
public class PlanningCapacitesDto {

    private boolean lire;
    private boolean editerStructure;
    private boolean proposerStructure;
    private boolean administrerCalendrier;
    private boolean proposerCalendrier;
    private boolean gererVues;

    public static PlanningCapacitesDto none() {
        return PlanningCapacitesDto.builder().build();
    }

    public static PlanningCapacitesDto applyAll() {
        return PlanningCapacitesDto.builder()
                .lire(true)
                .editerStructure(true)
                .administrerCalendrier(true)
                .gererVues(true)
                .build();
    }

    public static PlanningCapacitesDto readOnly() {
        return PlanningCapacitesDto.builder().lire(true).gererVues(true).build();
    }
}
