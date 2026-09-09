package ma.nafura.chantiers.api.controller;
import java.time.LocalDate;
import ma.nafura.chantiers.service.PlanningWeekService;
import ma.nafura.platform.authorization.security.authorization.*;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/v1/chantiers/{chantierId}/planning-weeks/{start}")
@SecuredResource(domain="chantiers",feature="chantiers",resource="chantier-activite")
public class PlanningWeekController {
    private final PlanningWeekService service;
    public PlanningWeekController(PlanningWeekService service){this.service=service;}
    @GetMapping @RequirePermission("chantiers.read")
    public PlanningWeekService.View read(@PathVariable String chantierId,@PathVariable LocalDate start){return service.read(chantierId,start);}
    @PostMapping("/{action}") @RequirePermission("chantiers.update")
    public PlanningWeekService.View command(@PathVariable String chantierId,@PathVariable LocalDate start,@PathVariable String action,@RequestBody PlanningWeekService.Command body){return service.command(chantierId,start,action,body);}
}
