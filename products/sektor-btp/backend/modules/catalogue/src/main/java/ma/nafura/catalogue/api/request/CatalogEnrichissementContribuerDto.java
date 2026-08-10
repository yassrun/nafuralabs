package ma.nafura.catalogue.api.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CatalogEnrichissementContribuerDto {

    @NotBlank
    private String libelle;

    private String nature;

    private String uniteCode;

    /** ARTICLE | OUVRAGE */
    private String typeObjet;

    /** REGLE | IA | MANUEL */
    private String proposePar;
}
