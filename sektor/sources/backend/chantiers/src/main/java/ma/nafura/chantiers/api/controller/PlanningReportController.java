package ma.nafura.chantiers.api.controller;
import java.util.List;
import ma.nafura.chantiers.service.PlanningReportService;
import ma.nafura.platform.authorization.security.authorization.*;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/chantiers/{chantierId}/planning-reports")
@SecuredResource(domain="chantiers",feature="chantiers",resource="chantier-activite")
public class PlanningReportController {
    private final PlanningReportService service;
    public PlanningReportController(PlanningReportService service){this.service=service;}
    @GetMapping @RequirePermission("chantiers.read")
    public List<PlanningReportService.View> list(@PathVariable String chantierId){return service.list(chantierId);}
    @PostMapping("/preview") @RequirePermission("chantiers.read")
    public PlanningReportService.Preview preview(@PathVariable String chantierId,@RequestBody PlanningReportService.Request body){return service.preview(chantierId,body);}
    @PostMapping @RequirePermission("chantiers.update")
    public PlanningReportService.View propose(@PathVariable String chantierId,@RequestBody PlanningReportService.Propose body){return service.propose(chantierId,body);}
    @PostMapping("/{id}/decision") @RequirePermission("chantiers.update")
    public PlanningReportService.View decide(@PathVariable String chantierId,@PathVariable String id,@RequestBody PlanningReportService.Decide body){return service.decide(chantierId,id,body);}
}
