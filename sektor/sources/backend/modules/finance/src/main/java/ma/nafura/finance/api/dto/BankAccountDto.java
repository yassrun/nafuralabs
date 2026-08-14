package ma.nafura.finance.api.dto;

import java.math.BigDecimal;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BankAccountDto {

    private UUID id;
    private String code;
    private String name;
    private String accountType;
    private String bankName;
    private String rib;
    private String branch;
    private String currencyCode;
    private String glAccountCode;
    private BigDecimal openingBalance;
    private BigDecimal currentBalance;
    private Boolean isActive;
    private String notes;
}
