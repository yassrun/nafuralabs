package ma.nafura.chantiers.domain.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.util.StringUtils;

@Entity
@Table(name = "chantier_phases")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChantierPhase {

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "chantier_id", nullable = false, length = 100)
    private String chantierId;

    @Column(name = "lot_id", length = 100)
    private String lotId;

    @Column(nullable = false, length = 50)
    private String code;

    @Column(nullable = false, length = 500)
    private String designation;

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @Column(name = "date_fin", nullable = false)
    private LocalDate dateFin;

    @JsonIgnore
    @Column(length = 2000)
    private String dependances;

    @Column(name = "responsable_id", length = 100)
    private String responsableId;

    @Column(name = "responsable_name", length = 200)
    private String responsableName;

    @Column(name = "equipe_name", length = 200)
    private String equipeName;

    @Column(precision = 18, scale = 4)
    private BigDecimal quantite;

    @Column(length = 30)
    private String unite;

    @Column(name = "avancement_percent", nullable = false, precision = 8, scale = 4)
    private BigDecimal avancementPercent;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(nullable = false)
    private int ordre;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Transient
    @JsonProperty("dependances")
    public List<String> getDependancesList() {
        if (!StringUtils.hasText(dependances)) {
            return Collections.emptyList();
        }
        return Arrays.stream(dependances.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .collect(Collectors.toList());
    }

    public void setDependancesList(List<String> values) {
        if (values == null || values.isEmpty()) {
            dependances = null;
            return;
        }
        dependances = values.stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .collect(Collectors.joining(","));
    }

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
        if (avancementPercent == null) {
            avancementPercent = BigDecimal.ZERO;
        }
        if (!StringUtils.hasText(status)) {
            status = "PLANIFIE";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
