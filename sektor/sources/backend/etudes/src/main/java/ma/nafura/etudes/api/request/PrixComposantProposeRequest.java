package ma.nafura.etudes.api.request;

import lombok.Data;

@Data
public class PrixComposantProposeRequest {

    private String designation;
    private String type;
    private String unite;
    private String articleLibelle;
    private String articleCode;
}
