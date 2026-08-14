package ma.nafura.rh.service;

import java.math.BigDecimal;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.collaboration.docmanager.template.PdfGenerationService;
import ma.nafura.rh.domain.model.Employe;
import ma.nafura.rh.domain.model.FichePaie;
import ma.nafura.rh.repository.EmployeRepository;
import ma.nafura.rh.repository.FichePaieRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class FichePaieService {

    private static final Pattern FICHE_ID_SUFFIX = Pattern.compile("^paie-(\\d+)$", Pattern.CASE_INSENSITIVE);
    private static final Pattern FICHE_NUMERO_SUFFIX = Pattern.compile("^PAI-(\\d{4})-(\\d+)$", Pattern.CASE_INSENSITIVE);
    private static final Pattern MOIS_PATTERN = Pattern.compile("^\\d{4}-\\d{2}$");

    private final FichePaieRepository repository;
    private final EmployeRepository employeRepository;
    private final FichePaieSeedService seedService;
    private final PdfGenerationService pdfGenerationService;

    public FichePaieService(
            FichePaieRepository repository,
            EmployeRepository employeRepository,
            FichePaieSeedService seedService,
            PdfGenerationService pdfGenerationService) {
        this.repository = repository;
        this.employeRepository = employeRepository;
        this.seedService = seedService;
        this.pdfGenerationService = pdfGenerationService;
    }

    @Transactional(readOnly = true)
    public List<FichePaie> list(String employeId, String mois, String status, String search) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        List<FichePaie> rows = loadRows(tenantId, employeId, mois, status);
        if (StringUtils.hasText(search)) {
            String term = search.trim().toLowerCase(Locale.ROOT);
            rows = rows.stream().filter(f -> matchesSearch(f, term)).toList();
        }
        return rows;
    }

    @Transactional(readOnly = true)
    public FichePaie getById(String id) {
        seedService.seedIfEmpty();
        return resolve(id).orElseThrow(() -> new IllegalArgumentException("Fiche de paie not found"));
    }

    @Transactional
    public List<FichePaie> generate(String mois) {
        String normalizedMois = normalizeMois(mois);
        UUID tenantId = tenantId();
        seedService.seedIfEmpty();

        List<FichePaie> generated = new ArrayList<>();
        for (Employe employe : employeRepository.findByTenantIdAndStatutOrderByNomAscPrenomAsc(
                tenantId, Employe.STATUT_ACTIF)) {
            if (repository.findByTenantIdAndEmployeIdAndMois(tenantId, employe.getId(), normalizedMois)
                    .isPresent()) {
                continue;
            }
            generated.add(createFromEmploye(tenantId, employe, normalizedMois, BigDecimal.ZERO, FichePaie.STATUS_BROUILLON));
        }
        return generated;
    }

    @Transactional
    public FichePaie valider(String id) {
        FichePaie entity = getById(id);
        if (!FichePaie.STATUS_BROUILLON.equals(entity.getStatus())) {
            throw new IllegalStateException("Only draft fiches can be validated");
        }
        entity.setStatus(FichePaie.STATUS_VALIDEE);
        return repository.save(entity);
    }

    @Transactional
    public FichePaie payer(String id) {
        FichePaie entity = getById(id);
        if (!FichePaie.STATUS_VALIDEE.equals(entity.getStatus())) {
            throw new IllegalStateException("Only validated fiches can be paid");
        }
        entity.setStatus(FichePaie.STATUS_PAYEE);
        return repository.save(entity);
    }

    @Transactional(readOnly = true)
    public byte[] generatePdf(String id) {
        FichePaie fiche = getById(id);
        return pdfGenerationService.htmlToPdf(buildBulletinHtml(fiche), "A4", "portrait", null);
    }

    private String buildBulletinHtml(FichePaie fiche) {
        return """
                <h1 style="font-family:sans-serif;font-size:18px;">Bulletin de paie</h1>
                <p style="font-family:sans-serif;font-size:12px;">
                  <strong>%s</strong><br/>
                  Période : %s<br/>
                  Matricule employé : %s
                </p>
                <table style="font-family:sans-serif;font-size:12px;width:100%%;border-collapse:collapse;">
                  <tr><td>Salaire de base</td><td style="text-align:right;">%s MAD</td></tr>
                  <tr><td>Indemnité transport</td><td style="text-align:right;">%s MAD</td></tr>
                  <tr><td>Indemnité représentation</td><td style="text-align:right;">%s MAD</td></tr>
                  <tr><td>Heures supplémentaires</td><td style="text-align:right;">%s MAD</td></tr>
                  <tr><td><strong>Salaire brut</strong></td><td style="text-align:right;"><strong>%s MAD</strong></td></tr>
                  <tr><td>Cotisation CNSS</td><td style="text-align:right;">-%s MAD</td></tr>
                  <tr><td>Cotisation AMO</td><td style="text-align:right;">-%s MAD</td></tr>
                  <tr><td>IGR</td><td style="text-align:right;">-%s MAD</td></tr>
                  <tr><td><strong>Net à payer</strong></td><td style="text-align:right;"><strong>%s MAD</strong></td></tr>
                </table>
                <p style="font-family:sans-serif;font-size:10px;color:#666;">Statut : %s</p>
                """.formatted(
                escapeHtml(fiche.getNumero()),
                escapeHtml(fiche.getMois()),
                escapeHtml(fiche.getEmployeId()),
                money(fiche.getSalaireBase()),
                money(fiche.getIndemniteTransport()),
                money(fiche.getIndemniteRepresentation()),
                money(fiche.getMontantHeuresSup()),
                money(fiche.getSalaireBrut()),
                money(fiche.getCotisationCnss()),
                money(fiche.getCotisationAmo()),
                money(fiche.getIgr()),
                money(fiche.getSalaireNetAPayer()),
                escapeHtml(fiche.getStatus()));
    }

    private static String money(BigDecimal value) {
        return value != null ? value.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString() : "0.00";
    }

    private static String escapeHtml(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    private FichePaie createFromEmploye(
            UUID tenantId,
            Employe employe,
            String mois,
            BigDecimal montantHeuresSup,
            String status) {
        BigDecimal salaireBase = nz(employe.getSalaireBase());
        BigDecimal indemniteRep = nz(employe.getIndemniteRepresentation());
        BigDecimal indemniteTransport = nz(employe.getIndemniteTransport());
        FichePaieCalculator.PaieComputed computed =
                FichePaieCalculator.compute(salaireBase, indemniteRep, indemniteTransport, montantHeuresSup);

        FichePaie entity = FichePaie.builder()
                .id(nextFicheId(tenantId))
                .tenantId(tenantId)
                .numero(nextNumero(tenantId))
                .employeId(employe.getId())
                .employeNom(employe.getNom() + " " + employe.getPrenom())
                .mois(mois)
                .salaireBase(salaireBase)
                .indemniteRepresentation(indemniteRep)
                .indemniteTransport(indemniteTransport)
                .montantHeuresSup(montantHeuresSup)
                .salaireBrut(computed.salaireBrut())
                .cotisationCnss(computed.cotisationCnss())
                .cotisationAmo(computed.cotisationAmo())
                .totalRetenues(computed.totalRetenues())
                .salaireNetImposable(computed.salaireNetImposable())
                .igr(computed.igr())
                .salaireNetAPayer(computed.salaireNetAPayer())
                .status(status)
                .build();
        return repository.save(entity);
    }

    private List<FichePaie> loadRows(UUID tenantId, String employeId, String mois, String status) {
        String normalizedEmployeId = normalizeFilter(employeId);
        String normalizedMois = normalizeFilter(mois);
        String normalizedStatus = normalizeFilter(status);

        List<FichePaie> rows;
        if (normalizedEmployeId != null && normalizedMois != null) {
            rows = repository.findByTenantIdAndEmployeIdAndMoisOrderByNumeroAsc(
                    tenantId, normalizedEmployeId, normalizedMois);
        } else if (normalizedEmployeId != null) {
            rows = repository.findByTenantIdAndEmployeIdOrderByMoisDescNumeroDesc(tenantId, normalizedEmployeId);
        } else if (normalizedMois != null) {
            rows = repository.findByTenantIdAndMoisOrderByNumeroAsc(tenantId, normalizedMois);
        } else {
            rows = repository.findByTenantIdOrderByMoisDescNumeroDesc(tenantId);
        }

        if (normalizedStatus != null) {
            return rows.stream().filter(f -> normalizedStatus.equals(f.getStatus())).toList();
        }
        return rows;
    }

    private boolean matchesSearch(FichePaie fiche, String term) {
        return contains(fiche.getNumero(), term)
                || contains(fiche.getEmployeNom(), term)
                || contains(fiche.getEmployeId(), term)
                || contains(fiche.getMois(), term);
    }

    private boolean contains(String value, String term) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(term);
    }

    private Optional<FichePaie> resolve(String rawId) {
        String id = rawId != null ? rawId.trim() : "";
        if (!StringUtils.hasText(id)) {
            return Optional.empty();
        }
        UUID tenantId = tenantId();
        Optional<FichePaie> byId = repository.findByIdAndTenantId(id, tenantId);
        if (byId.isPresent()) {
            return byId;
        }
        return repository.findByTenantIdOrderByMoisDescNumeroDesc(tenantId).stream()
                .filter(f -> id.equalsIgnoreCase(f.getNumero()))
                .findFirst();
    }

    private String normalizeMois(String mois) {
        if (!StringUtils.hasText(mois)) {
            throw new IllegalArgumentException("Month is required (YYYY-MM)");
        }
        String normalized = mois.trim();
        if (!MOIS_PATTERN.matcher(normalized).matches()) {
            throw new IllegalArgumentException("Invalid month format, expected YYYY-MM");
        }
        return normalized;
    }

    private String nextFicheId(UUID tenantId) {
        int max = 0;
        for (FichePaie fiche : repository.findByTenantIdOrderByMoisDescNumeroDesc(tenantId)) {
            Matcher matcher = FICHE_ID_SUFFIX.matcher(fiche.getId());
            if (matcher.matches()) {
                max = Math.max(max, Integer.parseInt(matcher.group(1)));
            }
        }
        return String.format(Locale.ROOT, "paie-%03d", max + 1);
    }

    private String nextNumero(UUID tenantId) {
        int year = Year.now().getValue();
        int max = 0;
        for (FichePaie fiche : repository.findByTenantIdOrderByMoisDescNumeroDesc(tenantId)) {
            Matcher matcher = FICHE_NUMERO_SUFFIX.matcher(fiche.getNumero());
            if (matcher.matches() && Integer.parseInt(matcher.group(1)) == year) {
                max = Math.max(max, Integer.parseInt(matcher.group(2)));
            }
        }
        return String.format(Locale.ROOT, "PAI-%d-%04d", year, max + 1);
    }

    private String normalizeFilter(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private BigDecimal nz(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
