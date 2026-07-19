package ma.nafura.consultation.service;

import java.util.List;
import java.util.Locale;
import java.util.UUID;
import ma.nafura.consultation.api.request.CreateItemRequest;
import ma.nafura.consultation.api.request.LinkItemRequest;
import ma.nafura.consultation.domain.model.ConsultationComposant;
import ma.nafura.consultation.domain.model.ConsultationNoeud;
import ma.nafura.consultation.repository.ConsultationComposantRepository;
import ma.nafura.consultation.repository.ConsultationNoeudRepository;
import ma.nafura.etudes.api.dto.CatalogCandidateDto;
import ma.nafura.etudes.service.port.CatalogResolverPort;
import ma.nafura.item.domain.model.Item;
import ma.nafura.item.domain.model.ItemType;
import ma.nafura.item.repository.ItemRepository;
import ma.nafura.item.repository.ItemTypeRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Bridges consultation nodes/composants to the {@code items} master catalog:
 * proposes candidates, links an existing item, or creates a new item and links it.
 */
@Service
public class CatalogLinkService {

    private static final String ARTICLE_TYPE_SERVICE = "PRESTATION";
    private static final String ARTICLE_TYPE_MATERIAU = "MATERIAU";

    private final CatalogResolverPort catalogResolverPort;
    private final ItemRepository itemRepository;
    private final ItemTypeRepository itemTypeRepository;
    private final ConsultationNoeudRepository noeudRepository;
    private final ConsultationComposantRepository composantRepository;

    public CatalogLinkService(
            CatalogResolverPort catalogResolverPort,
            ItemRepository itemRepository,
            ItemTypeRepository itemTypeRepository,
            ConsultationNoeudRepository noeudRepository,
            ConsultationComposantRepository composantRepository) {
        this.catalogResolverPort = catalogResolverPort;
        this.itemRepository = itemRepository;
        this.itemTypeRepository = itemTypeRepository;
        this.noeudRepository = noeudRepository;
        this.composantRepository = composantRepository;
    }

    @Transactional(readOnly = true)
    public List<CatalogCandidateDto> candidates(String designation, String type, int limit) {
        return catalogResolverPort.resolve(designation, type, limit);
    }

    @Transactional
    public ConsultationNoeud linkNoeud(UUID noeudId, LinkItemRequest request) {
        ConsultationNoeud noeud = requireNoeud(noeudId);
        Item item = requireItem(request.getItemId());
        noeud.setItemId(item.getId().toString());
        noeud.setItemCode(item.getCode());
        noeud.setItemName(item.getName());
        noeud.setItemStatus(ConsultationNoeud.ITEM_STATUS_LINKED);
        return noeudRepository.save(noeud);
    }

    @Transactional
    public ConsultationComposant linkComposant(UUID composantId, LinkItemRequest request) {
        ConsultationComposant composant = requireComposant(composantId);
        Item item = requireItem(request.getItemId());
        composant.setItemId(item.getId().toString());
        composant.setItemCode(item.getCode());
        composant.setItemName(item.getName());
        composant.setItemStatus(ConsultationNoeud.ITEM_STATUS_LINKED);
        return composantRepository.save(composant);
    }

    @Transactional
    public ConsultationNoeud createItemForNoeud(UUID noeudId, CreateItemRequest request) {
        ConsultationNoeud noeud = requireNoeud(noeudId);
        String name = StringUtils.hasText(request.getName()) ? request.getName().trim() : noeud.getLibelle();
        String unite = StringUtils.hasText(request.getUnite()) ? request.getUnite() : noeud.getUnite();
        Item item = createItem(name, request, unite, ARTICLE_TYPE_MATERIAU);
        noeud.setItemId(item.getId().toString());
        noeud.setItemCode(item.getCode());
        noeud.setItemName(item.getName());
        noeud.setItemStatus(ConsultationNoeud.ITEM_STATUS_LINKED);
        return noeudRepository.save(noeud);
    }

    @Transactional
    public ConsultationComposant createItemForComposant(UUID composantId, CreateItemRequest request) {
        ConsultationComposant composant = requireComposant(composantId);
        String name = StringUtils.hasText(request.getName())
                ? request.getName().trim()
                : composant.getDesignation();
        String unite = StringUtils.hasText(request.getUnite()) ? request.getUnite() : composant.getUnite();
        String defaultArticleType = ConsultationComposant.TYPE_SERVICE.equals(composant.getType())
                || ConsultationComposant.TYPE_SOUS_TRAITANCE.equals(composant.getType())
                ? ARTICLE_TYPE_SERVICE
                : ARTICLE_TYPE_MATERIAU;
        Item item = createItem(name, request, unite, defaultArticleType);
        composant.setItemId(item.getId().toString());
        composant.setItemCode(item.getCode());
        composant.setItemName(item.getName());
        composant.setItemStatus(ConsultationNoeud.ITEM_STATUS_LINKED);
        return composantRepository.save(composant);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private Item createItem(String name, CreateItemRequest request, String unite, String defaultArticleType) {
        UUID tenantId = tenantId();
        String articleType = StringUtils.hasText(request.getArticleType())
                ? request.getArticleType().trim().toUpperCase()
                : defaultArticleType;
        Item item = Item.builder()
                .tenantId(tenantId)
                .name(name)
                .code(trimOrNull(request.getCode()))
                .description(trimOrNull(request.getDescription()))
                .articleType(articleType)
                .itemTypeId(resolveItemTypeId(tenantId, articleType))
                .prixUnitaire(request.getPrixUnitaire())
                .isActive(true)
                .build();
        return itemRepository.save(item);
    }

    private UUID resolveItemTypeId(UUID tenantId, String articleType) {
        if (!StringUtils.hasText(articleType)) {
            return null;
        }
        String target = articleType.toLowerCase(Locale.ROOT);
        return itemTypeRepository.findByTenantId(tenantId).stream()
                .filter(t -> t.getCode() != null && t.getCode().toLowerCase(Locale.ROOT).equals(target))
                .map(ItemType::getId)
                .findFirst()
                .orElse(null);
    }

    private Item requireItem(String itemId) {
        UUID id;
        try {
            id = UUID.fromString(itemId);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid itemId");
        }
        return itemRepository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Item not found"));
    }

    private ConsultationNoeud requireNoeud(UUID id) {
        return noeudRepository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Noeud not found"));
    }

    private ConsultationComposant requireComposant(UUID id) {
        return composantRepository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Composant not found"));
    }

    private String trimOrNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
