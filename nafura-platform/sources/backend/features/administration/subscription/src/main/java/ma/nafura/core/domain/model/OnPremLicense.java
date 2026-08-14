package ma.nafura.platform.subscription.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "on_prem_license", indexes = {
    @Index(name = "idx_on_prem_license_assignment", columnList = "application_id,assignment_id"),
    @Index(name = "idx_on_prem_license_status", columnList = "status")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_on_prem_license_hash", columnNames = {"application_id", "license_key_hash"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OnPremLicense {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "application_id", nullable = false, length = 80)
    private String applicationId;

    @Column(name = "assignment_id")
    private UUID assignmentId;

    @Column(name = "license_key_hash", nullable = false, length = 128)
    private String licenseKeyHash;

    @Column(name = "deployment_id", length = 120)
    private String deploymentId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private LicenseStatus status;

    @Column(name = "issued_to", length = 255)
    private String issuedTo;

    @Column(name = "valid_from")
    private OffsetDateTime validFrom;

    @Column(name = "valid_to")
    private OffsetDateTime validTo;

    @Column(name = "max_users")
    private Integer maxUsers;

    @Column(name = "max_tenants")
    private Integer maxTenants;

    @Column(name = "claims_json", columnDefinition = "TEXT")
    private String claimsJson;

    @Column(name = "signature", length = 1024)
    private String signature;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}

