package ma.nafura.platform.showroom.domain;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ShowroomProductRepository extends JpaRepository<ShowroomProduct, String> {

    List<ShowroomProduct> findAllByOrderByCodeAsc();
}
