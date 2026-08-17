package ma.nafura.etudes.api.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GuestSnapshotDto {

    private String purpose;
    private String email;
    private String numero;
    private String objet;
    private String clientNom;
    private String tenantNom;
    private String dossierId;
    private String dpgfId;
    private BigDecimal totalHt;
    private OffsetDateTime expiresAt;

    @Builder.Default
    private List<GuestNoeudDto> arbre = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GuestNoeudDto {
        private String id;
        private String type;
        private String code;
        private String libelle;
        private String unite;
        private BigDecimal quantite;
        private BigDecimal prixUnitaire;
        private BigDecimal coutUnitaire;
        private BigDecimal fraisGenerauxPercent;
        private BigDecimal margePercent;
        private BigDecimal total;
        private String origineCout;
        private String estimationSaisieEn;
        private Boolean coutDeduit;
        private String descriptif;
        private String descriptifCps;
        private String prixDpuId;
        private GuestDpuDto dpu;

        @Builder.Default
        private List<GuestComposantDto> composants = new ArrayList<>();

        @Builder.Default
        private List<GuestNoeudDto> enfants = new ArrayList<>();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GuestComposantDto {
        private String id;
        private String type;
        private String designation;
        private String unite;
        private BigDecimal quantite;
        private BigDecimal prixUnitaire;
        private BigDecimal total;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GuestDpuDto {
        private String id;
        private BigDecimal deboursSec;
        private BigDecimal fraisGenerauxPercent;
        private BigDecimal margeBeneficiairePercent;
        private BigDecimal prixVenteHt;
        private BigDecimal tvaTaux;

        @Builder.Default
        private List<GuestComposantDto> composants = new ArrayList<>();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GuestCommentDto {
        private String id;
        private String author;
        private String body;
        private String createdAt;
    }
}
