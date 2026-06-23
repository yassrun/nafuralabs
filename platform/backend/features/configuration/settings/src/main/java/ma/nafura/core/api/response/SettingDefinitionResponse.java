package ma.nafura.platform.settings.api.response;

import ma.nafura.platform.settings.domain.model.SettingOwnerLevel;
import ma.nafura.platform.settings.domain.model.SettingScopeType;
import ma.nafura.platform.settings.domain.model.SettingValueType;

import java.util.Set;

public record SettingDefinitionResponse(
        String settingKey,
        SettingOwnerLevel ownerLevel,
        String applicationId,
        String domainCode,
        String featureCode,
        SettingValueType valueType,
        String defaultValue,
        String description,
        boolean secret,
        boolean mutable,
        boolean active,
        Set<SettingScopeType> supportedScopes
) {
}

