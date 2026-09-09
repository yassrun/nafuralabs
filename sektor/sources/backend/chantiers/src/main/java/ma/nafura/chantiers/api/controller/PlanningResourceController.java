package ma.nafura.chantiers.api.controller;
import java.time.LocalDate;
import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import ma.nafura.chantiers.service.PlanningResourceService;
import ma.nafura.platform.authorization.security.authorization.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/chantiers/{chantierId}/planning-resources")
@SecuredResource(domain="chantiers",feature="chantiers",resource="chantier-activite")
public class PlanningResourceController {
    private final PlanningResourceService service;
    public PlanningResourceController(PlanningResourceService service) {this.service=service;}
    public record Reservation(@NotBlank String activityId,@NotBlank String affectationId,@Min(0) @Max(1440) int minutesParJour) {}
    @GetMapping @RequirePermission("chantiers.read")
    public List<PlanningResourceService.Day> week(@PathVariable String chantierId,@RequestParam LocalDate start) {return service.week(chantierId,start);}
    @PutMapping @RequirePermission("chantiers.update")
    public void reserve(@PathVariable String chantierId,@Valid @RequestBody Reservation body) {service.reserve(chantierId,body.activityId(),body.affectationId(),body.minutesParJour());}
}
