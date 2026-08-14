package ma.nafura.platform.settings.api.response;

import ma.nafura.platform.settings.domain.model.SettingValueType;

public record ResolvedSettingResponse(
        String settingKey,
        String applicationId,
        SettingValueType valueType,
        String value,
        String resolvedFromScope,
        String scopeKey,
        boolean defaultValueUsed
) {
}

