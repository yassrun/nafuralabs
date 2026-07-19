package ma.nafura.etudes.api.request;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;

/**
 * Nœud d'import bordereau, aligné sur {@link ma.nafura.etudes.domain.model.DpgfNoeud}
 * (types LOT / SOUS_LOT / ARTICLE — plus de POSTE consultation).
 */
@Data
public class ImportNoeudDto {

    private String type;
    private String code;
    private String libelle;
    private String unite;
    private BigDecimal quantite;
    private String descriptif;
    private Integer ordre;
    private String mode;

    private List<ImportNoeudDto> enfants = new ArrayList<>();
    private List<ImportComposantDto> composants = new ArrayList<>();
}
