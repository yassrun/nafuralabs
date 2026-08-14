package ma.nafura.catalogue.api.request;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;
import lombok.Data;

@Data
public class RapprochementSearchDto {

    @NotBlank
    private String libelle;

    /** TENANT_ITEM | TENANT_OUVRAGE | SUPPLIER_LINE | COMPOSANT_LIBRE */
    private String sourceType;

    private UUID sourceId;

    private Integer limit;

    /** Si true, persiste les hits en SUGGERE. */
    private boolean persister;
}
