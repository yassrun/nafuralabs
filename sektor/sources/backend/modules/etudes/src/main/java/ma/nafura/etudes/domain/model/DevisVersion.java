package ma.nafura.etudes.domain.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "devis_versions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DevisVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "devis_id", nullable = false)
    @JsonBackReference("devisVersions")
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private Devis devis;

    @Column(name = "version", nullable = false)
    private Integer version;

    @Column(name = "snapshot_date", nullable = false)
    private LocalDate snapshotDate;

    @Column(name = "total_ht", nullable = false, precision = 18, scale = 4)
    private BigDecimal totalHt;

    @Column(name = "modifications", nullable = false)
    private String modifications;

    @Column(name = "url", length = 500)
    private String url;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @JsonProperty("devisId")
    public String getDevisIdJson() {
        return devis != null && devis.getId() != null ? devis.getId().toString() : null;
    }

    @JsonProperty("date")
    public LocalDate getDateJson() {
        return snapshotDate;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        if (this.snapshotDate == null) {
            this.snapshotDate = LocalDate.now();
        }
    }
}
