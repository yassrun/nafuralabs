package ma.nafura.platform.authorization.domain.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import ma.nafura.platform.framework.domain.TenantEntity;
import org.hibernate.annotations.Formula;

import java.time.OffsetDateTime;

/**
 * An API key of the organization. Only its hash is stored; the plain key is returned once, by the create response.
 * A key never exceeds the permissions of whoever issued it.
 */
@Entity
@Table(name = "api_keys", indexes = {
    @Index(name = "idx_api_keys_tenant_active", columnList = "tenant_id,is_active"),
    @Index(name = "idx_api_keys_prefix", columnList = "key_prefix", unique = true)
})
@Getter
@Setter
public class ApiKey extends TenantEntity {

    @NotBlank
    @Size(max = 100)
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @JsonIgnore
    @Column(name = "key_hash", nullable = false, length = 200)
    private String keyHash;

    @Column(name = "key_prefix", nullable = false, length = 12, unique = true)
    private String keyPrefix;

    @Column(name = "permissions", nullable = false)
    private String[] permissions = new String[0];

    @Column(name = "expires_at")
    private OffsetDateTime expiresAt;

    @Column(name = "last_used_at")
    private OffsetDateTime lastUsedAt;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    /** Active, revoked or expired: what the list shows and filters on. */
    @Setter(AccessLevel.NONE)
    @Formula("(case when not is_active then 'Révoquée' when expires_at is not null and expires_at < now() then 'Expirée' else 'Active' end)")
    private String state;

    @Setter(AccessLevel.NONE)
    @Formula("(cardinality(permissions))")
    private Integer permissionCount;

    /** The plain key, only in the response that created it. */
    @Transient
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String plainKey;
}
