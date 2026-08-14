package ma.nafura.platform.settings.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import ma.nafura.platform.settings.api.request.CreateSettingDefinitionRequest;
import ma.nafura.platform.settings.api.request.UpsertSettingValueRequest;
import ma.nafura.platform.settings.api.response.ResolvedSettingResponse;
import ma.nafura.platform.settings.api.response.SettingDefinitionResponse;
import ma.nafura.platform.settings.api.response.SettingValueResponse;
import ma.nafura.platform.settings.domain.model.SettingDefinition;
import ma.nafura.platform.settings.domain.model.SettingDefinitionScope;
import ma.nafura.platform.settings.domain.model.SettingScopeType;
import ma.nafura.platform.settings.domain.model.SettingValue;
import ma.nafura.platform.settings.domain.model.SettingValueType;
import ma.nafura.platform.settings.repository.SettingDefinitionRepository;
import ma.nafura.platform.settings.repository.SettingDefinitionScopeRepository;
import ma.nafura.platform.settings.repository.SettingValueRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SettingsService {

    private static final Pattern KEY_PATTERN = Pattern.compile("^[a-z][a-z0-9_.-]*$");

    private final SettingDefinitionRepository settingDefinitionRepository;
    private final SettingDefinitionScopeRepository settingDefinitionScopeRepository;
    private final SettingValueRepository settingValueRepository;
    private final ObjectMapper objectMapper;

    @Value("${nafura.application.id:unknown}")
    private String defaultApplicationId;

    @Transactional
    public SettingDefinitionResponse createDefinition(CreateSettingDefinitionRequest request) {
        String settingKey = normalizeSettingKey(request.getSettingKey());
        validateSettingKey(settingKey);

        if (settingDefinitionRepository.existsBySettingKey(settingKey)) {
            throw new IllegalStateException("Setting definition already exists: " + settingKey);
        }

        SettingDefinition definition = SettingDefinition.builder()
                .settingKey(settingKey)
                .ownerLevel(request.getOwnerLevel())
                .applicationId(normalizeNullable(request.getApplicationId()))
                .domainCode(normalizeNullable(request.getDomainCode()))
                .featureCode(normalizeNullable(request.getFeatureCode()))
                .valueType(request.getValueType())
                .defaultValue(normalizeDefaultValue(request.getValueType(), request.getDefaultValue()))
                .description(normalizeNullable(request.getDescription()))
                .secret(Boolean.TRUE.equals(request.getSecret()))
                .mutable(request.getMutable() == null || request.getMutable())
                .active(request.getActive() == null || request.getActive())
                .build();

        SettingDefinition savedDefinition = settingDefinitionRepository.save(definition);

        Set<SettingScopeType> scopes = normalizeScopes(request.getSupportedScopes());
        for (SettingScopeType scope : scopes) {
            settingDefinitionScopeRepository.save(SettingDefinitionScope.builder()
                    .settingKey(settingKey)
                    .scopeType(scope)
                    .build());
        }

        return toDefinitionResponse(savedDefinition, scopes);
    }

    @Transactional(readOnly = true)
    public List<SettingDefinitionResponse> listDefinitions() {
        List<SettingDefinition> definitions = settingDefinitionRepository.findAll().stream()
                .sorted(Comparator.comparing(SettingDefinition::getSettingKey))
                .toList();

        Map<String, Set<SettingScopeType>> scopesByKey = loadScopesBySettingKeys(
                definitions.stream().map(SettingDefinition::getSettingKey).toList());

        return definitions.stream()
                .map(definition -> toDefinitionResponse(
                        definition,
                        scopesByKey.getOrDefault(definition.getSettingKey(), Set.of(SettingScopeType.APPLICATION))))
                .toList();
    }

    @Transactional(readOnly = true)
    public SettingDefinitionResponse getDefinition(String settingKey) {
        String normalizedKey = normalizeSettingKey(settingKey);
        SettingDefinition definition = settingDefinitionRepository.findBySettingKey(normalizedKey)
                .orElseThrow(() -> new IllegalArgumentException("Setting definition not found: " + normalizedKey));
        Set<SettingScopeType> scopes = getSupportedScopes(normalizedKey);
        return toDefinitionResponse(definition, scopes);
    }

    @Transactional
    public SettingValueResponse upsertValue(String settingKey, UpsertSettingValueRequest request) {
        String normalizedKey = normalizeSettingKey(settingKey);
        validateSettingKey(normalizedKey);

        SettingDefinition definition = loadActiveDefinition(normalizedKey);
        if (!definition.isMutable()) {
            throw new IllegalStateException("Setting is not mutable: " + normalizedKey);
        }

        SettingScopeType scopeType = request.getScopeType();
        if (scopeType == null) {
            throw new IllegalArgumentException("scopeType is required");
        }
        ensureScopeSupported(normalizedKey, scopeType);

        String applicationId = normalizeApplicationId(request.getApplicationId());
        String scopeKey = buildScopeKey(scopeType, request.getTenantId(), request.getUserKey());
        String normalizedValue = normalizeValue(definition.getValueType(), request.getValue());
        String updatedBy = resolveUpdatedBy(request.getUpdatedBy());

        SettingValue value = settingValueRepository.findByApplicationIdAndSettingKeyAndScopeTypeAndScopeKey(
                        applicationId,
                        normalizedKey,
                        scopeType,
                        scopeKey)
                .orElseGet(() -> SettingValue.builder()
                        .applicationId(applicationId)
                        .settingKey(normalizedKey)
                        .scopeType(scopeType)
                        .scopeKey(scopeKey)
                        .build());

        value.setValue(normalizedValue);
        value.setUpdatedBy(updatedBy);
        SettingValue saved = settingValueRepository.save(value);

        return new SettingValueResponse(
                saved.getSettingKey(),
                saved.getApplicationId(),
                saved.getScopeType(),
                saved.getScopeKey(),
                saved.getValue(),
                saved.getUpdatedBy());
    }

    @Transactional(readOnly = true)
    public ResolvedSettingResponse resolve(
            String settingKey,
            String applicationId,
            UUID tenantId,
            String userKey) {
        String normalizedKey = normalizeSettingKey(settingKey);
        validateSettingKey(normalizedKey);

        SettingDefinition definition = loadActiveDefinition(normalizedKey);
        String normalizedApplicationId = normalizeApplicationId(applicationId);
        UUID effectiveTenantId = tenantId != null ? tenantId : TenantContext.getTenantIdOrNull();
        String effectiveUserKey = StringUtils.hasText(userKey) ? userKey.trim() : resolveCurrentUserKey();

        Set<SettingScopeType> scopes = getSupportedScopes(normalizedKey);

        for (ScopeCandidate candidate : buildResolutionCandidates(scopes, effectiveTenantId, effectiveUserKey)) {
            var value = settingValueRepository.findByApplicationIdAndSettingKeyAndScopeTypeAndScopeKey(
                    normalizedApplicationId,
                    normalizedKey,
                    candidate.scopeType(),
                    candidate.scopeKey());

            if (value.isPresent()) {
                return new ResolvedSettingResponse(
                        normalizedKey,
                        normalizedApplicationId,
                        definition.getValueType(),
                        value.get().getValue(),
                        candidate.scopeType().name(),
                        candidate.scopeKey(),
                        false
                );
            }
        }

        return new ResolvedSettingResponse(
                normalizedKey,
                normalizedApplicationId,
                definition.getValueType(),
                definition.getDefaultValue(),
                "DEFAULT",
                null,
                true
        );
    }

    private SettingDefinition loadActiveDefinition(String settingKey) {
        return settingDefinitionRepository.findBySettingKeyAndActiveTrue(settingKey)
                .orElseThrow(() -> new IllegalArgumentException("Active setting definition not found: " + settingKey));
    }

    private Set<SettingScopeType> getSupportedScopes(String settingKey) {
        List<SettingDefinitionScope> scopes = settingDefinitionScopeRepository.findBySettingKey(settingKey);
        if (scopes.isEmpty()) {
            return Set.of(SettingScopeType.APPLICATION);
        }
        return scopes.stream()
                .map(SettingDefinitionScope::getScopeType)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private Map<String, Set<SettingScopeType>> loadScopesBySettingKeys(Collection<String> settingKeys) {
        if (settingKeys.isEmpty()) {
            return Map.of();
        }
        return settingDefinitionScopeRepository.findBySettingKeyIn(settingKeys).stream()
                .collect(Collectors.groupingBy(
                        SettingDefinitionScope::getSettingKey,
                        Collectors.mapping(
                                SettingDefinitionScope::getScopeType,
                                Collectors.toCollection(LinkedHashSet::new))));
    }

    private void ensureScopeSupported(String settingKey, SettingScopeType scopeType) {
        if (!settingDefinitionScopeRepository.existsBySettingKeyAndScopeType(settingKey, scopeType)) {
            List<SettingDefinitionScope> scopes = settingDefinitionScopeRepository.findBySettingKey(settingKey);
            if (!scopes.isEmpty()) {
                throw new IllegalArgumentException(
                        "Scope " + scopeType + " is not supported for setting " + settingKey);
            }
            if (scopeType != SettingScopeType.APPLICATION) {
                throw new IllegalArgumentException(
                        "Scope " + scopeType + " is not supported for setting " + settingKey + " (default scope is APPLICATION)");
            }
        }
    }

    private List<ScopeCandidate> buildResolutionCandidates(
            Set<SettingScopeType> supportedScopes,
            UUID tenantId,
            String userKey) {
        List<ScopeCandidate> candidates = new ArrayList<>();

        if (tenantId != null && StringUtils.hasText(userKey) && supportedScopes.contains(SettingScopeType.TENANT_USER)) {
            candidates.add(new ScopeCandidate(
                    SettingScopeType.TENANT_USER,
                    buildScopeKey(SettingScopeType.TENANT_USER, tenantId, userKey)));
        }
        if (StringUtils.hasText(userKey) && supportedScopes.contains(SettingScopeType.USER)) {
            candidates.add(new ScopeCandidate(
                    SettingScopeType.USER,
                    buildScopeKey(SettingScopeType.USER, null, userKey)));
        }
        if (tenantId != null && supportedScopes.contains(SettingScopeType.TENANT)) {
            candidates.add(new ScopeCandidate(
                    SettingScopeType.TENANT,
                    buildScopeKey(SettingScopeType.TENANT, tenantId, null)));
        }
        if (supportedScopes.contains(SettingScopeType.APPLICATION)) {
            candidates.add(new ScopeCandidate(
                    SettingScopeType.APPLICATION,
                    buildScopeKey(SettingScopeType.APPLICATION, null, null)));
        }

        return candidates;
    }

    private String buildScopeKey(SettingScopeType scopeType, UUID tenantId, String userKey) {
        return switch (scopeType) {
            case APPLICATION -> "app";
            case TENANT -> {
                if (tenantId == null) {
                    throw new IllegalArgumentException("tenantId is required for TENANT scope");
                }
                yield "tenant:" + tenantId;
            }
            case USER -> {
                if (!StringUtils.hasText(userKey)) {
                    throw new IllegalArgumentException("userKey is required for USER scope");
                }
                yield "user:" + userKey.trim();
            }
            case TENANT_USER -> {
                if (tenantId == null || !StringUtils.hasText(userKey)) {
                    throw new IllegalArgumentException("tenantId and userKey are required for TENANT_USER scope");
                }
                yield "tenant:" + tenantId + "|user:" + userKey.trim();
            }
        };
    }

    private String normalizeValue(SettingValueType type, String value) {
        if (value == null) {
            return null;
        }
        String raw = value.trim();
        if (raw.isEmpty()) {
            return raw;
        }
        try {
            return switch (type) {
                case STRING -> value;
                case INTEGER -> Long.toString(Long.parseLong(raw));
                case DECIMAL -> new BigDecimal(raw).stripTrailingZeros().toPlainString();
                case BOOLEAN -> {
                    if (!"true".equalsIgnoreCase(raw) && !"false".equalsIgnoreCase(raw)) {
                        throw new IllegalArgumentException("Value must be true or false");
                    }
                    yield raw.toLowerCase();
                }
                case JSON -> objectMapper.writeValueAsString(objectMapper.readTree(raw));
            };
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid value for type " + type + ": " + e.getMessage());
        }
    }

    private String normalizeDefaultValue(SettingValueType type, String defaultValue) {
        if (defaultValue == null) {
            return null;
        }
        return normalizeValue(type, defaultValue);
    }

    private String normalizeSettingKey(String settingKey) {
        return settingKey == null ? null : settingKey.trim().toLowerCase();
    }

    private void validateSettingKey(String settingKey) {
        if (!StringUtils.hasText(settingKey) || !KEY_PATTERN.matcher(settingKey).matches()) {
            throw new IllegalArgumentException("Invalid setting key: " + settingKey);
        }
    }

    private String normalizeApplicationId(String applicationId) {
        if (StringUtils.hasText(applicationId)) {
            return applicationId.trim().toLowerCase();
        }
        return defaultApplicationId != null ? defaultApplicationId.trim().toLowerCase() : "unknown";
    }

    private Set<SettingScopeType> normalizeScopes(Set<SettingScopeType> scopes) {
        if (scopes == null || scopes.isEmpty()) {
            return Set.of(SettingScopeType.APPLICATION);
        }
        return scopes;
    }

    private String resolveCurrentUserKey() {
        return UserContext.getUserEmail();
    }

    private String resolveUpdatedBy(String requestedUpdatedBy) {
        if (StringUtils.hasText(requestedUpdatedBy)) {
            return requestedUpdatedBy.trim();
        }
        String fromContext = resolveCurrentUserKey();
        return StringUtils.hasText(fromContext) ? fromContext : "system";
    }

    private String normalizeNullable(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private SettingDefinitionResponse toDefinitionResponse(SettingDefinition definition, Set<SettingScopeType> scopes) {
        return new SettingDefinitionResponse(
                definition.getSettingKey(),
                definition.getOwnerLevel(),
                definition.getApplicationId(),
                definition.getDomainCode(),
                definition.getFeatureCode(),
                definition.getValueType(),
                definition.getDefaultValue(),
                definition.getDescription(),
                definition.isSecret(),
                definition.isMutable(),
                definition.isActive(),
                scopes);
    }

    private record ScopeCandidate(SettingScopeType scopeType, String scopeKey) {
    }
}


