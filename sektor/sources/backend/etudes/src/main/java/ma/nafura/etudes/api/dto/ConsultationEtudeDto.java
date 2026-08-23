package ma.nafura.etudes.api.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ConsultationEtudeDto {

    private UUID id;
    private UUID dossierEtudeId;
    private String statut;
    @Builder.Default
    private List<String> paquetCleStables = new ArrayList<>();
    @Builder.Default
    private List<UUID> partenaireIds = new ArrayList<>();
    @Builder.Default
    private List<Devis> devis = new ArrayList<>();
    @Builder.Default
    private List<IdentiteCouverte> identitesCouvertes = new ArrayList<>();
    private long devisRecus;
    private long fournisseursDistincts;

    @Data
    @Builder
    public static class Devis {
        private UUID id;
        private UUID partenaireId;
        private UUID documentId;
        private OffsetDateTime recuAt;
        private boolean hasLignes;
        @Builder.Default
        private List<Ligne> lignes = new ArrayList<>();
    }

    @Data
    @Builder
    public static class Ligne {
        private UUID id;
        private String cleStable;
        private String designation;
        private BigDecimal quantite;
        private String unite;
        private BigDecimal prixUnitaire;
        private UUID itemId;
    }

    @Data
    @Builder
    public static class IdentiteCouverte {
        private String cleStable;
        private UUID devisConsultationId;
        private BigDecimal prixUnitaire;
    }
}
