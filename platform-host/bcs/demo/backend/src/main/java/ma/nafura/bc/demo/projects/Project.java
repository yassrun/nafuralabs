package ma.nafura.bc.demo.projects;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import ma.nafura.platform.framework.domain.TenantEntity;
import ma.nafura.platform.framework.record.HasStatus;

/** Study → quote → (validation) → execution → closed: see lifecycle/project.json. */
@Entity(name = "DemoProject")
@Table(name = "demo_project")
@Getter
@Setter
public class Project extends TenantEntity implements HasStatus {

    @NotBlank
    @Size(max = 160)
    private String name;

    @NotBlank
    @Size(max = 160)
    private String client;

    @Size(max = 80)
    private String city;

    /** Markdown. Column is TEXT in the v1.0 schema. */
    @Column(columnDefinition = "text")
    private String description;

    @DecimalMin("0")
    private BigDecimal budget;

    @Column(name = "study_notes")
    @Size(max = 4000)
    private String studyNotes;

    @Column(name = "quote_amount")
    @DecimalMin("0")
    private BigDecimal quoteAmount;

    @Column(name = "quote_date")
    private LocalDate quoteDate;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Min(0)
    @Max(100)
    private Integer progress;

    @Column(name = "closing_notes")
    @Size(max = 4000)
    private String closingNotes;

    private String status;
}
