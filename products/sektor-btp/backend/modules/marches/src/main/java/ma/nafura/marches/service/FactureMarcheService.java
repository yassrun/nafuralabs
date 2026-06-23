package ma.nafura.marches.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.marches.api.request.FactureMarcheCreateDto;
import ma.nafura.marches.domain.model.ContratMarche;
import ma.nafura.marches.domain.model.FactureMarche;
import ma.nafura.marches.repository.ContratMarcheRepository;
import ma.nafura.marches.repository.FactureMarcheRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class FactureMarcheService {

    private static final Logger log = LoggerFactory.getLogger(FactureMarcheService.class);

    private final FactureMarcheRepository factureRepository;
    private final ContratMarcheRepository contratRepository;
    private final FactureMarcheSeedService seedService;

    public FactureMarcheService(
            FactureMarcheRepository factureRepository,
            ContratMarcheRepository contratRepository,
            FactureMarcheSeedService seedService) {
        this.factureRepository = factureRepository;
        this.contratRepository = contratRepository;
        this.seedService = seedService;
    }

    @Transactional(readOnly = true)
    public List<FactureMarche> list(String contratId, String status, String search) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        List<FactureMarche> rows = loadRows(tenantId, contratId, status);
        if (StringUtils.hasText(search)) {
            String term = search.trim().toLowerCase(Locale.ROOT);
            rows = rows.stream().filter(f -> matchesSearch(f, term)).toList();
        }
        return rows;
    }

    @Transactional(readOnly = true)
    public FactureMarche getById(String id) {
        seedService.seedIfEmpty();
        return resolveFacture(id).orElseThrow(() -> new IllegalArgumentException("Facture marché not found"));
    }

    @Transactional
    public FactureMarche create(FactureMarcheCreateDto request) {
        UUID tenantId = tenantId();
        ContratMarche contrat = resolveContrat(request.getContratMarcheId())
                .orElseThrow(() -> new IllegalArgumentException("Contrat marché not found"));
        String id = StringUtils.hasText(request.getId()) ? request.getId().trim() : nextFactureId(tenantId);
        if (factureRepository.findByIdAndTenantId(id, tenantId).isPresent()) {
            throw new IllegalArgumentException("Facture id already exists: " + id);
        }
        String numero = StringUtils.hasText(request.getNumero())
                ? request.getNumero().trim()
                : nextNumero(tenantId);

        BigDecimal brutHt = nz(request.getMontantBrutHt());
        BigDecimal avance = nz(request.getAvanceDeduiteHt());
        BigDecimal tvaTaux = request.getTvaTaux() != null ? request.getTvaTaux() : nz(contrat.getTauxTva());
        BigDecimal rgTaux = contrat.getTauxRg() != null ? contrat.getTauxRg() : new BigDecimal("7");
        BigDecimal rasTaux = request.getRetenueSourceTaux() != null
                ? request.getRetenueSourceTaux()
                : nz(contrat.getTauxRas());

        ComputedAmounts amounts = request.getNetHt() != null && request.getNetAPayer() != null
                ? fromProvided(request)
                : computeAmounts(brutHt, avance, tvaTaux, rgTaux, rasTaux, nz(request.getTimbreFiscal()));

        FactureMarche entity = FactureMarche.builder()
                .id(id)
                .tenantId(tenantId)
                .numero(numero)
                .contratMarcheId(contrat.getId())
                .marcheNumero(contrat.getNumero())
                .chantierId(contrat.getChantierId())
                .chantierCode(contrat.getChantierCode())
                .clientNom(contrat.getClientNom())
                .montantBrutHt(brutHt)
                .avanceDeduiteHt(avance)
                .retenueGarantieHt(amounts.rgHt())
                .netHt(amounts.netHt())
                .tvaTaux(tvaTaux)
                .tvaMontant(amounts.tva())
                .netTtc(amounts.netTtc())
                .retenueSourceTaux(rasTaux)
                .retenueSourceMontant(amounts.ras())
                .timbreFiscal(amounts.timbre())
                .netAPayer(amounts.netAPayer())
                .dateEmission(request.getDateEmission())
                .dateEcheance(request.getDateEcheance())
                .status(resolveStatus(request.getStatus(), FactureMarche.STATUS_BROUILLON))
                .build();
        return factureRepository.save(entity);
    }

    @Transactional
    public FactureMarche valider(String id) {
        FactureMarche entity = getById(id);
        log.info(
                "Stub validation for facture marché {} ({}) — FactureClient creation deferred to Wave 2 Ventes",
                entity.getId(),
                entity.getNumero());
        entity.setUpdatedAt(OffsetDateTime.now());
        return factureRepository.save(entity);
    }

    private List<FactureMarche> loadRows(UUID tenantId, String contratId, String status) {
        List<FactureMarche> rows;
        if (StringUtils.hasText(contratId)) {
            rows = factureRepository.findByTenantIdAndContratMarcheIdOrderByDateEmissionDescCreatedAtDesc(
                    tenantId, contratId.trim());
        } else {
            rows = factureRepository.findByTenantIdOrderByDateEmissionDescCreatedAtDesc(tenantId);
        }
        if (StringUtils.hasText(status)) {
            String st = status.trim();
            rows = rows.stream().filter(f -> st.equals(f.getStatus())).toList();
        }
        return rows;
    }

    private Optional<FactureMarche> resolveFacture(String id) {
        UUID tenantId = tenantId();
        if (!StringUtils.hasText(id)) {
            return Optional.empty();
        }
        return factureRepository.findByIdAndTenantId(id.trim(), tenantId);
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

    private ComputedAmounts fromProvided(FactureMarcheCreateDto request) {
        return new ComputedAmounts(
                nz(request.getRetenueGarantieHt()),
                nz(request.getNetHt()),
                nz(request.getTvaMontant()),
                nz(request.getNetTtc()),
                nz(request.getRetenueSourceMontant()),
                nz(request.getTimbreFiscal()),
                nz(request.getNetAPayer()));
    }

    private ComputedAmounts computeAmounts(
            BigDecimal brutHt,
            BigDecimal avance,
            BigDecimal tvaTaux,
            BigDecimal rgTaux,
            BigDecimal rasTaux,
            BigDecimal timbre) {
        BigDecimal rgHt = brutHt.multiply(rgTaux).divide(new BigDecimal("100"), 0, RoundingMode.HALF_UP);
        BigDecimal netHt = brutHt.subtract(avance).subtract(rgHt);
        BigDecimal tva = netHt.multiply(tvaTaux).divide(new BigDecimal("100"), 0, RoundingMode.HALF_UP);
        BigDecimal netTtc = netHt.add(tva);
        BigDecimal ras = netHt.multiply(rasTaux).divide(new BigDecimal("100"), 0, RoundingMode.HALF_UP);
        BigDecimal netAPayer = netTtc.subtract(ras).subtract(timbre);
        return new ComputedAmounts(rgHt, netHt, tva, netTtc, ras, timbre, netAPayer);
    }

    private String nextNumero(UUID tenantId) {
        long count = factureRepository.countByTenantId(tenantId) + 1;
        return "FM-" + java.time.Year.now().getValue() + "-" + String.format("%05d", count);
    }

    private String nextFactureId(UUID tenantId) {
        long count = factureRepository.countByTenantId(tenantId) + 1;
        return "fm-" + String.format("%03d", count);
    }

    private String resolveStatus(String requested, String fallback) {
        if (!StringUtils.hasText(requested)) {
            return fallback;
        }
        String normalized = requested.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case FactureMarche.STATUS_BROUILLON,
                    FactureMarche.STATUS_EMISE,
                    FactureMarche.STATUS_ENVOYEE_MOA,
                    FactureMarche.STATUS_ACCEPTEE,
                    FactureMarche.STATUS_PAYEE,
                    FactureMarche.STATUS_ANNULEE -> normalized;
            default -> fallback;
        };
    }

    private boolean matchesSearch(FactureMarche f, String term) {
        return contains(f.getNumero(), term)
                || contains(f.getMarcheNumero(), term)
                || contains(f.getClientNom(), term);
    }

    private boolean contains(String value, String term) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(term);
    }

    private BigDecimal nz(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }

    private record ComputedAmounts(
            BigDecimal rgHt,
            BigDecimal netHt,
            BigDecimal tva,
            BigDecimal netTtc,
            BigDecimal ras,
            BigDecimal timbre,
            BigDecimal netAPayer) {}
}
