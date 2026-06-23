package ma.nafura.platform.documents.docextractor.api.response.doctype.bl;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * Structured DTO for BL (Bon de Livraison) document data.
 * Represents the extracted data from a BL document.
 */
@Data
public class BlDataDto {
    
    @JsonProperty("blReference")
    private String blReference;
    
    @JsonProperty("date")
    private String date;
    
    @JsonProperty("issuer")
    private String issuer;
    
    @JsonProperty("sender")
    private BlSenderDto sender;
    
    @JsonProperty("receiver")
    private BlReceiverDto receiver;
    
    @JsonProperty("items")
    private List<BlItemDto> items;
    
    /**
     * Sender information in BL.
     */
    @Data
    public static class BlSenderDto {
        @JsonProperty("name")
        private String name;
        
        @JsonProperty("address")
        private String address;
    }
    
    /**
     * Receiver information in BL.
     */
    @Data
    public static class BlReceiverDto {
        @JsonProperty("name")
        private String name;
        
        @JsonProperty("address")
        private String address;
    }
    
    /**
     * Item line in BL.
     */
    @Data
    public static class BlItemDto {
        @JsonProperty("itemReference")
        private String itemReference;
        
        @JsonProperty("itemDesignation")
        private String itemDesignation;
        
        @JsonProperty("quantity")
        private BigDecimal quantity;
        
        @JsonProperty("uom")
        private String uom; // Unit of measurement
        
        @JsonProperty("unitPrice")
        private BigDecimal unitPrice;
        
        @JsonProperty("totalPrice")
        private BigDecimal totalPrice;
    }
}

