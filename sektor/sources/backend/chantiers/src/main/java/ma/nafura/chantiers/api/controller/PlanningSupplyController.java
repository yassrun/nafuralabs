package ma.nafura.chantiers.api.controller;

import java.util.List;
import ma.nafura.chantiers.service.PlanningSupplyService;
import ma.nafura.platform.authorization.security.authorization.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/chantiers/{chantierId}/planning-supplies")
@SecuredResource(domain="achats",feature="achats",resource="bon-commande-achat")
public class PlanningSupplyController {
    private final PlanningSupplyService service;
    public PlanningSupplyController(PlanningSupplyService service){this.service=service;}
    @GetMapping @RequirePermission("read")
    public List<PlanningSupplyService.Supply> read(@PathVariable String chantierId){return service.read(chantierId);}
}
