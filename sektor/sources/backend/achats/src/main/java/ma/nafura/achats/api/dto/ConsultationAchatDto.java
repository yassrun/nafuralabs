package ma.nafura.achats.api.dto;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ConsultationAchatDto {

    private UUID id;
    private String numero;
    private List<String> clesStables;
    private UUID dossierEtudeId;
    private String statut;
    @Builder.Default
    private int devisRecus = 0;
    @Builder.Default
    private List<ConsultationDevisDto> devis = new ArrayList<>();
    @Builder.Default
    private List<ConsultationDestinataireDto> destinataires = new ArrayList<>();
    @Builder.Default
    private List<ConsultationEnvoiDto> envois = new ArrayList<>();
    private OffsetDateTime createdAt;

    public static ConsultationAchatDto emptyPanier() {
        return ConsultationAchatDto.builder().clesStables(new ArrayList<>()).build();
    }
}
