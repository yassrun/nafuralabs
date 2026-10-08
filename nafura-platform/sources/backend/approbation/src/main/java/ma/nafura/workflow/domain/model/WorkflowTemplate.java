package ma.nafura.platform.collaboration.workflow.domain.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ma.nafura.platform.framework.domain.TenantEntity;
import org.hibernate.annotations.Formula;

/** Approval workflow template for an entity type; steps are persisted with the template. */
@Entity
@Table(name = "workflow_templates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowTemplate extends TenantEntity {

    @NotBlank
    @Size(max = 60)
    @Column(name = "code", nullable = false, length = 60)
    private String code;

    @NotBlank
    @Size(max = 200)
    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @NotBlank
    @Size(max = 80)
    @Column(name = "entity_type", nullable = false, length = 80)
    private String entityType;

    @Column(name = "description")
    private String description;

    @Column(name = "is_active")
    private Boolean isActive;

    @Setter(AccessLevel.NONE)
    @Formula("(select count(*)::int from workflow_steps s where s.workflow_template_id = id)")
    private Integer stepCount;

    @Valid
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "workflow_template_id")
    @OrderBy("stepNumber ASC")
    @Builder.Default
    private List<WorkflowStep> steps = new ArrayList<>();
}
