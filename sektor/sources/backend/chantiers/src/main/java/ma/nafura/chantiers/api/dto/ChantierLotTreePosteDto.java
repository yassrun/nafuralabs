package ma.nafura.chantiers.api.dto;

import java.math.BigDecimal;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ma.nafura.chantiers.domain.chantier.NatureLigne;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChantierLotTreePosteDto {

    private String id;
    private String lotId;
    private String code;
    private String designation;
    /** Vendu ou interne — AC-1. */
    private NatureLigne nature;
    /** Lien retour vers le nœud du devis, pour une ligne vendue seulement — AC-2. */
    private UUID dpgfNoeudId;
    private String unite;
    private BigDecimal quantite;
    private BigDecimal prixUnitaireHt;
    private BigDecimal montantHt;
    private int ordre;
}
