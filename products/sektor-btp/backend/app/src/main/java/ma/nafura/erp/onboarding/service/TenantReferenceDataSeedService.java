package ma.nafura.erp.onboarding.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.currency.domain.model.Currency;
import ma.nafura.currency.repository.CurrencyRepository;
import ma.nafura.item.domain.model.ItemCategory;
import ma.nafura.item.domain.model.ItemType;
import ma.nafura.item.domain.model.UoMCategory;
import ma.nafura.item.domain.model.UnitOfMeasure;
import ma.nafura.item.repository.ItemCategoryRepository;
import ma.nafura.item.repository.ItemTypeRepository;
import ma.nafura.item.repository.UoMCategoryRepository;
import ma.nafura.item.repository.UnitOfMeasureRepository;
import ma.nafura.stock.domain.model.CostingMethod;
import ma.nafura.stock.domain.model.MovementMotif;
import ma.nafura.stock.repository.CostingMethodRepository;
import ma.nafura.stock.repository.MovementMotifRepository;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeds ERP reference master data for a new tenant during onboarding preset.
 * Idempotent: only inserts missing rows per tenant (never overwrites user edits).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TenantReferenceDataSeedService {

    private static final String REFERENCE_DATA_RESOURCE = "onboarding/reference-data.json";

    private final UoMCategoryRepository uomCategoryRepository;
    private final UnitOfMeasureRepository unitOfMeasureRepository;
    private final ItemTypeRepository itemTypeRepository;
    private final ItemCategoryRepository itemCategoryRepository;
    private final CostingMethodRepository costingMethodRepository;
    private final MovementMotifRepository movementMotifRepository;
    private final CurrencyRepository currencyRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public void seedReferenceData(UUID tenantId) {
        JsonNode root = loadReferenceData();
        seedUomCategories(tenantId, root.get("uomCategories"));
        Map<String, UUID> categoryIds = categoryIdsByCode(tenantId);
        seedUnitsOfMeasure(tenantId, root.get("unitsOfMeasure"), categoryIds);
        seedItemTypes(tenantId, root.get("itemTypes"));
        seedItemCategories(tenantId, root.get("itemCategories"));
        seedCostingMethods(tenantId, root.get("costingMethods"));
        seedMovementMotifs(tenantId, root.get("movementMotifs"));
        seedCurrencies(tenantId, root.get("currencies"));
        log.info("Reference master data seeded for tenant={}", tenantId);
    }

    private JsonNode loadReferenceData() {
        try (InputStream in = new ClassPathResource(REFERENCE_DATA_RESOURCE).getInputStream()) {
            return objectMapper.readTree(in);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to load " + REFERENCE_DATA_RESOURCE, ex);
        }
    }

    private void seedUomCategories(UUID tenantId, JsonNode nodes) {
        if (nodes == null || !nodes.isArray()) {
            return;
        }
        for (JsonNode node : nodes) {
            String code = text(node, "code");
            if (code == null || existsUomCategory(tenantId, code)) {
                continue;
            }
            uomCategoryRepository.save(UoMCategory.builder()
                .tenantId(tenantId)
                .code(code)
                .name(text(node, "name"))
                .description(text(node, "description"))
                .isActive(true)
                .build());
        }
    }

    private void seedUnitsOfMeasure(UUID tenantId, JsonNode nodes, Map<String, UUID> categoryIds) {
        if (nodes == null || !nodes.isArray()) {
            return;
        }
        for (JsonNode node : nodes) {
            String code = text(node, "code");
            if (code == null || existsUnit(tenantId, code)) {
                continue;
            }
            String categoryCode = text(node, "categoryCode");
            UUID categoryId = categoryCode != null ? categoryIds.get(categoryCode.toUpperCase()) : null;
            unitOfMeasureRepository.save(UnitOfMeasure.builder()
                .tenantId(tenantId)
                .code(code)
                .name(text(node, "name"))
                .uomCategoryId(categoryId)
                .isActive(true)
                .build());
        }
    }

    private void seedItemTypes(UUID tenantId, JsonNode nodes) {
        if (nodes == null || !nodes.isArray()) {
            return;
        }
        for (JsonNode node : nodes) {
            String code = text(node, "code");
            if (code == null || existsItemType(tenantId, code)) {
                continue;
            }
            itemTypeRepository.save(ItemType.builder()
                .tenantId(tenantId)
                .code(code)
                .name(text(node, "name"))
                .description(text(node, "description"))
                .isActive(true)
                .build());
        }
    }

    private void seedItemCategories(UUID tenantId, JsonNode nodes) {
        if (nodes == null || !nodes.isArray()) {
            return;
        }
        for (JsonNode node : nodes) {
            String code = text(node, "code");
            if (code == null || existsItemCategory(tenantId, code)) {
                continue;
            }
            itemCategoryRepository.save(ItemCategory.builder()
                .tenantId(tenantId)
                .code(code)
                .name(text(node, "name"))
                .description(text(node, "description"))
                .isActive(true)
                .build());
        }
    }

    private void seedCostingMethods(UUID tenantId, JsonNode nodes) {
        if (nodes == null || !nodes.isArray()) {
            return;
        }
        for (JsonNode node : nodes) {
            String code = text(node, "code");
            if (code == null || existsCostingMethod(tenantId, code)) {
                continue;
            }
            costingMethodRepository.save(CostingMethod.builder()
                .tenantId(tenantId)
                .code(code)
                .name(text(node, "name"))
                .method(text(node, "method"))
                .description(text(node, "description"))
                .allowNegativeStock(node.path("allowNegativeStock").asBoolean(false))
                .status(text(node, "status", "Active"))
                .build());
        }
    }

    private void seedMovementMotifs(UUID tenantId, JsonNode nodes) {
        if (nodes == null || !nodes.isArray()) {
            return;
        }
        for (JsonNode node : nodes) {
            String code = text(node, "code");
            if (code == null || existsMovementMotif(tenantId, code)) {
                continue;
            }
            movementMotifRepository.save(MovementMotif.builder()
                .tenantId(tenantId)
                .code(code)
                .name(text(node, "name"))
                .txType(text(node, "txType"))
                .isActive(true)
                .build());
        }
    }

    private void seedCurrencies(UUID tenantId, JsonNode nodes) {
        if (nodes == null || !nodes.isArray()) {
            return;
        }
        for (JsonNode node : nodes) {
            String code = text(node, "code");
            if (code == null || existsCurrency(tenantId, code)) {
                continue;
            }
            currencyRepository.save(Currency.builder()
                .tenantId(tenantId)
                .code(code)
                .name(text(node, "name"))
                .symbol(text(node, "symbol"))
                .decimalPlaces(node.path("decimalPlaces").asInt(2))
                .isActive(true)
                .isReference(node.path("isReference").asBoolean(false))
                .build());
        }
    }

    private Map<String, UUID> categoryIdsByCode(UUID tenantId) {
        Map<String, UUID> map = new HashMap<>();
        for (UoMCategory category : uomCategoryRepository.findByTenantId(tenantId)) {
            if (category.getCode() != null) {
                map.put(category.getCode().toUpperCase(), category.getId());
            }
        }
        return map;
    }

    private boolean existsUomCategory(UUID tenantId, String code) {
        return uomCategoryRepository.findByTenantId(tenantId).stream()
            .anyMatch(row -> code.equalsIgnoreCase(row.getCode()));
    }

    private boolean existsUnit(UUID tenantId, String code) {
        return unitOfMeasureRepository.findByTenantId(tenantId).stream()
            .anyMatch(row -> code.equalsIgnoreCase(row.getCode()));
    }

    private boolean existsItemType(UUID tenantId, String code) {
        return itemTypeRepository.findByTenantId(tenantId).stream()
            .anyMatch(row -> code.equalsIgnoreCase(row.getCode()));
    }

    private boolean existsItemCategory(UUID tenantId, String code) {
        return itemCategoryRepository.findByTenantId(tenantId).stream()
            .anyMatch(row -> code.equalsIgnoreCase(row.getCode()));
    }

    private boolean existsCostingMethod(UUID tenantId, String code) {
        return costingMethodRepository.findByTenantId(tenantId).stream()
            .anyMatch(row -> code.equalsIgnoreCase(row.getCode()));
    }

    private boolean existsMovementMotif(UUID tenantId, String code) {
        return movementMotifRepository.findByTenantId(tenantId).stream()
            .anyMatch(row -> code.equalsIgnoreCase(row.getCode()));
    }

    private boolean existsCurrency(UUID tenantId, String code) {
        return currencyRepository.findByTenantId(tenantId).stream()
            .anyMatch(row -> code.equalsIgnoreCase(row.getCode()));
    }

    private static String text(JsonNode node, String field) {
        return text(node, field, null);
    }

    private static String text(JsonNode node, String field, String defaultValue) {
        if (node == null || !node.has(field) || node.get(field).isNull()) {
            return defaultValue;
        }
        String value = node.get(field).asText();
        return value.isBlank() ? defaultValue : value;
    }
}
