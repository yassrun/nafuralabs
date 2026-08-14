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
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "receptions_achat_lignes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReceptionAchatLigne {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reception_achat_id", nullable = false)
    @JsonBackReference
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private ReceptionAchat reception;

    @Column(name = "bon_commande_ligne_id", nullable = false)
    private UUID bonCommandeLigneId;

    @Column(name = "article_id", nullable = false, length = 100)
    private String articleId;

    @Column(name = "quantite_recue", nullable = false, precision = 18, scale = 4)
    private BigDecimal quantiteRecue;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @JsonProperty("receptionId")
    public String getReceptionId() {
        if (reception != null && reception.getId() != null) {
            return reception.getId().toString();
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
