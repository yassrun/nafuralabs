package ma.nafura.platform.framework.scope;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import ma.nafura.platform.framework.domain.TenantEntity;

/**
 * A role held on one scope node. The role's permissions apply to that node and its descendants,
 * not to the rest of the organisation.
 */
@Entity
@Table(name = "scope_grants")
@Getter
@Setter
public class ScopeGrant extends TenantEntity {

    @NotNull
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @NotBlank
    @Column(name = "role_code", nullable = false, length = 80)
    private String roleCode;

    /** Entity key of a scope node ({@code probe.group}, {@code demo.category}). */
    @NotBlank
    @Column(nullable = false, length = 120)
    private String entity;

    @NotNull
    @Column(name = "record_id", nullable = false)
    private UUID recordId;
}
