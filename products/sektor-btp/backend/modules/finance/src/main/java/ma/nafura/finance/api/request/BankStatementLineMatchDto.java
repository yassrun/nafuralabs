package ma.nafura.finance.api.request;

import java.util.UUID;
import lombok.Data;

@Data
public class BankStatementLineMatchDto {

    private UUID journalEntryLineId;
    private String mouvementRef;
}
