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
@Table(name = "demandes_achat_lignes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DemandeAchatLigne {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "demande_achat_id", nullable = false)
    @JsonBackReference
    private DemandeAchat demande;

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

    @Column(name = "prix_estime_ht", precision = 18, scale = 4)
    private BigDecimal prixEstimeHt;

    @Column(name = "total_estime_ht", precision = 18, scale = 4)
    private BigDecimal totalEstimeHt;

    @Column(name = "notes")
    private String notes;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @JsonProperty("daId")
    public String getDaId() {
        if (demande != null && demande.getId() != null) {
            return demande.getId().toString();
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
