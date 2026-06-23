package ma.nafura.approbations.service;

import java.math.BigDecimal;
import java.util.UUID;
import ma.nafura.approbations.domain.model.MatricePouvoir;
import ma.nafura.approbations.repository.MatricePouvoirRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MatricePouvoirSeedService {

    private static final BigDecimal SEUIL_50K = new BigDecimal("50000");
    private static final BigDecimal SEUIL_500K = new BigDecimal("500000");

    private final MatricePouvoirRepository repository;

    public MatricePouvoirSeedService(MatricePouvoirRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = TenantContext.getTenantId();
        if (repository.countByTenantId(tenantId) > 0) {
            return;
        }
        seedBcMatrix(tenantId);
    }

    private void seedBcMatrix(UUID tenantId) {
        repository.save(MatricePouvoir.builder()
                .tenantId(tenantId)
                .entityType(MatricePouvoirService.ENTITY_TYPE_BC)
                .seuilMin(null)
                .seuilMax(SEUIL_50K)
                .approbateurRole(MatricePouvoirService.ROLE_DIRECTEUR_TRAVAUX)
                .label("BC < 50K MAD")
                .ordre(1)
                .build());
        repository.save(MatricePouvoir.builder()
                .tenantId(tenantId)
                .entityType(MatricePouvoirService.ENTITY_TYPE_BC)
                .seuilMin(SEUIL_50K)
                .seuilMax(SEUIL_500K)
                .approbateurRole(MatricePouvoirService.ROLE_DG)
                .label("50K – 500K MAD")
                .ordre(2)
                .build());
        repository.save(MatricePouvoir.builder()
                .tenantId(tenantId)
                .entityType(MatricePouvoirService.ENTITY_TYPE_BC)
                .seuilMin(SEUIL_500K)
                .seuilMax(null)
                .approbateurRole(MatricePouvoirService.ROLE_COMITE)
                .label("BC >= 500K MAD")
                .ordre(3)
                .build());
    }
}
