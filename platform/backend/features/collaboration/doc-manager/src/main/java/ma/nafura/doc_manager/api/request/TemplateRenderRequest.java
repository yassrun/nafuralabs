package ma.nafura.platform.collaboration.docmanager.api.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TemplateRenderRequest {

    @NotNull
    private String entityType;

    @NotNull
    private UUID entityId;
}
