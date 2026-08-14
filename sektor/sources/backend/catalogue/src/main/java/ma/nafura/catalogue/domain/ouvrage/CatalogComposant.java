package ma.nafura.catalogue.domain.ouvrage;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "catalog_composants")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CatalogComposant {

    @Id
    private UUID id;

    @Column(name = "catalog_ouvrage_id", nullable = false)
    private UUID catalogOuvrageId;

    @Column(nullable = false)
    @Builder.Default
    private Integer rang = 0;

    @Column(nullable = false, length = 40)
    private String nature;

    @Column(nullable = false, length = 300)
    private String libelle;

    @Column(name = "unite_code", length = 20)
    private String uniteCode;

    @Column(nullable = false, precision = 18, scale = 6)
    private BigDecimal rendement;

    @Column(name = "catalog_article_cle", length = 120)
    private String catalogArticleCle;

    @Column(name = "base_rendement", nullable = false, length = 20)
    @Builder.Default
    private String baseRendement = "PAR_UNITE";

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (rang == null) {
            rang = 0;
        }
        if (baseRendement == null) {
            baseRendement = "PAR_UNITE";
        }
    }
}
