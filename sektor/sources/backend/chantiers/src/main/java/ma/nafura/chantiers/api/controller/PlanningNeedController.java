package ma.nafura.chantiers.api.controller;
import java.math.BigDecimal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import ma.nafura.chantiers.domain.activite.PlanningNeed;
import ma.nafura.chantiers.service.PlanningNeedService;
import ma.nafura.platform.authorization.security.authorization.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/chantiers/{chantierId}/activites/{activityId}/needs")
@SecuredResource(domain="chantiers",feature="chantiers",resource="chantier-activite")
public class PlanningNeedController {
    private final PlanningNeedService service;
    public PlanningNeedController(PlanningNeedService service){this.service=service;}
    public record Create(@NotBlank String type,@NotBlank @Size(max=250) String label,@NotNull @Positive BigDecimal quantity,
                         @NotBlank @Size(max=30) String unit,@Min(0) @Max(3650) int daysBeforeStart,@Min(0) @Max(3650) int leadDays) {}
    @PostMapping @RequirePermission("chantiers.update")
    public PlanningNeed create(@PathVariable String chantierId,@PathVariable String activityId,@Valid @RequestBody Create body) {
        return service.add(chantierId,activityId,body.type(),body.label(),body.quantity(),body.unit(),body.daysBeforeStart(),body.leadDays());
    }
    @DeleteMapping("/{needId}") @RequirePermission("chantiers.update")
    public void remove(@PathVariable String chantierId,@PathVariable String activityId,@PathVariable String needId) {service.remove(chantierId,activityId,needId);}
}
