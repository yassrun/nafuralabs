package ma.nafura.achats.api.request;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;

@Data
public class ConsultationDevisImportDto {

    private String fichierNom;

    private List<Ligne> lignes = new ArrayList<>();

    @Data
    public static class Ligne {
        private String identite;
        private String libelle;
        private BigDecimal quantite;
        private String unite;
        private BigDecimal prixUnitaire;
    }
}
