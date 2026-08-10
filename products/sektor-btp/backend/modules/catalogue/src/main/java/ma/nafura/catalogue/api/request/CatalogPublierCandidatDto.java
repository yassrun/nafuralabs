package ma.nafura.catalogue.api.request;

import lombok.Data;

@Data
public class CatalogPublierCandidatDto {
    /** Code édition cible (défaut = dernière édition). */
    private String editionCode;
}
