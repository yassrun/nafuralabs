package ma.nafura.etudes.domain.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "dpgf")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Dpgf {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "numero", nullable = false, length = 50)
    private String numero;

    @Column(name = "metre_id", nullable = false)
    @JsonIgnore
    private UUID metreId;

    @Column(name = "projet_nom", length = 500)
    private String projetNom;

    @Column(name = "tva_taux", nullable = false, precision = 8, scale = 4)
    private BigDecimal tvaTaux;

    @Column(name = "total_ht", nullable = false, precision = 18, scale = 4)
    @JsonProperty("totalHT")
    private BigDecimal totalHt;

    @Column(name = "total_tva", nullable = false, precision = 18, scale = 4)
    private BigDecimal totalTva;

    @Column(name = "total_ttc", nullable = false, precision = 18, scale = 4)
    @JsonProperty("totalTTC")
    private BigDecimal totalTtc;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "dpgf", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<DpgfNoeud> noeuds = new ArrayList<>();

    @JsonProperty("hierarchie")
    @Transient
    private List<DpgfNoeud> hierarchie;

    @JsonProperty("metreId")
    public String getMetreIdJson() {
        return metreId != null ? metreId.toString() : null;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
        if (this.tvaTaux == null) {
            this.tvaTaux = new BigDecimal("20");
        }
        if (this.totalHt == null) {
            this.totalHt = BigDecimal.ZERO;
        }
        if (this.totalTva == null) {
            this.totalTva = BigDecimal.ZERO;
        }
        if (this.totalTtc == null) {
            this.totalTtc = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
