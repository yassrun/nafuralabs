package ma.nafura.platform.documents.docextractor.domain.model.doctype.bl;

import lombok.Data;

import java.math.BigDecimal;

/**
 * Item line in BL document.
 */
@Data
public class BlItem {
    
    private String itemReference;
    private String itemDesignation;
    private BigDecimal quantity;
    private String uom; // Unit of measurement
    private BigDecimal unitPrice;
    private BigDecimal totalPrice;
}

