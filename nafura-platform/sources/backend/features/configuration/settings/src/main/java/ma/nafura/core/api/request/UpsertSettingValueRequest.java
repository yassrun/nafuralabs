package ma.nafura.platform.settings.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import ma.nafura.platform.settings.domain.model.SettingScopeType;

import java.util.UUID;

@Data
public class UpsertSettingValueRequest {

    private String applicationId;

    @NotNull
    private SettingScopeType scopeType;

    private UUID tenantId;

    private String userKey;

    @NotBlank
    private String value;

    private String updatedBy;
}

