package ma.nafura.platform.documents.docextractor.domain.model.doctype.bl;

import lombok.Data;

import java.util.List;

/**
 * Structured model for BL (Bon de Livraison) document.
 * Represents the business model of a BL document.
 */
@Data
public class BlModel {
    
    private String blReference;
    private String date;
    private String issuer;
    private BlSender sender;
    private BlReceiver receiver;
    private List<BlItem> items;
    
    /**
     * Sender information in BL.
     */
    @Data
    public static class BlSender {
        private String name;
        private String address;
    }
    
    /**
     * Receiver information in BL.
     */
    @Data
    public static class BlReceiver {
        private String name;
        private String address;
    }
    
}

