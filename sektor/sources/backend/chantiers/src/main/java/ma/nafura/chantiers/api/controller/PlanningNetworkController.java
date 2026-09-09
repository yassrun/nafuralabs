package ma.nafura.chantiers.api.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import ma.nafura.chantiers.service.PlanningNetworkService;
import ma.nafura.platform.authorization.security.authorization.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/chantiers/{chantierId}/planning-network")
@SecuredResource(domain="chantiers",feature="chantiers",resource="chantier-activite")
public class PlanningNetworkController {
    private final PlanningNetworkService service;
    public PlanningNetworkController(PlanningNetworkService service) {this.service=service;}
    public record ApplyRequest(@NotBlank String token) {}
    @GetMapping @RequirePermission("chantiers.read")
    public PlanningNetworkService.Simulation simulate(@PathVariable String chantierId) {return service.simulate(chantierId);}
    @PostMapping("/apply") @RequirePermission("chantiers.update")
    public PlanningNetworkService.Simulation apply(@PathVariable String chantierId,@Valid @RequestBody ApplyRequest request) {
        return service.apply(chantierId,request.token());
    }
}
