package ma.nafura.hse.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import ma.nafura.hse.api.dto.AuditClotureResultDto;
import ma.nafura.hse.api.dto.GeneratedNcStubDto;
import ma.nafura.hse.api.request.AuditHseCreateDto;
import ma.nafura.hse.api.request.AuditHseLigneCreateDto;
import ma.nafura.hse.domain.model.AuditHse;
import ma.nafura.hse.domain.model.AuditHseLigne;
import ma.nafura.hse.repository.AuditHseLigneRepository;
import ma.nafura.hse.repository.AuditHseRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class AuditHseService {

    private static final Pattern AUDIT_NUMERO_SUFFIX =
            Pattern.compile("^AUD-(\\d{4})-(\\d+)$", Pattern.CASE_INSENSITIVE);
    private static final Pattern AUDIT_ID_SUFFIX = Pattern.compile("^aud(\\d+)$", Pattern.CASE_INSENSITIVE);
    private static final Pattern NC_NUMERO_SUFFIX =
            Pattern.compile("^NC-(\\d{4})-(\\d+)$", Pattern.CASE_INSENSITIVE);

    private final AuditHseRepository auditRepository;
    private final AuditHseLigneRepository ligneRepository;
    private final AuditHseSeedService seedService;

    public AuditHseService(
            AuditHseRepository auditRepository,
            AuditHseLigneRepository ligneRepository,
            AuditHseSeedService seedService) {
        this.auditRepository = auditRepository;
        this.ligneRepository = ligneRepository;
        this.seedService = seedService;
    }

    @Transactional(readOnly = true)
    public List<AuditHse> list(String status) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        String normalizedStatus = normalizeFilter(status);
        if (normalizedStatus != null) {
            return auditRepository.findByTenantIdAndStatusOrderByDateAuditDescCreatedAtDesc(
                    tenantId, normalizedStatus);
        }
        return auditRepository.findByTenantIdOrderByDateAuditDescCreatedAtDesc(tenantId);
    }

    @Transactional(readOnly = true)
    public AuditHse getById(String id) {
        seedService.seedIfEmpty();
        return resolveAudit(id).orElseThrow(() -> new IllegalArgumentException("Audit HSE not found"));
    }

    @Transactional
    public AuditHse create(AuditHseCreateDto request) {
        UUID tenantId = tenantId();
        String id = StringUtils.hasText(request.getId()) ? request.getId().trim() : nextAuditId(tenantId);
        if (auditRepository.findByIdAndTenantId(id, tenantId).isPresent()) {
            throw new IllegalArgumentException("Audit id already exists: " + id);
        }

        AuditHse entity = AuditHse.builder()
                .id(id)
                .tenantId(tenantId)
                .numero(nextNumero(tenantId))
                .chantierId(trimOrNull(request.getChantierId()))
                .chantierCode(trimOrNull(request.getChantierCode()))
                .templateCode(trimOrNull(request.getTemplateCode()))
                .titre(request.getTitre().trim())
                .auditeurNom(request.getAuditeurNom().trim())
                .dateAudit(request.getDateAudit())
                .status(normalizeAuditStatus(request.getStatus(), AuditHse.STATUS_BROUILLON))
                .notes(trimOrNull(request.getNotes()))
                .build();
        return auditRepository.save(entity);
    }

    @Transactional(readOnly = true)
    public List<AuditHseLigne> listLignes(String auditId) {
        getById(auditId);
        return ligneRepository.findByTenantIdAndAuditIdOrderByOrdreAsc(tenantId(), auditId);
    }

    @Transactional
    public AuditHseLigne addLigne(String auditId, AuditHseLigneCreateDto request) {
        AuditHse audit = getById(auditId);
        if (AuditHse.STATUS_CLOTURE.equals(audit.getStatus())) {
            throw new IllegalStateException("Cannot add lines to a closed audit");
        }

        UUID tenantId = tenantId();
        String id = StringUtils.hasText(request.getId()) ? request.getId().trim() : nextLigneId(tenantId, auditId);
        if (ligneRepository.findByIdAndTenantId(id, tenantId).isPresent()) {
            throw new IllegalArgumentException("Audit line id already exists: " + id);
        }

        int ordre = request.getOrdre() != null
                ? request.getOrdre()
                : (int) ligneRepository.countByTenantIdAndAuditId(tenantId, auditId);

        AuditHseLigne ligne = AuditHseLigne.builder()
                .id(id)
                .tenantId(tenantId)
                .auditId(auditId)
                .ordre(ordre)
                .code(request.getCode().trim())
                .libelle(request.getLibelle().trim())
                .categorie(trimOrNull(request.getCategorie()))
                .reponse(normalizeReponse(request.getReponse()))
                .commentaire(trimOrNull(request.getCommentaire()))
                .build();
        AuditHseLigne saved = ligneRepository.save(ligne);
        refreshScore(audit);
        return saved;
    }

    @Transactional
    public AuditClotureResultDto cloturer(String auditId) {
        AuditHse audit = getById(auditId);
        if (AuditHse.STATUS_CLOTURE.equals(audit.getStatus())) {
            throw new IllegalStateException("Audit already closed");
        }

        UUID tenantId = tenantId();
        List<AuditHseLigne> lignes = ligneRepository.findByTenantIdAndAuditIdOrderByOrdreAsc(tenantId, auditId);
        if (lignes.isEmpty()) {
            throw new IllegalStateException("Audit must have at least one line before closing");
        }

        List<GeneratedNcStubDto> generated = new ArrayList<>();
        int ncSeq = nextNcSequence(tenantId);

        for (AuditHseLigne ligne : lignes) {
            if (!AuditHseLigne.REPONSE_NON.equals(ligne.getReponse())) {
                continue;
            }
            String ncId = "nc-stub-" + ligne.getId();
            String ncNumero = String.format(Locale.ROOT, "NC-%d-%04d", Year.now().getValue(), ncSeq++);
            String description = buildNcDescription(ligne);

            ligne.setNcId(ncId);
            ligne.setNcNumero(ncNumero);
            ligneRepository.save(ligne);

            generated.add(GeneratedNcStubDto.builder()
                    .id(ncId)
                    .numero(ncNumero)
                    .description(description)
                    .auditLigneId(ligne.getId())
                    .chantierId(audit.getChantierId())
                    .chantierCode(audit.getChantierCode())
                    .build());
        }

        refreshScore(audit);
        audit.setStatus(AuditHse.STATUS_CLOTURE);
        auditRepository.save(audit);

        String message = generated.isEmpty()
                ? "Audit clôturé sans non-conformité à générer."
                : generated.size() + " non-conformité(s) générée(s) (stub — persistance NC via B-HSE-02).";

        return AuditClotureResultDto.builder()
                .audit(audit)
                .nonConformitesGenerees(generated)
                .nbNonConformitesGenerees(generated.size())
                .message(message)
                .build();
    }

    private void refreshScore(AuditHse audit) {
        List<AuditHseLigne> lignes =
                ligneRepository.findByTenantIdAndAuditIdOrderByOrdreAsc(tenantId(), audit.getId());
        long answered = lignes.stream()
                .filter(l -> StringUtils.hasText(l.getReponse()))
                .filter(l -> !AuditHseLigne.REPONSE_NA.equals(l.getReponse()))
                .count();
        if (answered == 0) {
            audit.setScoreGlobal(null);
            auditRepository.save(audit);
            return;
        }
        long conformes = lignes.stream()
                .filter(l -> AuditHseLigne.REPONSE_OUI.equals(l.getReponse())
                        || AuditHseLigne.REPONSE_SANS_OBJET.equals(l.getReponse()))
                .count();
        BigDecimal score = BigDecimal.valueOf(conformes * 100.0 / answered).setScale(2, RoundingMode.HALF_UP);
        audit.setScoreGlobal(score);
        auditRepository.save(audit);
    }

    private String buildNcDescription(AuditHseLigne ligne) {
        StringBuilder sb = new StringBuilder("NC générée depuis audit — ").append(ligne.getLibelle());
        if (StringUtils.hasText(ligne.getCommentaire())) {
            sb.append(" — ").append(ligne.getCommentaire().trim());
        }
        return sb.toString();
    }

    private int nextNcSequence(UUID tenantId) {
        int year = Year.now().getValue();
        int max = 0;
        for (AuditHseLigne ligne : ligneRepository.findByTenantId(tenantId)) {
            if (!StringUtils.hasText(ligne.getNcNumero())) {
                continue;
            }
            Matcher matcher = NC_NUMERO_SUFFIX.matcher(ligne.getNcNumero());
            if (matcher.matches() && Integer.parseInt(matcher.group(1)) == year) {
                max = Math.max(max, Integer.parseInt(matcher.group(2)));
            }
        }
        return max + 1;
    }

    private String nextLigneId(UUID tenantId, String auditId) {
        long count = ligneRepository.countByTenantIdAndAuditId(tenantId, auditId);
        return auditId + "-l" + String.format(Locale.ROOT, "%03d", count + 1);
    }

    private String nextNumero(UUID tenantId) {
        int year = Year.now().getValue();
        int max = 0;
        for (AuditHse audit : auditRepository.findByTenantIdOrderByDateAuditDescCreatedAtDesc(tenantId)) {
            Matcher matcher = AUDIT_NUMERO_SUFFIX.matcher(audit.getNumero());
            if (matcher.matches() && Integer.parseInt(matcher.group(1)) == year) {
                max = Math.max(max, Integer.parseInt(matcher.group(2)));
            }
        }
        return String.format(Locale.ROOT, "AUD-%d-%04d", year, max + 1);
    }

    private String nextAuditId(UUID tenantId) {
        int max = 0;
        for (AuditHse audit : auditRepository.findByTenantIdOrderByDateAuditDescCreatedAtDesc(tenantId)) {
            Matcher matcher = AUDIT_ID_SUFFIX.matcher(audit.getId());
            if (matcher.matches()) {
                max = Math.max(max, Integer.parseInt(matcher.group(1)));
            }
        }
        return String.format(Locale.ROOT, "aud%03d", max + 1);
    }

    private java.util.Optional<AuditHse> resolveAudit(String rawId) {
        String id = rawId != null ? rawId.trim() : "";
        if (!StringUtils.hasText(id)) {
            return java.util.Optional.empty();
        }
        return auditRepository.findByIdAndTenantId(id, tenantId());
    }

    private String normalizeAuditStatus(String raw, String fallback) {
        if (!StringUtils.hasText(raw)) {
            return fallback;
        }
        return raw.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeReponse(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        return raw.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeFilter(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim().toUpperCase(Locale.ROOT);
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
