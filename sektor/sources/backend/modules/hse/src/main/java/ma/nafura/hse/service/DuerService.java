package ma.nafura.hse.service;

import java.time.Year;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import ma.nafura.hse.api.request.DuerCreateDto;
import ma.nafura.hse.api.request.DuerRisqueCreateDto;
import ma.nafura.hse.domain.model.Duer;
import ma.nafura.hse.domain.model.DuerRisque;
import ma.nafura.hse.repository.DuerRepository;
import ma.nafura.hse.repository.DuerRisqueRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class DuerService {

    private static final Pattern DUER_NUMERO_SUFFIX =
            Pattern.compile("^DUER-(\\d{4})-(\\d+)$", Pattern.CASE_INSENSITIVE);
    private static final Pattern DUER_ID_SUFFIX = Pattern.compile("^duer-(\\d+)$", Pattern.CASE_INSENSITIVE);

    private final DuerRepository duerRepository;
    private final DuerRisqueRepository risqueRepository;
    private final DuerSeedService seedService;

    public DuerService(
            DuerRepository duerRepository,
            DuerRisqueRepository risqueRepository,
            DuerSeedService seedService) {
        this.duerRepository = duerRepository;
        this.risqueRepository = risqueRepository;
        this.seedService = seedService;
    }

    @Transactional(readOnly = true)
    public List<Duer> list(String chantierId, String societeId) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        if (StringUtils.hasText(chantierId)) {
            return duerRepository.findByTenantIdAndChantierIdOrderByDateRevisionDescCreatedAtDesc(
                    tenantId, chantierId.trim());
        }
        if (StringUtils.hasText(societeId)) {
            return duerRepository.findByTenantIdOrderByDateRevisionDescCreatedAtDesc(tenantId);
        }
        return duerRepository.findByTenantIdOrderByDateRevisionDescCreatedAtDesc(tenantId);
    }

    @Transactional
    public Duer create(DuerCreateDto request) {
        UUID tenantId = tenantId();
        String id = StringUtils.hasText(request.getId()) ? request.getId().trim() : nextDuerId(tenantId);
        if (duerRepository.findByIdAndTenantId(id, tenantId).isPresent()) {
            throw new IllegalArgumentException("DUER id already exists: " + id);
        }

        Duer entity = Duer.builder()
                .id(id)
                .tenantId(tenantId)
                .numero(nextNumero(tenantId))
                .chantierId(request.getChantierId().trim())
                .chantierCode(request.getChantierCode().trim())
                .chantierNom(request.getChantierName().trim())
                .version(StringUtils.hasText(request.getVersion()) ? request.getVersion().trim() : "v1.0")
                .dateRevision(request.getDateRevision())
                .auteurId(trimOrNull(request.getAuteurId()))
                .auteurNom(request.getAuteurNom().trim())
                .risquesIdentifies(request.getRisquesIdentifies() != null ? request.getRisquesIdentifies() : 0)
                .actionsCorrectives(request.getActionsCorrectives() != null ? request.getActionsCorrectives() : 0)
                .observations(trimOrNull(request.getObservations()))
                .status(normalizeStatus(request.getStatus(), Duer.STATUS_BROUILLON))
                .build();
        return duerRepository.save(entity);
    }

    @Transactional(readOnly = true)
    public Duer getById(String id) {
        seedService.seedIfEmpty();
        return resolveDuer(id).orElseThrow(() -> new IllegalArgumentException("DUER not found"));
    }

    @Transactional(readOnly = true)
    public List<DuerRisque> listRisques(String duerId) {
        seedService.seedIfEmpty();
        Duer duer = getById(duerId);
        return risqueRepository.findByTenantIdAndDuerIdOrderByOrdreAsc(tenantId(), duer.getId());
    }

    @Transactional
    public DuerRisque addRisque(String duerId, DuerRisqueCreateDto request) {
        Duer duer = getById(duerId);
        UUID tenantId = tenantId();
        validateEchelle(request.getProbabilite());
        validateEchelle(request.getGravite());

        String id = StringUtils.hasText(request.getId()) ? request.getId().trim() : nextRisqueId(tenantId, duerId);
        int ordre = request.getOrdre() != null
                ? request.getOrdre()
                : (int) risqueRepository.countByTenantIdAndDuerId(tenantId, duerId) + 1;

        DuerRisque entity = DuerRisque.builder()
                .id(id)
                .tenantId(tenantId)
                .duerId(duer.getId())
                .libelle(request.getLibelle().trim())
                .probabilite(request.getProbabilite())
                .gravite(request.getGravite())
                .codeActivite(trimOrNull(request.getCodeActivite()))
                .mesures(trimOrNull(request.getMesures()))
                .ordre(ordre)
                .build();
        DuerRisque saved = risqueRepository.save(entity);
        refreshRisquesCount(duer);
        return saved;
    }

    @Transactional
    public void replaceRisques(String duerId, List<DuerRisqueCreateDto> rows) {
        Duer duer = getById(duerId);
        UUID tenantId = tenantId();
        risqueRepository.deleteByTenantIdAndDuerId(tenantId, duerId);
        int ordre = 1;
        for (DuerRisqueCreateDto request : rows) {
            validateEchelle(request.getProbabilite());
            validateEchelle(request.getGravite());
            String id = StringUtils.hasText(request.getId())
                    ? request.getId().trim()
                    : String.format(Locale.ROOT, "%s-r%03d", duerId, ordre);
            DuerRisque entity = DuerRisque.builder()
                    .id(id)
                    .tenantId(tenantId)
                    .duerId(duer.getId())
                    .libelle(request.getLibelle().trim())
                    .probabilite(request.getProbabilite())
                    .gravite(request.getGravite())
                    .codeActivite(trimOrNull(request.getCodeActivite()))
                    .mesures(trimOrNull(request.getMesures()))
                    .ordre(ordre++)
                    .build();
            risqueRepository.save(entity);
        }
        refreshRisquesCount(duer);
    }

    private void refreshRisquesCount(Duer duer) {
        long count = risqueRepository.countByTenantIdAndDuerId(tenantId(), duer.getId());
        duer.setRisquesIdentifies((int) count);
        duerRepository.save(duer);
    }

    private void validateEchelle(int value) {
        if (value < 1 || value > 5) {
            throw new IllegalArgumentException("probabilite and gravite must be between 1 and 5");
        }
    }

    private java.util.Optional<Duer> resolveDuer(String rawId) {
        String id = rawId != null ? rawId.trim() : "";
        if (!StringUtils.hasText(id)) {
            return java.util.Optional.empty();
        }
        return duerRepository.findByIdAndTenantId(id, tenantId());
    }

    private String nextNumero(UUID tenantId) {
        int year = Year.now().getValue();
        int max = 0;
        for (Duer duer : duerRepository.findByTenantIdOrderByDateRevisionDescCreatedAtDesc(tenantId)) {
            Matcher matcher = DUER_NUMERO_SUFFIX.matcher(duer.getNumero());
            if (matcher.matches() && Integer.parseInt(matcher.group(1)) == year) {
                max = Math.max(max, Integer.parseInt(matcher.group(2)));
            }
        }
        return String.format(Locale.ROOT, "DUER-%d-%03d", year, max + 1);
    }

    private String nextDuerId(UUID tenantId) {
        int max = 0;
        for (Duer duer : duerRepository.findByTenantIdOrderByDateRevisionDescCreatedAtDesc(tenantId)) {
            Matcher matcher = DUER_ID_SUFFIX.matcher(duer.getId());
            if (matcher.matches()) {
                max = Math.max(max, Integer.parseInt(matcher.group(1)));
            }
        }
        return String.format(Locale.ROOT, "duer-%03d", max + 1);
    }

    private String nextRisqueId(UUID tenantId, String duerId) {
        long count = risqueRepository.countByTenantIdAndDuerId(tenantId, duerId);
        return String.format(Locale.ROOT, "%s-r%03d", duerId, count + 1);
    }

    private String normalizeStatus(String raw, String fallback) {
        if (!StringUtils.hasText(raw)) {
            return fallback;
        }
        String status = raw.trim().toUpperCase(Locale.ROOT);
        if (!Duer.STATUS_BROUILLON.equals(status) && !Duer.STATUS_VALIDE.equals(status)) {
            return fallback;
        }
        return status;
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
