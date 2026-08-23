package ma.nafura.catalogue.api.controller;

import jakarta.validation.Valid;
import java.util.UUID;
import ma.nafura.catalogue.api.CatalogLookupApi;
import ma.nafura.catalogue.api.IdentiteClasse;
import ma.nafura.catalogue.api.controller.base.ItemControllerBase;
import ma.nafura.catalogue.api.dto.ExtraireCreerDto;
import ma.nafura.catalogue.api.dto.ExtraireCreerRequest;
import ma.nafura.catalogue.api.dto.IdentiteClasserRequest;
import ma.nafura.catalogue.api.dto.ItemFournisseurBindDto;
import ma.nafura.catalogue.api.request.ItemFournisseurRefDto;
import ma.nafura.catalogue.domain.article.Item;
import ma.nafura.catalogue.service.ExtraireCreationService;
import ma.nafura.catalogue.service.ItemService;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller for Item entity.
 * Generated once — safe for manual edits.
 * PMP is maintained by stock ValorisationService — no manual recalc endpoint.
 */
@RestController
@RequestMapping("/api/v1/items")
@SecuredResource(domain = "item", feature = "item", resource = "item")
public class ItemController extends ItemControllerBase {

    private final CatalogLookupApi catalogLookupApi;
    private final ExtraireCreationService extraireCreationService;

    public ItemController(
            ItemService service,
            CatalogLookupApi catalogLookupApi,
            ExtraireCreationService extraireCreationService) {
        super(service);
        this.catalogLookupApi = catalogLookupApi;
        this.extraireCreationService = extraireCreationService;
    }

    /**
     * Extraire : normalise une désignation vers une identité Sektor, puis un seau.
     * Ne persiste jamais.
     */
    @PostMapping("/classer-identite")
    public ResponseEntity<IdentiteClasse> classerIdentite(@RequestBody IdentiteClasserRequest body) {
        IdentiteClasse classe = catalogLookupApi.classerIdentite(
                body == null ? null : body.designation(),
                body == null ? null : body.nature());
        return ResponseEntity.ok(classe);
    }

    /**
     * Extraire — l'humain confirme : PUBLIER l'identité Sektor (pas candidat G2), puis Item 1–1.
     */
    @PostMapping("/extraire-creer")
    public ResponseEntity<ExtraireCreerDto> extraireCreer(@RequestBody ExtraireCreerRequest body) {
        ExtraireCreerRequest req = body != null ? body : new ExtraireCreerRequest(null, null, null, null);
        ExtraireCreerDto created = extraireCreationService.creer(
                req.designation(), req.nature(), req.uniteCode(), req.cleStable());
        return ResponseEntity.status(created.createdItem() || created.createdSektor()
                        ? HttpStatus.CREATED
                        : HttpStatus.OK)
                .body(created);
    }

    /**
     * Picker article — pas le listing CRUD. Sans q≥2 et sans filtre → page vide 200.
     */
    @GetMapping("/search")
    public ResponseEntity<Page<Item>> search(
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "nature", required = false) String nature,
            @RequestParam(value = "familleId", required = false) UUID familleId,
            @RequestParam(value = "usageLot", required = false) String usageLot,
            @RequestParam(value = "isActive", required = false) Boolean isActive,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        return ResponseEntity.ok(service.searchPicker(q, nature, familleId, usageLot, isActive, page, size));
    }

    @GetMapping("/identites/{cleStable}")
    public ResponseEntity<Item> byCleStable(@PathVariable String cleStable) {
        return service
                .findByCleStable(cleStable)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
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
