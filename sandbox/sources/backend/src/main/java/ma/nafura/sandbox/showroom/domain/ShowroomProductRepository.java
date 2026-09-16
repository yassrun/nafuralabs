package ma.nafura.sandbox.showroom.domain;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ShowroomProductRepository extends JpaRepository<ShowroomProduct, String>, JpaSpecificationExecutor<ShowroomProduct> {

    List<ShowroomProduct> findAllByOrderByCodeAsc();
}
