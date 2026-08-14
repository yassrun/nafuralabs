package ma.nafura.platform.settings.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import ma.nafura.platform.settings.domain.model.SettingOwnerLevel;
import ma.nafura.platform.settings.domain.model.SettingScopeType;
import ma.nafura.platform.settings.domain.model.SettingValueType;

import java.util.Set;

@Data
public class CreateSettingDefinitionRequest {

    @NotBlank
    @Pattern(regexp = "^[a-z][a-z0-9_.-]*$", message = "settingKey must be lowercase and dot-separated")
    private String settingKey;

    @NotNull
    private SettingOwnerLevel ownerLevel;

    private String applicationId;
    private String domainCode;
    private String featureCode;

    @NotNull
    private SettingValueType valueType;

    private String defaultValue;
    private String description;
    private Boolean secret;
    private Boolean mutable;
    private Boolean active;

    private Set<SettingScopeType> supportedScopes;
}

