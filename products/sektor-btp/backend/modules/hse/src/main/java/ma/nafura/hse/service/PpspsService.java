package ma.nafura.hse.service;

import java.time.LocalDate;
import java.time.Year;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import ma.nafura.hse.api.request.PpspsCreateDto;
import ma.nafura.hse.api.request.PpspsSectionCreateDto;
import ma.nafura.hse.domain.model.Ppsps;
import ma.nafura.hse.domain.model.PpspsSection;
import ma.nafura.hse.repository.PpspsRepository;
import ma.nafura.hse.repository.PpspsSectionRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class PpspsService {

    private static final Pattern PPSPS_NUMERO_SUFFIX =
            Pattern.compile("^PPSPS-CH-(\\d{4})-(\\d+)$", Pattern.CASE_INSENSITIVE);
    private static final Pattern PPSPS_ID_SUFFIX = Pattern.compile("^ppsps-(\\d+)$", Pattern.CASE_INSENSITIVE);

    private static final List<PpspsSectionCreateDto> DEFAULT_SECTIONS = List.of(
            section("1", "Renseignements administratifs"),
            section("2", "Description de l'ouvrage"),
            section("3", "Coordination de la prévention"),
            section("4", "Organisation générale — prévention"),
            section("5", "Mesures techniques"),
            section("6", "Évaluation des risques & DUER"),
            section("7", "Premiers secours & organisation des secours"),
            section("8", "Coactivité"));

    private final PpspsRepository ppspsRepository;
    private final PpspsSectionRepository sectionRepository;
    private final PpspsSeedService seedService;

    public PpspsService(
            PpspsRepository ppspsRepository,
            PpspsSectionRepository sectionRepository,
            PpspsSeedService seedService) {
        this.ppspsRepository = ppspsRepository;
        this.sectionRepository = sectionRepository;
        this.seedService = seedService;
    }

    @Transactional(readOnly = true)
    public List<Ppsps> list(String chantierId) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        if (StringUtils.hasText(chantierId)) {
            return ppspsRepository.findByTenantIdAndChantierIdOrderByDateDescCreatedAtDesc(
                    tenantId, chantierId.trim());
        }
        return ppspsRepository.findByTenantIdOrderByDateDescCreatedAtDesc(tenantId);
    }

    @Transactional(readOnly = true)
    public Ppsps getById(String id) {
        seedService.seedIfEmpty();
        return resolve(id).orElseThrow(() -> new IllegalArgumentException("PPSPS not found"));
    }

    @Transactional
    public Ppsps create(PpspsCreateDto request) {
        UUID tenantId = tenantId();
        String id = StringUtils.hasText(request.getId()) ? request.getId().trim() : nextPpspsId(tenantId);
        if (ppspsRepository.findByIdAndTenantId(id, tenantId).isPresent()) {
            throw new IllegalArgumentException("PPSPS id already exists: " + id);
        }

        Ppsps entity = Ppsps.builder()
                .id(id)
                .tenantId(tenantId)
                .numero(nextNumero(tenantId, request.getChantierCode()))
                .chantierId(request.getChantierId().trim())
                .chantierCode(request.getChantierCode().trim())
                .chantierNom(request.getChantierNom().trim())
                .coordonnateurSpsNom(request.getCoordonnateurSpsNom().trim())
                .coordonnateurSpsTel(trimOrNull(request.getCoordonnateurSpsTel()))
                .date(request.getDate() != null ? request.getDate() : LocalDate.now())
                .mesuresCollectives(request.getMesuresCollectives().trim())
                .effectifsMaxJour(request.getEffectifsMaxJour())
                .hommesJourEstimes(request.getHommesJourEstimes())
                .observations(trimOrNull(request.getObservations()))
                .status(normalizeStatus(request.getStatus(), Ppsps.STATUS_BROUILLON))
                .version(1)
                .build();
        ppspsRepository.save(entity);
        seedDefaultSections(tenantId, id);
        return entity;
    }

    @Transactional(readOnly = true)
    public List<PpspsSection> listSections(String ppspsId) {
        getById(ppspsId);
        return sectionRepository.findByTenantIdAndPpspsIdOrderByOrdreAsc(tenantId(), ppspsId);
    }

    @Transactional
    public PpspsSection addSection(String ppspsId, PpspsSectionCreateDto request) {
        getById(ppspsId);
        UUID tenantId = tenantId();
        String id = StringUtils.hasText(request.getId())
                ? request.getId().trim()
                : nextSectionId(tenantId, ppspsId);
        if (sectionRepository.findByIdAndTenantId(id, tenantId).isPresent()) {
            throw new IllegalArgumentException("PPSPS section id already exists: " + id);
        }
        int ordre = request.getOrdre() != null
                ? request.getOrdre()
                : (int) sectionRepository.countByTenantIdAndPpspsId(tenantId, ppspsId);

        PpspsSection section = PpspsSection.builder()
                .id(id)
                .tenantId(tenantId)
                .ppspsId(ppspsId)
                .code(request.getCode().trim())
                .titre(request.getTitre().trim())
                .contenu(trimOrNull(request.getContenu()))
                .ordre(ordre)
                .build();
        return sectionRepository.save(section);
    }

    @Transactional
    public Ppsps incrementVersion(String id) {
        Ppsps entity = getById(id);
        entity.setVersion(entity.getVersion() + 1);
        entity.setStatus(Ppsps.STATUS_REVISION);
        return ppspsRepository.save(entity);
    }

    private void seedDefaultSections(UUID tenantId, String ppspsId) {
        int ordre = 0;
        for (PpspsSectionCreateDto template : DEFAULT_SECTIONS) {
            sectionRepository.save(PpspsSection.builder()
                    .id(ppspsId + "-sec-" + template.getCode())
                    .tenantId(tenantId)
                    .ppspsId(ppspsId)
                    .code(template.getCode())
                    .titre(template.getTitre())
                    .contenu(template.getContenu())
                    .ordre(ordre++)
                    .build());
        }
    }

    private static PpspsSectionCreateDto section(String code, String titre) {
        PpspsSectionCreateDto dto = new PpspsSectionCreateDto();
        dto.setCode(code);
        dto.setTitre(titre);
        dto.setContenu("");
        return dto;
    }

    private String nextNumero(UUID tenantId, String chantierCode) {
        String yearPart = extractYearFromChantierCode(chantierCode);
        int max = 0;
        for (Ppsps ppsps : ppspsRepository.findByTenantIdOrderByDateDescCreatedAtDesc(tenantId)) {
            Matcher matcher = PPSPS_NUMERO_SUFFIX.matcher(ppsps.getNumero());
            if (matcher.matches() && matcher.group(1).equals(yearPart)) {
                max = Math.max(max, Integer.parseInt(matcher.group(2)));
            }
        }
        return String.format(Locale.ROOT, "PPSPS-CH-%s-%03d", yearPart, max + 1);
    }

    private String extractYearFromChantierCode(String chantierCode) {
        if (StringUtils.hasText(chantierCode)) {
            Matcher matcher = Pattern.compile("(\\d{4})").matcher(chantierCode);
            if (matcher.find()) {
                return matcher.group(1);
            }
        }
        return String.valueOf(Year.now().getValue());
    }

    private String nextPpspsId(UUID tenantId) {
        int max = 0;
        for (Ppsps ppsps : ppspsRepository.findByTenantIdOrderByDateDescCreatedAtDesc(tenantId)) {
            Matcher matcher = PPSPS_ID_SUFFIX.matcher(ppsps.getId());
            if (matcher.matches()) {
                max = Math.max(max, Integer.parseInt(matcher.group(1)));
            }
        }
        return String.format(Locale.ROOT, "ppsps-%03d", max + 1);
    }

    private String nextSectionId(UUID tenantId, String ppspsId) {
        long count = sectionRepository.countByTenantIdAndPpspsId(tenantId, ppspsId);
        return String.format(Locale.ROOT, "%s-sec-%03d", ppspsId, count + 1);
    }

    private java.util.Optional<Ppsps> resolve(String rawId) {
        String id = rawId != null ? rawId.trim() : "";
        if (!StringUtils.hasText(id)) {
            return java.util.Optional.empty();
        }
        return ppspsRepository.findByIdAndTenantId(id, tenantId());
    }

    private String normalizeStatus(String raw, String fallback) {
        if (!StringUtils.hasText(raw)) {
            return fallback;
        }
        return raw.trim().toUpperCase(Locale.ROOT);
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
