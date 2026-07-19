package ma.nafura.platform.administration.iam.domain.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tenant_invitation", indexes = {
    @Index(name = "idx_tenant_invitation_tenant_user", columnList = "tenant_id, user_id"),
    @Index(name = "idx_tenant_invitation_status", columnList = "status"),
    @Index(name = "idx_tenant_invitation_expires", columnList = "expires_at")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_tenant_invitation_jti", columnNames = {"token_jti"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantInvitation {

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_ACCEPTED = "ACCEPTED";
    public static final String STATUS_REVOKED = "REVOKED";
    public static final String STATUS_EXPIRED = "EXPIRED";

    public static final String DELIVERY_SENT = "SENT";
    public static final String DELIVERY_FAILED = "FAILED";
    public static final String DELIVERY_PENDING = "PENDING";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Column(name = "token_jti", nullable = false)
    private UUID tokenJti;

    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = STATUS_PENDING;

    @Column(name = "email_delivery_status", length = 20)
    private String emailDeliveryStatus;

    @Column(name = "inviter_message", columnDefinition = "TEXT")
    private String inviterMessage;

    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt;

    @Column(name = "accepted_at")
    private OffsetDateTime acceptedAt;

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
