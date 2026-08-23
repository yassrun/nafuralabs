package ma.nafura.chantiers.api.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
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
public class ChantierLotTreeNodeDto {

    private String id;
    private String chantierId;
    private String code;
    private String designation;
    private String parentLotId;
    /** Vendu ou interne — AC-1 : la nature est rendue par les endpoints de lecture de l'arbre. */
    private NatureLigne nature;
    /** Lien retour vers le nœud du devis, pour une ligne vendue seulement — AC-2. */
    private UUID dpgfNoeudId;
    private BigDecimal avancementPercent;
    private int ordre;
    private int depth;

    @Builder.Default
    private List<ChantierLotTreeNodeDto> children = new ArrayList<>();

    @Builder.Default
    private List<ChantierLotTreePosteDto> postes = new ArrayList<>();
}
