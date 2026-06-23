package ma.nafura.finance.domain.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "chart_of_accounts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChartOfAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "account_class", nullable = false)
    private Integer accountClass;

    @Column(name = "account_type", nullable = false, length = 30)
    private String accountType;

    @Column(name = "parent_account_code", length = 50)
    private String parentAccountCode;

    @Column(name = "is_collectif", nullable = false)
    private Boolean isCollectif;

    @Column(name = "is_lettrable", nullable = false)
    private Boolean isLettrable;

    @Column(name = "is_auxiliaire", nullable = false)
    private Boolean isAuxiliaire;

    @Column(name = "axe_analytique_obligatoire", nullable = false)
    private Boolean axeAnalytiqueObligatoire;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

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
