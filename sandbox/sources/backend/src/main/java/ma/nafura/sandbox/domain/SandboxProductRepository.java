package ma.nafura.sandbox.domain;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface SandboxProductRepository extends JpaRepository<SandboxProduct, String>, JpaSpecificationExecutor<SandboxProduct> {

    List<SandboxProduct> findAllByOrderByCodeAsc();
}
