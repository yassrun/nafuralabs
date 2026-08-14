package ma.nafura.item.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.item.domain.model.ItemPrice;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for ItemPrice entity.
 * Generated once — add custom queries here.
 */
@Repository
public interface ItemPriceRepository extends TenantScopedRepository<ItemPrice, UUID> {

    @Query(
            """
            SELECT p FROM ItemPrice p
            WHERE p.tenantId = :tenantId
              AND p.itemId = :itemId
              AND p.priceType = :priceType
              AND p.effectiveFrom <= :date
              AND (p.effectiveTo IS NULL OR p.effectiveTo >= :date)
            ORDER BY p.effectiveFrom DESC
            """)
    List<ItemPrice> findEffective(
            @Param("tenantId") UUID tenantId,
            @Param("itemId") UUID itemId,
            @Param("priceType") String priceType,
            @Param("date") LocalDate date);

    @Query(
            """
            SELECT p FROM ItemPrice p
            WHERE p.tenantId = :tenantId
              AND p.itemId = :itemId
              AND p.effectiveFrom >= :from
              AND p.unitPrice > 0
            ORDER BY p.effectiveFrom DESC
            """)
    List<ItemPrice> findSince(
            @Param("tenantId") UUID tenantId,
            @Param("itemId") UUID itemId,
            @Param("from") LocalDate from);

    boolean existsByTenantIdAndItemIdAndPriceType(UUID tenantId, UUID itemId, String priceType);
}
