package ma.nafura.chantiers.api.controller;
import java.security.Principal;
import ma.nafura.chantiers.domain.activite.PlanningNeed;
import ma.nafura.chantiers.service.PlanningNeedService;
import ma.nafura.platform.authorization.security.authorization.*;
import org.springframework.web.bind.annotation.*;

/** Purchase permission plus chantier edit policy in service. Always creates a draft. */
@RestController
@RequestMapping("/api/v1/chantiers/{chantierId}/activites/{activityId}/needs/{needId}/purchase")
@SecuredResource(domain="achats",feature="achats",resource="demande-achat")
public class PlanningPurchaseController {
    private final PlanningNeedService service;
    public PlanningPurchaseController(PlanningNeedService service){this.service=service;}
    @PostMapping @RequirePermission("create")
    public PlanningNeed prepare(@PathVariable String chantierId,@PathVariable String activityId,@PathVariable String needId,Principal principal) {
        if(principal==null) throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED);
        return service.preparePurchase(chantierId,activityId,needId,principal.getName());
    }
}
