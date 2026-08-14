package ma.nafura.catalogue.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import ma.nafura.catalogue.domain.article.ItemUsageLot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ItemUsageLotRepository extends JpaRepository<ItemUsageLot, ItemUsageLot.Pk> {

    List<ItemUsageLot> findByItemId(UUID itemId);

    List<ItemUsageLot> findByItemIdIn(Collection<UUID> itemIds);

    void deleteByItemId(UUID itemId);
}
