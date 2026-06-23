package ma.nafura.chantiers.api.controller;

import jakarta.validation.Valid;
import ma.nafura.chantiers.api.request.PosteBudgetaireUpdateDto;
import ma.nafura.chantiers.domain.model.PosteBudgetaire;
import ma.nafura.chantiers.service.PosteBudgetaireService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/postes-budgetaires")
@SecuredResource(domain = "chantiers", feature = "chantiers", resource = "poste-budgetaire")
public class PosteBudgetaireUpdateController {

    private final PosteBudgetaireService service;

    public PosteBudgetaireUpdateController(PosteBudgetaireService service) {
        this.service = service;
    }

    @PutMapping("/{id}")
    @RequirePermission("chantiers.update")
    public ResponseEntity<PosteBudgetaire> update(
            @PathVariable String id, @Valid @RequestBody PosteBudgetaireUpdateDto body) {
        return ResponseEntity.ok(service.update(id, body));
    }
}
