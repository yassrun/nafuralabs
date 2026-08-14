package ma.nafura.socle.seeders;

import java.math.BigDecimal;
import java.util.UUID;
import ma.nafura.socle.domain.MatricePouvoir;
import ma.nafura.socle.repository.MatricePouvoirRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ma.nafura.socle.service.MatricePouvoirService;

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
            ensureEtudeMatrix(tenantId);
            return;
        }
        seedBcMatrix(tenantId);
        seedEtudeMatrix(tenantId);
    }

    /** L4 : lignes ETUDE_PRIX même si la matrice BC existe déjà. */
    @Transactional
    public void ensureEtudeMatrix() {
        ensureEtudeMatrix(TenantContext.getTenantId());
    }

    private void ensureEtudeMatrix(UUID tenantId) {
        boolean present = repository.findByTenantIdAndEntityTypeOrderByOrdreAsc(
                        tenantId, MatricePouvoirService.ENTITY_TYPE_ETUDE_PRIX)
                .stream()
                .findAny()
                .isPresent();
        if (!present) {
            seedEtudeMatrix(tenantId);
        }
    }

    private void seedBcMatrix(UUID tenantId) {
        repository.save(MatricePouvoir.builder()
                .tenantId(tenantId)
                .entityType(MatricePouvoirService.ENTITY_TYPE_BC)
                .seuilMin(null)
                .seuilMax(SEUIL_50K)
                .approbateurRole(MatricePouvoirService.ROLE_CONDUCTEUR)
                .label("BC < 50K MAD")
                .ordre(1)
                .build());
        repository.save(MatricePouvoir.builder()
                .tenantId(tenantId)
                .entityType(MatricePouvoirService.ENTITY_TYPE_BC)
                .seuilMin(SEUIL_50K)
                .seuilMax(SEUIL_500K)
                .approbateurRole(MatricePouvoirService.ROLE_DIRECTEUR_TRAVAUX)
                .label("50K – 500K MAD")
                .ordre(2)
                .build());
        repository.save(MatricePouvoir.builder()
                .tenantId(tenantId)
                .entityType(MatricePouvoirService.ENTITY_TYPE_BC)
                .seuilMin(SEUIL_500K)
                .seuilMax(null)
                .approbateurRole(MatricePouvoirService.ROLE_DG)
                .label("BC >= 500K MAD")
                .ordre(3)
                .build());
    }

    private void seedEtudeMatrix(UUID tenantId) {
        repository.save(MatricePouvoir.builder()
                .tenantId(tenantId)
                .entityType(MatricePouvoirService.ENTITY_TYPE_ETUDE_PRIX)
                .seuilMin(null)
                .seuilMax(SEUIL_500K)
                .approbateurRole(MatricePouvoirService.ROLE_DIRECTEUR_TRAVAUX)
                .label("Étude < 500K MAD — 1 niveau")
                .ordre(1)
                .build());
        repository.save(MatricePouvoir.builder()
                .tenantId(tenantId)
                .entityType(MatricePouvoirService.ENTITY_TYPE_ETUDE_PRIX)
                .seuilMin(SEUIL_500K)
                .seuilMax(null)
                .approbateurRole(MatricePouvoirService.ROLE_DG)
                .label("Étude ≥ 500K MAD — 2 niveaux (N2 = DG)")
                .ordre(2)
                .build());
    }
}
