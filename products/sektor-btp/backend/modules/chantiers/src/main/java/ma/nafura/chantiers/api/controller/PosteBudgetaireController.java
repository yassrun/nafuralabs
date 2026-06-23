package ma.nafura.chantiers.api.controller;

import jakarta.validation.Valid;
import java.util.List;
import ma.nafura.chantiers.api.request.PosteBudgetaireCreateDto;
import ma.nafura.chantiers.domain.model.PosteBudgetaire;
import ma.nafura.chantiers.service.PosteBudgetaireService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/lots/{lotId}/postes-budgetaires")
@SecuredResource(domain = "chantiers", feature = "chantiers", resource = "poste-budgetaire")
public class PosteBudgetaireController {

    private final PosteBudgetaireService service;

    public PosteBudgetaireController(PosteBudgetaireService service) {
        this.service = service;
    }

    @GetMapping
    @RequirePermission("chantiers.read")
    public ResponseEntity<List<PosteBudgetaire>> list(@PathVariable String lotId) {
        return ResponseEntity.ok(service.listByLot(lotId));
    }

    @PostMapping
    @RequirePermission("chantiers.create")
    public ResponseEntity<PosteBudgetaire> create(
            @PathVariable String lotId, @Valid @RequestBody PosteBudgetaireCreateDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(lotId, body));
    }
}
