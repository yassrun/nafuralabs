package ma.nafura.catalogue.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "item_usage_lots")
@IdClass(ItemUsageLot.Pk.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemUsageLot {

    @Id
    @Column(name = "item_id", nullable = false)
    private UUID itemId;

    @Id
    @Column(name = "lot_code", nullable = false, length = 50)
    private String lotCode;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Pk implements Serializable {
        private UUID itemId;
        private String lotCode;
    }
}
