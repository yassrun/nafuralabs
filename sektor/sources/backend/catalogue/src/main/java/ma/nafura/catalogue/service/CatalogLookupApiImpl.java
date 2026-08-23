package ma.nafura.catalogue.service;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.catalogue.api.CatalogCandidate;
import ma.nafura.catalogue.api.CatalogItemSnapshot;
import ma.nafura.catalogue.api.CatalogLookupApi;
import ma.nafura.catalogue.api.CatalogPriceContext;
import ma.nafura.catalogue.api.CatalogPriceSnapshot;
import ma.nafura.catalogue.api.IdentiteClasse;
import ma.nafura.catalogue.domain.article.Item;
import ma.nafura.catalogue.domain.article.UnitOfMeasure;
import ma.nafura.catalogue.repository.ItemRepository;
import ma.nafura.catalogue.repository.UnitOfMeasureRepository;
import ma.nafura.catalogue.service.ItemService;
import ma.nafura.catalogue.service.prix.ContexteResolution;
import ma.nafura.catalogue.service.prix.PrixResolu;
import ma.nafura.catalogue.service.prix.ResolutionPrixService;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class CatalogLookupApiImpl implements CatalogLookupApi {

    private final ItemRepository itemRepository;
    private final UnitOfMeasureRepository unitOfMeasureRepository;
    private final ResolutionPrixService resolutionPrixService;
    private final ItemService itemService;
    private final ExtraireIdentiteService extraireIdentiteService;

    public CatalogLookupApiImpl(
            ItemRepository itemRepository,
            UnitOfMeasureRepository unitOfMeasureRepository,
            ResolutionPrixService resolutionPrixService,
            ItemService itemService,
            ExtraireIdentiteService extraireIdentiteService) {
        this.itemRepository = itemRepository;
        this.unitOfMeasureRepository = unitOfMeasureRepository;
        this.resolutionPrixService = resolutionPrixService;
        this.itemService = itemService;
        this.extraireIdentiteService = extraireIdentiteService;
    }

    @Override
    public List<CatalogCandidate> lookup(String designation, String nature, int limit) {
        UUID tenantId = TenantContext.getTenantId();
        int safeLimit = limit > 0 ? Math.min(limit, 50) : 10;
        String term = designation != null ? designation.trim().toLowerCase(Locale.ROOT) : "";
        String natureFilter = StringUtils.hasText(nature) ? nature.trim() : null;

        Specification<Item> spec = (root, query, cb) -> {
            List<Predicate> preds = new ArrayList<>();
            preds.add(cb.equal(root.get("tenantId"), tenantId));
            preds.add(cb.or(cb.isTrue(root.get("isActive")), cb.isNull(root.get("isActive"))));
            if (natureFilter != null) {
                preds.add(cb.equal(root.get("nature"), natureFilter));
            }
            if (StringUtils.hasText(term)) {
                String like = "%" + term + "%";
                preds.add(cb.or(
                        cb.like(cb.lower(root.get("name")), like),
                        cb.like(cb.lower(root.get("code")), like)));
            }
            return cb.and(preds.toArray(new Predicate[0]));
        };

        return itemRepository.findAll(spec, PageRequest.of(0, safeLimit)).getContent().stream()
                .map(item -> new CatalogCandidate(
                        item.getId().toString(),
                        item.getCode(),
                        item.getName(),
                        uniteOf(item),
                        item.getNature(),
                        score(term, item)))
                .toList();
    }

    @Override
    public Optional<CatalogItemSnapshot> getItem(UUID itemId) {
        if (itemId == null) {
            return Optional.empty();
        }
        return itemRepository
                .findByIdAndTenantId(itemId, TenantContext.getTenantId())
                .map(item -> new CatalogItemSnapshot(
                        item.getId().toString(),
                        item.getCode(),
                        item.getName(),
                        uniteOf(item),
                        item.getNature(),
                        item.getCleStable()));
    }

    @Override
    public CatalogPriceSnapshot resolvePurchasePrice(UUID itemId, CatalogPriceContext context) {
        if (itemId == null) {
            return null;
        }
        CatalogPriceContext ctx = context != null
                ? context
                : new CatalogPriceContext(null, null, null, null, null);
        ContexteResolution resoluCtx = new ContexteResolution(
                TenantContext.getTenantId(),
                ctx.referenceDate(),
                ctx.preferredSupplierId(),
                ctx.chantierId(),
                ctx.pivotCurrencyId(),
                ctx.pricingBase());
        PrixResolu resolu = resolutionPrixService.resoudrePrixAchat(itemId, resoluCtx);
        if (resolu == null) {
            return null;
        }
        return new CatalogPriceSnapshot(
                resolu.prixUnitaire(),
                resolu.sourcePrix(),
                resolu.sourceRefId(),
                resolu.dateSource(),
                resolu.currencyId(),
                resolu.libelleSource(),
                resolu.perime());
    }

    @Override
    public CatalogItemSnapshot createAllege(String libelle, String nature, String uomCode) {
        Item item = itemService.createAllege(libelle, nature, uomCode);
        return new CatalogItemSnapshot(
                item.getId().toString(),
                item.getCode(),
                item.getName(),
                uniteOf(item),
                item.getNature(),
                item.getCleStable());
    }

    @Override
    public Optional<CatalogItemSnapshot> findByCleStable(String cleStable) {
        if (!StringUtils.hasText(cleStable)) {
            return Optional.empty();
        }
        return itemRepository
                .findByTenantIdAndCleStable(TenantContext.getTenantId(), cleStable.trim())
                .map(item -> new CatalogItemSnapshot(
                        item.getId().toString(),
                        item.getCode(),
                        item.getName(),
                        uniteOf(item),
                        item.getNature(),
                        item.getCleStable()));
    }

    @Override
    public IdentiteClasse classerIdentite(String designation, String nature) {
        return extraireIdentiteService.classer(designation, nature);
    }

    @Override
    public List<String> listActiveUnitCodes() {
        UUID tenantId = TenantContext.getTenantIdOrNull();
        if (tenantId == null) {
            return List.of();
        }
        return unitOfMeasureRepository.findAll().stream()
                .filter(u -> tenantId.equals(u.getTenantId()))
                .filter(u -> u.getIsActive() == null || Boolean.TRUE.equals(u.getIsActive()))
                .map(UnitOfMeasure::getCode)
                .filter(c -> c != null && !c.isBlank())
                .map(String::trim)
                .distinct()
                .sorted()
                .toList();
    }

    private String uniteOf(Item item) {
        if (item.getUnitOfMeasureId() == null) {
            return null;
        }
        return unitOfMeasureRepository
                .findByIdAndTenantId(item.getUnitOfMeasureId(), item.getTenantId())
                .map(UnitOfMeasure::getCode)
                .orElse(null);
    }

    private static Double score(String term, Item item) {
        if (!StringUtils.hasText(term) || item.getName() == null) {
            return 0.0;
        }
        String name = item.getName().toLowerCase(Locale.ROOT);
        if (name.equals(term)) {
            return 1.0;
        }
        if (name.startsWith(term)) {
            return 0.8;
        }
        return 0.5;
    }
}
