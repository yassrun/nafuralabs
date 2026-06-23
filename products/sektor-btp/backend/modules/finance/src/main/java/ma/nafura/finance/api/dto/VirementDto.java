package ma.nafura.finance.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VirementDto {
    private UUID id;
    private String numero;
    private String virementType;
    private LocalDate date;
    private String status;
    private BigDecimal montant;
    private String motif;
    private String reference;
    private UUID compteSourceId;
    private String compteSourceLibelle;
    private UUID compteDestId;
    private String compteDestLibelle;
    private String bankCode;
    private LocalDate executionDate;
    private String generatedXml;
    private UUID ecritureId;
    private String notes;
    private List<VirementLineDto> lines;
}
