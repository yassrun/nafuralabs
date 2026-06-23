package ma.nafura.hse.domain.model;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "incidents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Incident {

    public static final String STATUS_OUVERT = "OUVERT";
    public static final String STATUS_INVESTIGATION = "INVESTIGATION";
    public static final String STATUS_CLOS = "CLOS";

    public static final String TYPE_AT = "AT";
    public static final String TYPE_MP = "MP";
    public static final String TYPE_INCIDENT = "INCIDENT";
    public static final String TYPE_PRESQU_ACCIDENT = "PRESQU_ACCIDENT";
    public static final String TYPE_ENVIRONNEMENT = "ENVIRONNEMENT";

    public static final String GRAVITE_LEGER = "LEGER";
    public static final String GRAVITE_MODERE = "MODERE";
    public static final String GRAVITE_GRAVE = "GRAVE";
    public static final String GRAVITE_CRITIQUE = "CRITIQUE";

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false, length = 50)
    private String numero;

    @Column(name = "chantier_id", length = 100)
    private String chantierId;

    @Column(name = "chantier_code", length = 50)
    private String chantierCode;

    @Column(name = "employe_id", length = 100)
    private String employeId;

    @Column(name = "victime_nom", length = 255)
    private String victimeNom;

    @Column(name = "date_incident", nullable = false)
    private LocalDate dateIncident;

    @Column(name = "heure_incident")
    private LocalTime heureIncident;

    @Column(nullable = false, length = 500)
    private String lieu;

    @Column(name = "type_incident", nullable = false, length = 30)
    private String typeIncident;

    @Column(nullable = false, length = 30)
    private String gravite;

    @Column(nullable = false)
    private String description;

    private String causes;

    @Column(name = "actions_immediates")
    private String actionsImmediates;

    @Column(name = "plan_action")
    private String planAction;

    @Column(name = "jours_arret")
    private Integer joursArret;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "cnss_dat_declare", nullable = false)
    private boolean cnssDatDeclare;

    @Column(name = "cnss_dat_xml_url", length = 500)
    private String cnssDatXmlUrl;

    @Column(name = "cnss_reference_declaration", length = 100)
    private String cnssReferenceDeclaration;

    @Column(name = "cnss_date_declaration")
    private LocalDate cnssDateDeclaration;

    @Column(name = "ijss_montant", precision = 18, scale = 4)
    private BigDecimal ijssMontant;

    @Column(name = "ijss_periode", length = 100)
    private String ijssPeriode;

    private String notes;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "incident_photos", joinColumns = @JoinColumn(name = "incident_id"))
    @Column(name = "photo_url", length = 500)
    @Builder.Default
    private List<String> photosUrls = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "incident_temoins", joinColumns = @JoinColumn(name = "incident_id"))
    @Column(name = "temoin", length = 255)
    @Builder.Default
    private List<String> temoins = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
        if (status == null) {
            status = STATUS_OUVERT;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
