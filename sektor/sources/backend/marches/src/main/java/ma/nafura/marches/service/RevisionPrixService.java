package ma.nafura.marches.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.marches.api.request.RevisionPrixCalculerDto;
import ma.nafura.marches.domain.model.ContratMarche;
import ma.nafura.marches.domain.model.IndiceBtp;
import ma.nafura.marches.domain.model.RevisionPrix;
import ma.nafura.marches.repository.ContratMarcheRepository;
import ma.nafura.marches.repository.IndiceBtpRepository;
import ma.nafura.marches.repository.RevisionPrixRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class RevisionPrixService {

    private static final String DEFAULT_FORMULE_MAR002 =
            "{\"termeFixe\":0.15,\"termesVariables\":["
                    + "{\"coefficient\":0.50,\"indiceCode\":\"BTP18\",\"indiceBaseValeur\":1250},"
                    + "{\"coefficient\":0.20,\"indiceCode\":\"BTP01\",\"indiceBaseValeur\":980},"
                    + "{\"coefficient\":0.15,\"indiceCode\":\"MO\",\"indiceBaseValeur\":740}]}";

    private final RevisionPrixRepository revisionRepository;
    private final ContratMarcheRepository contratRepository;
    private final IndiceBtpRepository indiceRepository;
    private final IndiceBtpSeedService indiceSeedService;
    private final RevisionPrixSeedService revisionSeedService;
    private final ObjectMapper objectMapper;

    public RevisionPrixService(
            RevisionPrixRepository revisionRepository,
            ContratMarcheRepository contratRepository,
            IndiceBtpRepository indiceRepository,
            IndiceBtpSeedService indiceSeedService,
            @Lazy RevisionPrixSeedService revisionSeedService,
            ObjectMapper objectMapper) {
        this.revisionRepository = revisionRepository;
        this.contratRepository = contratRepository;
        this.indiceRepository = indiceRepository;
        this.indiceSeedService = indiceSeedService;
        this.revisionSeedService = revisionSeedService;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<RevisionPrix> list(String contratId) {
        revisionSeedService.seedIfEmpty();
        UUID tenantId = tenantId();
        if (StringUtils.hasText(contratId)) {
            return revisionRepository.findByTenantIdAndContratMarcheIdOrderByPeriodeDesc(
                    tenantId, contratId.trim());
        }
        return revisionRepository.findByTenantIdOrderByPeriodeDescCreatedAtDesc(tenantId);
    }

    @Transactional
    public RevisionPrix calculer(RevisionPrixCalculerDto request) {
        return calculer(request.getContratMarcheId(), request.getPeriode(), null);
    }

    @Transactional
    public RevisionPrix calculer(String contratMarcheId, String periode, String presetId) {
        indiceSeedService.seedIfEmpty();
        UUID tenantId = tenantId();
        ContratMarche contrat = resolveContrat(contratMarcheId)
                .orElseThrow(() -> new IllegalArgumentException("Contrat marché not found"));

        FormuleRevisionK formule = resolveFormule(contrat.getId());
        String formuleJson = toJson(formule);

        Map<String, BigDecimal> indices = loadIndicesForPeriode(tenantId, periode, formule);
        BigDecimal k = RevisionPrixKCalculator.calculerK(formule, indices);

        BigDecimal montantRevision = contrat.getMontantHt()
                .multiply(k.subtract(BigDecimal.ONE))
                .setScale(4, RoundingMode.HALF_UP);

        Optional<RevisionPrix> existing =
                revisionRepository.findByTenantIdAndContratMarcheIdAndPeriode(tenantId, contrat.getId(), periode);

        RevisionPrix entity = existing.orElseGet(() -> RevisionPrix.builder()
                .id(StringUtils.hasText(presetId) ? presetId.trim() : nextRevisionId(tenantId))
                .tenantId(tenantId)
                .contratMarcheId(contrat.getId())
                .periode(periode)
                .build());

        entity.setCoefficientK(k);
        entity.setMontantRevision(montantRevision);
        entity.setFormuleJson(formuleJson);
        entity.setStatus(RevisionPrix.STATUS_CALCULE);

        return revisionRepository.save(entity);
    }

    @Transactional
    public RevisionPrix appliquer(String id) {
        RevisionPrix entity = getById(id);
        if (RevisionPrix.STATUS_ANNULE.equals(entity.getStatus())) {
            throw new IllegalStateException("Cannot apply a cancelled revision");
        }
        entity.setStatus(RevisionPrix.STATUS_APPLIQUE);
        return revisionRepository.save(entity);
    }

    @Transactional(readOnly = true)
    public RevisionPrix getById(String id) {
        revisionSeedService.seedIfEmpty();
        UUID tenantId = tenantId();
        return revisionRepository
                .findByIdAndTenantId(id.trim(), tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Revision prix not found"));
    }

    FormuleRevisionK resolveFormule(String contratId) {
        if ("mar-002".equals(contratId)) {
            return parseFormule(DEFAULT_FORMULE_MAR002);
        }
        return parseFormule(DEFAULT_FORMULE_MAR002);
    }

    private Map<String, BigDecimal> loadIndicesForPeriode(
            UUID tenantId, String periode, FormuleRevisionK formule) {
        Map<String, BigDecimal> map = new HashMap<>();
        for (FormuleRevisionK.TermeVariable terme : formule.getTermesVariables()) {
            IndiceBtp row = indiceRepository
                    .findByTenantIdAndCodeAndPeriode(tenantId, terme.getIndiceCode(), periode)
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Missing index " + terme.getIndiceCode() + " for period " + periode));
            map.put(terme.getIndiceCode(), row.getValeur());
        }
        return map;
    }

    private FormuleRevisionK parseFormule(String json) {
        try {
            return objectMapper.readValue(json, FormuleRevisionK.class);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Invalid formula JSON", ex);
        }
    }

    private String toJson(FormuleRevisionK formule) {
        try {
            return objectMapper.writeValueAsString(formule);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Failed to serialize formula", ex);
        }
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

    private String nextRevisionId(UUID tenantId) {
        long count = revisionRepository.countByTenantId(tenantId) + 1;
        return "rev-" + String.format("%03d", count);
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
