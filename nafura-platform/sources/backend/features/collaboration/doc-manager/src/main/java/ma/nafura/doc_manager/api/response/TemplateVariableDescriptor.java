package ma.nafura.platform.collaboration.docmanager.api.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TemplateVariableDescriptor {

    private String path;
    private String label;
    private String type;
    private String example;
}
