package ma.nafura.etudes.service.port;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import ma.nafura.etudes.api.dto.CatalogCandidateDto;
import ma.nafura.item.domain.model.Item;
import ma.nafura.item.repository.ItemRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class ItemCatalogResolver implements CatalogResolverPort {

    private final ItemRepository itemRepository;

    public ItemCatalogResolver(ItemRepository itemRepository) {
        this.itemRepository = itemRepository;
    }

    @Override
    public List<CatalogCandidateDto> resolve(String designation, String type, int limit) {
        UUID tenantId = TenantContext.getTenantId();
        int safeLimit = limit > 0 ? Math.min(limit, 50) : 10;
        String term = designation != null ? designation.trim().toLowerCase(Locale.ROOT) : "";

        Specification<Item> spec = (root, query, cb) -> {
            List<Predicate> preds = new ArrayList<>();
            preds.add(cb.equal(root.get("tenantId"), tenantId));
            if (StringUtils.hasText(term)) {
                String like = "%" + term + "%";
                preds.add(cb.or(
                        cb.like(cb.lower(root.get("name")), like),
                        cb.like(cb.lower(root.get("code")), like)));
            }
            return cb.and(preds.toArray(new Predicate[0]));
        };

        return itemRepository.findAll(spec, PageRequest.of(0, safeLimit)).getContent().stream()
                .map(item -> CatalogCandidateDto.builder()
                        .itemId(item.getId().toString())
                        .code(item.getCode())
                        .name(item.getName())
                        .articleType(item.getArticleType())
                        .score(score(term, item))
                        .build())
                .toList();
    }

    private Double score(String term, Item item) {
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
