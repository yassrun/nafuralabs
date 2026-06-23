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
@Table(name = "subscription_plan", indexes = {
    @Index(name = "idx_subscription_plan_application", columnList = "application_id"),
    @Index(name = "idx_subscription_plan_scope", columnList = "scope"),
    @Index(name = "idx_subscription_plan_model", columnList = "delivery_model")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_subscription_plan_app_code", columnNames = {"application_id", "plan_code"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "application_id", nullable = false, length = 80)
    private String applicationId;

    @Column(name = "plan_code", nullable = false, length = 80)
    private String planCode;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "description", length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "scope", nullable = false, length = 20)
    private SubscriptionPlanScope scope;

    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_model", nullable = false, length = 20)
    private SubscriptionDeliveryModel deliveryModel;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Builder.Default
    @Column(name = "is_builtin", nullable = false)
    private boolean builtin = true;

    @Column(name = "metadata_json", columnDefinition = "TEXT")
    private String metadataJson;

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

