package ma.nafura.catalogue.seeders;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.finance.domain.devise.Currency;
import ma.nafura.finance.repository.CurrencyRepository;
import ma.nafura.catalogue.domain.article.Item;
import ma.nafura.catalogue.domain.article.ItemCategory;
import ma.nafura.catalogue.domain.article.UoMCategory;
import ma.nafura.catalogue.domain.article.UnitOfMeasure;
import ma.nafura.catalogue.repository.ItemCategoryRepository;
import ma.nafura.catalogue.repository.ItemRepository;
import ma.nafura.catalogue.repository.UoMCategoryRepository;
import ma.nafura.catalogue.repository.UnitOfMeasureRepository;
import ma.nafura.sektor.socle.port.bc.CatalogueOnboardingPort;
import ma.nafura.catalogue.domain.stock.CostingMethod;
import ma.nafura.catalogue.domain.stock.Location;
import ma.nafura.catalogue.domain.stock.MovementMotif;
import ma.nafura.catalogue.repository.CostingMethodRepository;
import ma.nafura.catalogue.repository.LocationRepository;
import ma.nafura.catalogue.repository.MovementMotifRepository;
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
public class TenantReferenceDataSeedService implements CatalogueOnboardingPort {

    private static final String REFERENCE_DATA_RESOURCE = "onboarding/reference-data.json";

    private final UoMCategoryRepository uomCategoryRepository;
    private final UnitOfMeasureRepository unitOfMeasureRepository;
    private final ItemCategoryRepository itemCategoryRepository;
    private final CostingMethodRepository costingMethodRepository;
    private final MovementMotifRepository movementMotifRepository;
    private final LocationRepository locationRepository;
    private final CurrencyRepository currencyRepository;
    private final ItemRepository itemRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public void seedReferenceData(UUID tenantId) {
        JsonNode root = loadReferenceData();
        seedUomCategories(tenantId, root.get("uomCategories"));
        Map<String, UUID> categoryIds = categoryIdsByCode(tenantId);
        seedUnitsOfMeasure(tenantId, root.get("unitsOfMeasure"), categoryIds);
        seedItemCategories(tenantId, root.get("itemCategories"));
        seedCostingMethods(tenantId, root.get("costingMethods"));
        seedLocations(tenantId, root.get("locations"));
        seedMovementMotifs(tenantId, root.get("movementMotifs"));
        seedCurrencies(tenantId, root.get("currencies"));
        log.info("Reference master data seeded for tenant={}", tenantId);
    }

    @Override
    @Transactional
    public void seedArticles(UUID tenantId, String secteur) {
        if (itemRepository.countByTenantId(tenantId) > 0) {
            return;
        }
        String resource = switch (normalizeSecteur(secteur)) {
            case "TP" -> "onboarding/articles-tp.json";
            case "VRD" -> "onboarding/articles-vrd.json";
            default -> "onboarding/articles-batiment.json";
        };
        try (InputStream in = new ClassPathResource(resource).getInputStream()) {
            List<JsonNode> nodes = objectMapper.readValue(in, new TypeReference<>() {});
            for (JsonNode node : nodes) {
                itemRepository.save(Item.builder()
                    .tenantId(tenantId)
                    .code(node.get("code").asText())
                    .name(node.get("name").asText())
                    .description(node.has("description") ? node.get("description").asText() : null)
                    .isActive(true)
                    .build());
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed articles from " + resource, ex);
        }
    }

    @Override
    public boolean hasArticles(UUID tenantId) {
        return itemRepository.countByTenantId(tenantId) > 0;
    }

    private static String normalizeSecteur(String secteur) {
        if (secteur == null) {
            return "BATIMENT";
        }
        return secteur.trim().toUpperCase(Locale.ROOT);
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
                .facteurVersBase(decimal(node, "facteurVersBase", java.math.BigDecimal.ONE))
                .estBase(bool(node, "estBase", false))
                .isActive(true)
                .build());
        }
    }

    private java.math.BigDecimal decimal(JsonNode node, String field, java.math.BigDecimal defaultValue) {
        if (node == null || !node.has(field) || node.get(field).isNull()) {
            return defaultValue;
        }
        return node.get(field).decimalValue();
    }

    private boolean bool(JsonNode node, String field, boolean defaultValue) {
        if (node == null || !node.has(field) || node.get(field).isNull()) {
            return defaultValue;
        }
        return node.get(field).asBoolean(defaultValue);
    }

    private void seedItemCategories(UUID tenantId, JsonNode nodes) {
        if (nodes == null || !nodes.isArray()) {
            return;
        }
        // Pass 1 — insert missing categories without parent (roots first, then orphans).
        for (JsonNode node : nodes) {
            String code = text(node, "code");
            if (code == null) {
                continue;
            }
            if (existsItemCategory(tenantId, code)) {
                // Legacy EPI kept inactive by §5.3 — reactivate as taxonomy root.
                if ("EPI".equalsIgnoreCase(code)) {
                    itemCategoryRepository.findByTenantId(tenantId).stream()
                        .filter(row -> code.equalsIgnoreCase(row.getCode()))
                        .findFirst()
                        .ifPresent(row -> {
                            row.setName(text(node, "name"));
                            row.setDescription(text(node, "description"));
                            row.setIsActive(true);
                            itemCategoryRepository.save(row);
                        });
                }
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
        // Pass 2 — resolve parentCode → parentId (idempotent for existing rows).
        Map<String, UUID> idsByCode = itemCategoryIdsByCode(tenantId);
        for (JsonNode node : nodes) {
            String code = text(node, "code");
            String parentCode = text(node, "parentCode");
            if (code == null || parentCode == null) {
                continue;
            }
            UUID id = idsByCode.get(code.toUpperCase());
            UUID parentId = idsByCode.get(parentCode.toUpperCase());
            if (id == null || parentId == null) {
                continue;
            }
            itemCategoryRepository.findByIdAndTenantId(id, tenantId).ifPresent(row -> {
                if (parentId.equals(row.getParentId())) {
                    return;
                }
                row.setParentId(parentId);
                itemCategoryRepository.save(row);
            });
        }
    }

    private Map<String, UUID> itemCategoryIdsByCode(UUID tenantId) {
        Map<String, UUID> map = new HashMap<>();
        for (ItemCategory category : itemCategoryRepository.findByTenantId(tenantId)) {
            if (category.getCode() != null) {
                map.put(category.getCode().toUpperCase(), category.getId());
            }
        }
        return map;
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

    private void seedLocations(UUID tenantId, JsonNode nodes) {
        if (nodes == null || !nodes.isArray()) {
            return;
        }
        for (JsonNode node : nodes) {
            String code = text(node, "code");
            if (code == null || existsLocation(tenantId, code)) {
                continue;
            }
            locationRepository.save(Location.builder()
                .tenantId(tenantId)
                .code(code)
                .name(text(node, "name"))
                .type(text(node, "type", "DEPOT"))
                .isPhysical(node.path("isPhysical").asBoolean(true))
                .affectsStock(node.path("affectsStock").asBoolean(true))
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

    private boolean existsLocation(UUID tenantId, String code) {
        return locationRepository.findByTenantIdAndCode(tenantId, code).isPresent();
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
