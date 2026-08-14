package ma.nafura.finance.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TradeEffectDto {
    private UUID id;
    private String numero;
    private String type;
    private String factureId;
    private String clientId;
    private String clientName;
    private String banqueDomicile;
    private String banqueTireeId;
    private BigDecimal montant;
    private LocalDate dateEcheance;
    private LocalDate dateRemise;
    private LocalDate dateEscompte;
    private String status;
    private BigDecimal fraisEscompte;
}
