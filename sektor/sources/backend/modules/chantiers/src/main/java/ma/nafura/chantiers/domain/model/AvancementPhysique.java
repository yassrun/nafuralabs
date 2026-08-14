package ma.nafura.chantiers.domain.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.util.StringUtils;

@Entity
@Table(name = "avancements_physiques")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AvancementPhysique {

    public static final String STATUS_BROUILLON = "BROUILLON";
    public static final String STATUS_VALIDE = "VALIDE";

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "chantier_id", nullable = false, length = 100)
    private String chantierId;

    @Column(name = "lot_id", length = 100)
    private String lotId;

    @Column(name = "poste_id", length = 100)
    private String posteId;

    @Column(name = "date_saisie", nullable = false)
    private LocalDate dateSaisie;

    @Column(name = "quantite_realisee", nullable = false, precision = 18, scale = 4)
    private BigDecimal quantiteRealisee;

    @Column(nullable = false, precision = 8, scale = 4)
    private BigDecimal pourcentage;

    @Column(length = 2000)
    private String notes;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "saisie_par_id", length = 100)
    private String saisieParId;

    @Column(name = "saisie_par_name", length = 200)
    private String saisieParName;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @JsonProperty("date")
    public LocalDate getDate() {
        return dateSaisie;
    }

    public void setDate(LocalDate date) {
        this.dateSaisie = date;
    }

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
        if (quantiteRealisee == null) {
            quantiteRealisee = BigDecimal.ZERO;
        }
        if (pourcentage == null) {
            pourcentage = BigDecimal.ZERO;
        }
        if (!StringUtils.hasText(status)) {
            status = STATUS_BROUILLON;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
