package ma.nafura.ventes.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import ma.nafura.ventes.api.dto.RetenueGarantieSyntheseDto;
import ma.nafura.ventes.domain.model.RetenueGarantie;
import ma.nafura.ventes.repository.RetenueGarantieRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class RetenueGarantieService {

    private final RetenueGarantieRepository repository;
    private final RetenueGarantieSeedService seedService;

    public RetenueGarantieService(
            RetenueGarantieRepository repository, RetenueGarantieSeedService seedService) {
        this.repository = repository;
        this.seedService = seedService;
    }

    @Transactional(readOnly = true)
    public List<RetenueGarantie> list(String marcheId, String statut, String clientId) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        if (StringUtils.hasText(marcheId) && StringUtils.hasText(statut)) {
            return repository.findByTenantIdAndMarcheIdAndStatutOrderByCreatedAtDesc(
                    tenantId, marcheId.trim(), statut.trim());
        }
        if (StringUtils.hasText(marcheId)) {
            return repository.findByTenantIdAndMarcheIdOrderByCreatedAtDesc(tenantId, marcheId.trim());
        }
        if (StringUtils.hasText(statut) && StringUtils.hasText(clientId)) {
            return repository.findByTenantIdAndClientIdAndStatutOrderByCreatedAtDesc(
                    tenantId, clientId.trim(), statut.trim());
        }
        if (StringUtils.hasText(statut)) {
            return repository.findByTenantIdAndStatutOrderByCreatedAtDesc(tenantId, statut.trim());
        }
        if (StringUtils.hasText(clientId)) {
            return repository.findByTenantIdAndClientIdOrderByCreatedAtDesc(tenantId, clientId.trim());
        }
        return repository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    @Transactional(readOnly = true)
    public RetenueGarantie getById(UUID id) {
        seedService.seedIfEmpty();
        return repository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Retenue garantie not found"));
    }

    @Transactional
    public RetenueGarantie demandeRestitution(UUID id) {
        RetenueGarantie entity = getById(id);
        if (RetenueGarantie.STATUT_RESTITUEE_TOTAL.equals(entity.getStatut())) {
            throw new IllegalStateException("Retenue garantie already fully restituted");
        }
        entity.setStatut(RetenueGarantie.STATUT_DEMANDE_RESTITUTION);
        return repository.save(entity);
    }

    @Transactional
    public RetenueGarantie restituer(UUID id, BigDecimal montant) {
        if (montant == null || montant.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("montant must be positive");
        }
        RetenueGarantie entity = getById(id);
        BigDecimal reste = entity.getCumul().subtract(entity.getMontantRestitue());
        if (montant.compareTo(reste) > 0) {
            throw new IllegalArgumentException("montant exceeds remaining amount");
        }
        BigDecimal newRestitue = entity.getMontantRestitue().add(montant);
        entity.setMontantRestitue(newRestitue);
        entity.setStatut(resolveStatutAfterRestitution(newRestitue, entity.getCumul()));
        return repository.save(entity);
    }

    @Transactional(readOnly = true)
    public RetenueGarantieSyntheseDto synthese(String clientId) {
        seedService.seedIfEmpty();
        List<RetenueGarantie> rows = StringUtils.hasText(clientId)
                ? repository.findByTenantIdAndClientIdOrderByCreatedAtDesc(tenantId(), clientId.trim())
                : repository.findByTenantIdOrderByCreatedAtDesc(tenantId());

        BigDecimal totalCumul = BigDecimal.ZERO;
        BigDecimal totalRestitue = BigDecimal.ZERO;
        long immobilisees = 0;
        long demandeRestitution = 0;

        for (RetenueGarantie row : rows) {
            totalCumul = totalCumul.add(row.getCumul());
            totalRestitue = totalRestitue.add(row.getMontantRestitue());
            if (RetenueGarantie.STATUT_IMMOBILISEE.equals(row.getStatut())) {
                immobilisees++;
            } else if (RetenueGarantie.STATUT_DEMANDE_RESTITUTION.equals(row.getStatut())) {
                demandeRestitution++;
            }
        }

        return RetenueGarantieSyntheseDto.builder()
                .clientId(StringUtils.hasText(clientId) ? clientId.trim() : null)
                .nombreRetenues(rows.size())
                .totalCumul(totalCumul)
                .totalRestitue(totalRestitue)
                .totalReste(totalCumul.subtract(totalRestitue))
                .immobilisees(immobilisees)
                .demandeRestitution(demandeRestitution)
                .build();
    }

    static String resolveStatutAfterRestitution(BigDecimal montantRestitue, BigDecimal cumul) {
        if (montantRestitue.compareTo(cumul) >= 0) {
            return RetenueGarantie.STATUT_RESTITUEE_TOTAL;
        }
        return RetenueGarantie.STATUT_RESTITUEE_PARTIEL;
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
