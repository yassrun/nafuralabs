package ma.nafura.etudes.domain.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "metrees")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Metre {

    public static final String STATUS_BROUILLON = "BROUILLON";
    public static final String STATUS_TERMINE = "TERMINE";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "numero", nullable = false, length = 50)
    private String numero;

    @Column(name = "projet_nom", nullable = false, length = 500)
    private String projetNom;

    @Column(name = "ville", length = 255)
    private String ville;

    @Column(name = "date_metre", nullable = false)
    private LocalDate dateMetre;

    @Column(name = "metreur_id", nullable = false, length = 100)
    private String metreurId;

    @Column(name = "metreur_name", length = 255)
    private String metreurName;

    @Column(name = "notes")
    private String notes;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "metre", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    @Builder.Default
    private List<MetreLigne> lignes = new ArrayList<>();

    @JsonProperty("nbLignes")
    public int getNbLignes() {
        return lignes != null ? lignes.size() : 0;
    }

    @JsonProperty("quantiteTotaleEstimee")
    public BigDecimal getQuantiteTotaleEstimee() {
        if (lignes == null || lignes.isEmpty()) {
            return BigDecimal.ZERO;
        }
        BigDecimal total = lignes.stream()
                .map(l -> l.getQuantiteCalculee() != null ? l.getQuantiteCalculee() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return total.setScale(3, RoundingMode.HALF_UP);
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
        if (this.status == null) {
            this.status = STATUS_BROUILLON;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
