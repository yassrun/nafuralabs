package ma.nafura.chantiers.api.controller;
import java.util.List;
import ma.nafura.chantiers.service.PlanningPublicationService;
import ma.nafura.platform.authorization.security.authorization.*;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1/chantiers/{chantierId}/planning-publications")
@SecuredResource(domain="chantiers",feature="chantiers",resource="chantier-activite")
public class PlanningPublicationController {
    private final PlanningPublicationService service;
    public PlanningPublicationController(PlanningPublicationService service){this.service=service;}
    @GetMapping @RequirePermission("chantiers.read")
    public List<PlanningPublicationService.Version> list(@PathVariable String chantierId){return service.list(chantierId);}
    @PostMapping("/preview") @RequirePermission("chantiers.read")
    public PlanningPublicationService.Preview preview(@PathVariable String chantierId,@RequestBody PlanningPublicationService.Options body){return service.preview(chantierId,body);}
    @PostMapping @RequirePermission("chantiers.update")
    public PlanningPublicationService.Version publish(@PathVariable String chantierId,@RequestBody PlanningPublicationService.Publish body){return service.publish(chantierId,body);}
    @PostMapping("/{id}/acknowledgements") @RequirePermission("chantiers.update")
    public PlanningPublicationService.Version acknowledge(@PathVariable String chantierId,@PathVariable String id,@RequestBody PlanningPublicationService.Acknowledge body){return service.acknowledge(chantierId,id,body);}
}
