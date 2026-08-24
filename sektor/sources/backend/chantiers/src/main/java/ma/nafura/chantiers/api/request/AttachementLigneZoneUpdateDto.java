package ma.nafura.chantiers.api.request;

import lombok.Data;

/** AC-14 — la zone facultative d'une ligne, choisie dans le référentiel du chantier. */
@Data
public class AttachementLigneZoneUpdateDto {

    /** {@code null} ou vide retire la zone de la ligne. */
    private String zoneId;
}
