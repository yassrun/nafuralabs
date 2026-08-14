package ma.nafura.hse.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CnssDatDeclarationResultDto {

    private boolean cnssDatDeclare;
    private String cnssDatXmlUrl;
    private String cnssReferenceDeclaration;
}
