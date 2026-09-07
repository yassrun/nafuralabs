package ma.nafura.achats.api.request;

import jakarta.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class ConsultationDestinataireCreateDto {

    @NotNull
    private UUID fournisseurId;

    /** Premier contact (To) — compat 28/08. Fusionné dans {@link #resolvedContactIds()}. */
    private UUID contactId;

    /** N contacts : ordre = To puis CC. */
    private List<UUID> contactIds;

    public List<UUID> resolvedContactIds() {
        LinkedHashSet<UUID> ids = new LinkedHashSet<>();
        if (contactIds != null) {
            for (UUID id : contactIds) {
                if (id != null) {
                    ids.add(id);
                }
            }
        }
        if (contactId != null) {
            ids.add(contactId);
        }
        return new ArrayList<>(ids);
    }
}
