package ma.nafura.catalogue.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "catalog_articles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CatalogArticle {

    @Id
    private UUID id;

    @Column(name = "cle_stable", nullable = false, unique = true, length = 120)
    private String cleStable;

    @Column(nullable = false, length = 40)
    private String nature;

    @Column(nullable = false, length = 300)
    private String libelle;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "unite_code", nullable = false, length = 20)
    private String uniteCode;

    @Column(name = "code_famille", length = 40)
    private String codeFamille;

    @Column(nullable = false, length = 20)
    private String statut;

    @Column(name = "edition_publication", length = 40)
    private String editionPublication;

    @Column(name = "remplace_par")
    private UUID remplacePar;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        OffsetDateTime now = OffsetDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (statut == null) {
            statut = "BROUILLON";
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
