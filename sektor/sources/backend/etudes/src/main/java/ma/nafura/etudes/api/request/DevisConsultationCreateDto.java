package ma.nafura.etudes.api.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class DevisConsultationCreateDto {

    @NotNull
    private UUID partenaireId;

    /** Pièce dossier liée (optionnel). Un PDF orphelin n'est pas un devis consultation. */
    private UUID documentId;

    @Valid
    private List<Ligne> lignes = new ArrayList<>();

    @Data
    public static class Ligne {
        @NotNull
        private String cleStable;

        private String designation;
        private BigDecimal quantite;
        private String unite;

        @NotNull
        private BigDecimal prixUnitaire;
    }
}
