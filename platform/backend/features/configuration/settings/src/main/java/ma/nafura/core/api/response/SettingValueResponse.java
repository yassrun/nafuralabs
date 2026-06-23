package ma.nafura.platform.settings.api.response;

import ma.nafura.platform.settings.domain.model.SettingScopeType;

public record SettingValueResponse(
        String settingKey,
        String applicationId,
        SettingScopeType scopeType,
        String scopeKey,
        String value,
        String updatedBy
) {
}

