package ma.nafura.chantiers.domain.activite;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.*;
@Entity @Table(name="chantier_planning_reports") @Getter @Setter @NoArgsConstructor
public class PlanningReport {
    @Id private String id;
    @Column(nullable=false) private UUID tenantId;
    @Column(nullable=false) private String chantierId;
    @Version private Long version;
    private String status;
    private String proposedBy;
    private Instant proposedAt;
    @Column(columnDefinition="text") private String reason;
    @Column(columnDefinition="text") private String request;
    @Column(columnDefinition="text") private String preview;
    private String decidedBy;
    private Instant decidedAt;
    @Column(columnDefinition="text") private String decisionNote;
}
