package ma.nafura.finance.domain.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "caisse_mouvements")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CaisseMouvement {

    public static final String TYPE_AVANCE_RECUE = "AVANCE_RECUE";
    public static final String TYPE_DEPENSE = "DEPENSE";
    public static final String TYPE_JUSTIFICATIF = "JUSTIFICATIF";
    public static final String TYPE_RETOUR = "RETOUR";

    public static final String STATUS_BROUILLON = "BROUILLON";
    public static final String STATUS_SOUMIS = "SOUMIS";
    public static final String STATUS_VALIDE = "VALIDE";
    public static final String STATUS_REJETE = "REJETE";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "caisse_id", nullable = false)
    private UUID caisseId;

    @Column(name = "movement_date", nullable = false)
    private LocalDate movementDate;

    @Column(name = "movement_type", nullable = false, length = 30)
    private String movementType;

    @Column(name = "amount", nullable = false, precision = 18, scale = 4)
    private BigDecimal amount;

    @Column(name = "category", length = 100)
    private String category;

    @Column(name = "description", nullable = false, length = 500)
    private String description;

    @Column(name = "photo_ticket_url", length = 500)
    private String photoTicketUrl;

    @Column(name = "geoloc_lat", precision = 10, scale = 7)
    private BigDecimal geolocLat;

    @Column(name = "geoloc_lng", precision = 10, scale = 7)
    private BigDecimal geolocLng;

    @Column(name = "validated_by", length = 255)
    private String validatedBy;

    @Column(name = "workflow_status", nullable = false, length = 20)
    private String workflowStatus;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
        if (this.workflowStatus == null) {
            this.workflowStatus = STATUS_BROUILLON;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
