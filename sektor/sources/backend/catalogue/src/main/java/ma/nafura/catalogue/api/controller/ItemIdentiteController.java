package ma.nafura.catalogue.api.controller;

import jakarta.validation.Valid;
import ma.nafura.catalogue.api.dto.ItemFournisseurBindDto;
import ma.nafura.catalogue.api.request.ItemFournisseurRefDto;
import ma.nafura.catalogue.domain.article.Item;
import ma.nafura.catalogue.service.ItemService;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Identité catalogue — hors {@link ItemController} pour que Hibernate Validator
 * ne bloque pas extraire-creer / search si ce DTO manque au classpath.
 */
@RestController
@RequestMapping("/api/v1/items")
@SecuredResource(domain = "item", feature = "item", resource = "item")
public class ItemIdentiteController {

    private final ItemService service;

    public ItemIdentiteController(ItemService service) {
        this.service = service;
    }

    /**
     * Pointe une ref fournisseur sur l'identité existante. Ne crée jamais d'Item.
     */
    @PostMapping("/identites/{cleStable}/fournisseur-ref")
    public ResponseEntity<ItemFournisseurBindDto> bindFournisseurRef(
            @PathVariable String cleStable, @Valid @RequestBody ItemFournisseurRefDto body) {
        Item item = service.bindFournisseurRef(cleStable, body.getRefFournisseur());
        return ResponseEntity.ok(new ItemFournisseurBindDto(
                item.getId().toString(),
                item.getCleStable(),
                body.getRefFournisseur().trim(),
                false));
    }
}