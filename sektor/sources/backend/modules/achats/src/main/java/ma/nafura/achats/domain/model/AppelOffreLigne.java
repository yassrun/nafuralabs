package ma.nafura.achats.domain.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "appels_offres_lignes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppelOffreLigne {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appel_offre_achat_id", nullable = false)
    @JsonBackReference("ao-lignes")
    private AppelOffreAchat appelOffre;

    @Column(name = "article_id", nullable = false, length = 100)
    private String articleId;

    @Column(name = "article_code", length = 50)
    private String articleCode;

    @Column(name = "article_name", length = 255)
    private String articleName;

    @Column(name = "quantite", nullable = false, precision = 18, scale = 4)
    private BigDecimal quantite;

    @Column(name = "uom_code", length = 30)
    private String uomCode;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @JsonProperty("aoId")
    public String getAoId() {
        if (appelOffre != null && appelOffre.getId() != null) {
            return appelOffre.getId().toString();
        }
        return null;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
