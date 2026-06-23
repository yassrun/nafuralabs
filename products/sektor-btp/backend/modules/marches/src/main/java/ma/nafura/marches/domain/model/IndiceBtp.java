package ma.nafura.marches.domain.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "indices_btp")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IndiceBtp {

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "code", nullable = false, length = 20)
    private String code;

    @Column(name = "periode", nullable = false, length = 7)
    private String periode;

    @Column(name = "valeur", nullable = false, precision = 18, scale = 6)
    private BigDecimal valeur;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        if (this.valeur == null) {
            this.valeur = BigDecimal.ZERO;
        }
    }
}
