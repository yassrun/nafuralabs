package ma.nafura.marches.service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.marches.api.dto.AvenantImpactSimulationDto;
import ma.nafura.marches.api.request.AvenantCreateDto;
import ma.nafura.marches.domain.model.Avenant;
import ma.nafura.marches.domain.model.ContratMarche;
import ma.nafura.marches.repository.AvenantRepository;
import ma.nafura.marches.repository.ContratMarcheRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class AvenantService {

    private final AvenantRepository avenantRepository;
    private final ContratMarcheRepository contratRepository;
    private final AvenantSeedService seedService;
    private final AvenantPropagationService propagationService;

    public AvenantService(
            AvenantRepository avenantRepository,
            ContratMarcheRepository contratRepository,
            AvenantSeedService seedService,
            AvenantPropagationService propagationService) {
        this.avenantRepository = avenantRepository;
        this.contratRepository = contratRepository;
        this.seedService = seedService;
        this.propagationService = propagationService;
    }

    @Transactional(readOnly = true)
    public List<Avenant> list(String contratMarcheId, String status, String search) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        List<Avenant> rows = loadRows(tenantId, contratMarcheId, status);
        if (StringUtils.hasText(search)) {
            String term = search.trim().toLowerCase(Locale.ROOT);
            rows = rows.stream().filter(a -> matchesSearch(a, term)).toList();
        }
        return rows;
    }

    @Transactional(readOnly = true)
    public Avenant getById(String id) {
        seedService.seedIfEmpty();
        return resolveAvenant(id).orElseThrow(() -> new IllegalArgumentException("Avenant not found"));
    }

    @Transactional
    public Avenant create(AvenantCreateDto request) {
        UUID tenantId = tenantId();
        ContratMarche contrat = resolveContrat(request.getContratMarcheId())
                .orElseThrow(() -> new IllegalArgumentException("Contrat marché not found"));
        String id = StringUtils.hasText(request.getId()) ? request.getId().trim() : nextAvenantId(tenantId, contrat);
        if (avenantRepository.findByIdAndTenantId(id, tenantId).isPresent()) {
            throw new IllegalArgumentException("Avenant id already exists: " + id);
        }
        String numero = StringUtils.hasText(request.getNumero())
                ? request.getNumero().trim()
                : nextNumero(tenantId, contrat);
        Avenant entity = Avenant.builder()
                .id(id)
                .tenantId(tenantId)
                .numero(numero)
                .contratMarcheId(contrat.getId())
                .marcheNumero(contrat.getNumero())
                .type(resolveType(request.getType(), Avenant.TYPE_TVX_SUPPLEMENTAIRES))
                .objet(request.getObjet().trim())
                .motif(trimOrNull(request.getMotif()))
                .montantHt(request.getMontantHt() != null ? request.getMontantHt() : java.math.BigDecimal.ZERO)
                .prolongationJours(request.getProlongationJours() != null ? request.getProlongationJours() : 0)
                .dateSignature(request.getDateSignature())
                .status(resolveStatus(request.getStatus(), Avenant.STATUS_BROUILLON))
                .build();
        return avenantRepository.save(entity);
    }

    @Transactional
    public Avenant soumettreMoa(String id) {
        Avenant entity = getById(id);
        if (!Avenant.STATUS_BROUILLON.equals(entity.getStatus())
                && !Avenant.STATUS_PROPOSE.equals(entity.getStatus())) {
            throw new IllegalStateException("Only draft or proposed amendments can be submitted to MOA");
        }
        entity.setStatus(Avenant.STATUS_EN_SIGNATURE);
        entity.setUpdatedAt(OffsetDateTime.now());
        return avenantRepository.save(entity);
    }

    @Transactional
    public Avenant signer(String id) {
        Avenant entity = getById(id);
        if (!Avenant.STATUS_EN_SIGNATURE.equals(entity.getStatus())) {
            throw new IllegalStateException("Only amendments pending signature can be signed");
        }
        entity.setStatus(Avenant.STATUS_SIGNE);
        if (entity.getDateSignature() == null) {
            entity.setDateSignature(java.time.LocalDate.now());
        }
        entity.setUpdatedAt(OffsetDateTime.now());
        return avenantRepository.save(entity);
    }

    @Transactional
    public Avenant propagerImpact(String id) {
        Avenant entity = getById(id);
        if (!Avenant.STATUS_SIGNE.equals(entity.getStatus())) {
            throw new IllegalStateException("Only signed amendments can propagate impact");
        }
        if (entity.getImpactPropageLe() != null) {
            throw new IllegalStateException("Amendment impact already propagated");
        }
        ContratMarche contrat = resolveContrat(entity.getContratMarcheId())
                .orElseThrow(() -> new IllegalArgumentException("Contrat marché not found"));
        propagationService.apply(entity, contrat);
        contrat.setUpdatedAt(OffsetDateTime.now());
        contratRepository.save(contrat);
        entity.setStatus(Avenant.STATUS_APPLIQUE);
        entity.setImpactPropageLe(OffsetDateTime.now());
        entity.setUpdatedAt(OffsetDateTime.now());
        return avenantRepository.save(entity);
    }

    @Transactional
    public Avenant annuler(String id) {
        Avenant entity = getById(id);
        if (Avenant.STATUS_APPLIQUE.equals(entity.getStatus())) {
            throw new IllegalStateException("Applied amendments cannot be cancelled");
        }
        if (Avenant.STATUS_ANNULE.equals(entity.getStatus())) {
            throw new IllegalStateException("Amendment is already cancelled");
        }
        entity.setStatus(Avenant.STATUS_ANNULE);
        entity.setUpdatedAt(OffsetDateTime.now());
        return avenantRepository.save(entity);
    }

    @Transactional(readOnly = true)
    public AvenantImpactSimulationDto impactSimulation(String id) {
        Avenant entity = getById(id);
        ContratMarche contrat = resolveContrat(entity.getContratMarcheId())
                .orElseThrow(() -> new IllegalArgumentException("Contrat marché not found"));
        return propagationService.simulate(entity, contrat);
    }

    private List<Avenant> loadRows(UUID tenantId, String contratMarcheId, String status) {
        if (StringUtils.hasText(contratMarcheId) && StringUtils.hasText(status)) {
            return avenantRepository.findByTenantIdAndContratMarcheIdOrderByCreatedAtDesc(
                            tenantId, contratMarcheId.trim())
                    .stream()
                    .filter(a -> status.trim().equals(a.getStatus()))
                    .toList();
        }
        if (StringUtils.hasText(contratMarcheId)) {
            return avenantRepository.findByTenantIdAndContratMarcheIdOrderByCreatedAtDesc(
                    tenantId, contratMarcheId.trim());
        }
        if (StringUtils.hasText(status)) {
            return avenantRepository.findByTenantIdAndStatusOrderByCreatedAtDesc(tenantId, status.trim());
        }
        return avenantRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    private Optional<Avenant> resolveAvenant(String idOrNumero) {
        UUID tenantId = tenantId();
        if (!StringUtils.hasText(idOrNumero)) {
            return Optional.empty();
        }
        return avenantRepository.findByIdAndTenantId(idOrNumero.trim(), tenantId);
    }

    private Optional<ContratMarche> resolveContrat(String idOrNumero) {
        UUID tenantId = tenantId();
        if (!StringUtils.hasText(idOrNumero)) {
            return Optional.empty();
        }
        String key = idOrNumero.trim();
        Optional<ContratMarche> byId = contratRepository.findByIdAndTenantId(key, tenantId);
        if (byId.isPresent()) {
            return byId;
        }
        return contratRepository.findByTenantIdAndNumero(tenantId, key);
    }

    private String nextNumero(UUID tenantId, ContratMarche contrat) {
        long count = avenantRepository.countByTenantIdAndContratMarcheId(tenantId, contrat.getId()) + 1;
        return "AV-" + contrat.getNumero() + "-" + String.format("%02d", count);
    }

    private String nextAvenantId(UUID tenantId, ContratMarche contrat) {
        long count = avenantRepository.countByTenantIdAndContratMarcheId(tenantId, contrat.getId()) + 1;
        return contrat.getId() + "-av-" + String.format("%02d", count);
    }

    private String resolveType(String requested, String fallback) {
        if (!StringUtils.hasText(requested)) {
            return fallback;
        }
        String normalized = requested.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case Avenant.TYPE_TVX_SUPPLEMENTAIRES,
                    Avenant.TYPE_PROLONGATION_DELAI,
                    Avenant.TYPE_ADAPTATION_TECHNIQUE,
                    Avenant.TYPE_MONTANT,
                    Avenant.TYPE_DELAI,
                    Avenant.TYPE_MIXTE -> normalized;
            default -> fallback;
        };
    }

    private String resolveStatus(String requested, String fallback) {
        if (!StringUtils.hasText(requested)) {
            return fallback;
        }
        String normalized = requested.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case Avenant.STATUS_BROUILLON,
                    Avenant.STATUS_EN_SIGNATURE,
                    Avenant.STATUS_SIGNE,
                    Avenant.STATUS_APPLIQUE,
                    Avenant.STATUS_ANNULE,
                    Avenant.STATUS_PROPOSE -> normalized;
            default -> fallback;
        };
    }

    private boolean matchesSearch(Avenant a, String term) {
        return contains(a.getNumero(), term)
                || contains(a.getMarcheNumero(), term)
                || contains(a.getObjet(), term)
                || contains(a.getMotif(), term);
    }

    private boolean contains(String value, String term) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(term);
    }

    private String trimOrNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
