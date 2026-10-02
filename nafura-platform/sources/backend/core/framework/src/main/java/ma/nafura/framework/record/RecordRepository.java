package ma.nafura.platform.framework.record;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.repository.NoRepositoryBean;

/** Repository of a business record served by a {@link RecordController}. */
@NoRepositoryBean
public interface RecordRepository<E> extends JpaRepository<E, UUID>, JpaSpecificationExecutor<E> {
}
