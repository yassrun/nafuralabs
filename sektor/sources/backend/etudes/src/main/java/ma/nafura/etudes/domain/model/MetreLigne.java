package ma.nafura.etudes.domain.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSetter;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "metre_lignes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MetreLigne {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "metre_id", nullable = false)
    @JsonBackReference
    private Metre metre;

    @Column(name = "ouvrage_id")
    @JsonIgnore
    private UUID ouvrageRefId;

    @Column(name = "ouvrage_code", length = 50)
    private String ouvrageCode;

    @Column(name = "designation_libre", length = 500)
    private String designationLibre;

    @Column(name = "unite", nullable = false, length = 30)
    private String unite;

    @Column(name = "lot_code", length = 20)
    private String lotCode;

    @Column(name = "sous_lot_code", length = 20)
    private String sousLotCode;

    @Column(name = "lot_libelle", length = 255)
    private String lotLibelle;

    @Column(name = "sous_lot_libelle", length = 255)
    private String sousLotLibelle;

    @Column(name = "longueur", precision = 18, scale = 4)
    private BigDecimal longueur;

    @Column(name = "largeur", precision = 18, scale = 4)
    private BigDecimal largeur;

    @Column(name = "hauteur", precision = 18, scale = 4)
    private BigDecimal hauteur;

    @Column(name = "nombre", precision = 18, scale = 4)
    private BigDecimal nombre;

    @Column(name = "formule", length = 255)
    private String formule;

    @Column(name = "quantite_calculee", nullable = false, precision = 18, scale = 4)
    private BigDecimal quantiteCalculee;

    @Column(name = "notes")
    private String notes;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @JsonProperty("metreId")
    public String getMetreId() {
        if (metre != null && metre.getId() != null) {
            return metre.getId().toString();
        }
        return null;
    }

    @JsonProperty("ouvrageId")
    public String getOuvrageId() {
        return ouvrageRefId != null ? ouvrageRefId.toString() : null;
    }

    @JsonSetter("ouvrageId")
    public void setOuvrageId(String ouvrageId) {
        if (ouvrageId == null || ouvrageId.isBlank()) {
            this.ouvrageRefId = null;
            return;
        }
        this.ouvrageRefId = UUID.fromString(ouvrageId.trim());
    }

    public UUID getOuvrageRefId() {
        return ouvrageRefId;
    }

    public void setOuvrageRefId(UUID ouvrageRefId) {
        this.ouvrageRefId = ouvrageRefId;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
        if (this.quantiteCalculee == null) {
            this.quantiteCalculee = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
