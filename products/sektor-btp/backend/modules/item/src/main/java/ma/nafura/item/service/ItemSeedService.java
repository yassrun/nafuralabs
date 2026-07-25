package ma.nafura.item.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import ma.nafura.item.domain.model.Item;
import ma.nafura.item.repository.ItemCategoryRepository;
import ma.nafura.item.repository.ItemRepository;
import ma.nafura.item.repository.ItemTypeRepository;
import ma.nafura.item.repository.UnitOfMeasureRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeds demo articles. Referentials (categories, types, units) come from the onboarding
 * reference data, so unresolved codes simply leave the link null rather than failing.
 */
@Service
public class ItemSeedService {

    private final ItemRepository repository;
    private final ItemCategoryRepository categoryRepository;
    private final ItemTypeRepository typeRepository;
    private final UnitOfMeasureRepository unitRepository;
    private final ObjectMapper objectMapper;

    public ItemSeedService(
            ItemRepository repository,
            ItemCategoryRepository categoryRepository,
            ItemTypeRepository typeRepository,
            UnitOfMeasureRepository unitRepository,
            ObjectMapper objectMapper) {
        this.repository = repository;
        this.categoryRepository = categoryRepository;
        this.typeRepository = typeRepository;
        this.unitRepository = unitRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = TenantContext.getTenantId();
        if (repository.countByTenantId(tenantId) > 0) {
            return;
        }
        Map<String, UUID> categories = new HashMap<>();
        categoryRepository.findByTenantId(tenantId).forEach(row -> categories.put(upper(row.getCode()), row.getId()));
        Map<String, UUID> types = new HashMap<>();
        typeRepository.findByTenantId(tenantId).forEach(row -> types.put(upper(row.getCode()), row.getId()));
        Map<String, UUID> units = new HashMap<>();
        unitRepository.findByTenantId(tenantId).forEach(row -> units.put(upper(row.getCode()), row.getId()));

        try (InputStream in = new ClassPathResource("seed/items-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("items")) {
                repository.save(Item.builder()
                        .tenantId(tenantId)
                        .code(node.get("code").asText())
                        .name(node.get("name").asText())
                        .description(textOrNull(node, "description"))
                        .itemCategoryId(lookup(categories, node, "itemCategoryCode"))
                        .itemTypeId(lookup(types, node, "itemTypeCode"))
                        .unitOfMeasureId(lookup(units, node, "unitOfMeasureCode"))
                        .articleType(textOrNull(node, "articleType"))
                        .prixUnitaire(decimalOrNull(node, "prixUnitaire"))
                        .pmp(decimalOrNull(node, "pmp"))
                        .stockMin(decimalOrNull(node, "stockMin"))
                        .stockMax(decimalOrNull(node, "stockMax"))
                        .delaiReapproJours(node.hasNonNull("delaiReapproJours")
                                ? node.get("delaiReapproJours").asInt()
                                : null)
                        .isActive(true)
                        .build());
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed items", ex);
        }
    }

    private static UUID lookup(Map<String, UUID> index, JsonNode node, String field) {
        String code = textOrNull(node, field);
        return code == null ? null : index.get(upper(code));
    }

    private static String upper(String value) {
        return value == null ? null : value.toUpperCase();
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }

    private static BigDecimal decimalOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? new BigDecimal(node.get(field).asText()) : null;
    }
}
