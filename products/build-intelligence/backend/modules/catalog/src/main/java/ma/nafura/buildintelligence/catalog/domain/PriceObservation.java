package ma.nafura.buildintelligence.catalog.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "bi_price_observation")
@Getter
@Setter
public class PriceObservation {

    @Id
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "work_item_id")
    private UUID workItemId;

    @Column(name = "document_id")
    private UUID documentId;

    @Column(name = "price_type", nullable = false, length = 64)
    private String priceType;

    @Column(nullable = false, precision = 18, scale = 4)
    private BigDecimal amount;

    @Column(nullable = false, length = 8)
    private String currency = "MAD";

    @Column(name = "unit_code", length = 32)
    private String unitCode;

    private BigDecimal quantity;

    private String city;
    private String region;

    @Column(name = "project_type")
    private String projectType;

    @Column(name = "observed_at")
    private LocalDate observedAt;

    private BigDecimal confidence;

    @Column(name = "validation_status", nullable = false, length = 32)
    private String validationStatus = "VALIDATED";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> metadata;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        createdAt = OffsetDateTime.now();
    }
}
