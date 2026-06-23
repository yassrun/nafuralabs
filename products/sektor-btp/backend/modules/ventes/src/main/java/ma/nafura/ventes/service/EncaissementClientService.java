package ma.nafura.ventes.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import ma.nafura.chantiers.domain.model.Chantier;
import ma.nafura.chantiers.repository.ChantierRepository;
import ma.nafura.ventes.api.request.EncaissementClientCreateDto;
import ma.nafura.ventes.domain.model.EncaissementClient;
import ma.nafura.ventes.domain.model.FactureClient;
import ma.nafura.ventes.repository.EncaissementClientRepository;
import ma.nafura.ventes.repository.FactureClientRepository;
import ma.nafura.ventes.service.FactureClientTotalsCalculator.ChantierRates;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class EncaissementClientService {

    private final FactureClientRepository factureRepository;
    private final EncaissementClientRepository encaissementRepository;
    private final ChantierRepository chantierRepository;

    public EncaissementClientService(
            FactureClientRepository factureRepository,
            EncaissementClientRepository encaissementRepository,
            ChantierRepository chantierRepository) {
        this.factureRepository = factureRepository;
        this.encaissementRepository = encaissementRepository;
        this.chantierRepository = chantierRepository;
    }

    @Transactional(readOnly = true)
    public List<EncaissementClient> listByFacture(UUID factureId) {
        FactureClient facture = loadFacture(factureId);
        return encaissementRepository.findByTenantIdAndFacture_IdOrderByDateEncaissementAscCreatedAtAsc(
                facture.getTenantId(), factureId);
    }

    @Transactional
    public FactureClient add(UUID factureId, EncaissementClientCreateDto request) {
        FactureClient facture = loadFacture(factureId);
        UUID tenantId = facture.getTenantId();

        EncaissementClient encaissement = EncaissementClient.builder()
                .tenantId(tenantId)
                .facture(facture)
                .dateEncaissement(request.getDateEncaissement())
                .modePaiement(normalizeMode(request.getModePaiement()))
                .montantTtc(request.getMontantTtc())
                .reference(trimOrNull(request.getReference()))
                .banqueId(trimOrNull(request.getBanqueId()))
                .banque(trimOrNull(request.getBanque()))
                .notes(trimOrNull(request.getNotes()))
                .build();
        encaissementRepository.save(encaissement);

        return recalcFacturePayments(facture);
    }

    @Transactional
    public FactureClient remove(UUID factureId, UUID encaissementId) {
        FactureClient facture = loadFacture(factureId);
        EncaissementClient encaissement = encaissementRepository
                .findByIdAndTenantIdAndFacture_Id(encaissementId, facture.getTenantId(), factureId)
                .orElseThrow(() -> new IllegalArgumentException("Encaissement not found"));
        encaissementRepository.delete(encaissement);
        return recalcFacturePayments(facture);
    }

    @Transactional(readOnly = true)
    public void attachEncaissements(FactureClient facture) {
        if (facture == null || facture.getId() == null) {
            return;
        }
        List<EncaissementClient> rows =
                encaissementRepository.findByTenantIdAndFacture_IdOrderByDateEncaissementAscCreatedAtAsc(
                        facture.getTenantId(), facture.getId());
        rows.forEach(e -> e.setFacture(facture));
        facture.setEncaissements(rows);
    }

    private FactureClient recalcFacturePayments(FactureClient facture) {
        List<EncaissementClient> encaissements =
                encaissementRepository.findByTenantIdAndFacture_IdOrderByDateEncaissementAscCreatedAtAsc(
                        facture.getTenantId(), facture.getId());
        BigDecimal cumul = encaissements.stream()
                .map(e -> e.getMontantTtc() != null ? e.getMontantTtc() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        facture.setCumulEncaisseTtc(cumul);
        Chantier chantier = resolveChantier(facture.getTenantId(), facture.getChantierId());
        ChantierRates rates = chantier == null
                ? ChantierRates.empty()
                : new ChantierRates(chantier.getTauxRg(), chantier.getTauxRas());
        FactureClientTotalsCalculator.applyTotals(facture, rates);
        applyPaymentStatus(facture, cumul);

        FactureClient saved = factureRepository.save(facture);
        attachEncaissements(saved);
        return saved;
    }

    static void applyPaymentStatus(FactureClient facture, BigDecimal cumulEncaisseTtc) {
        BigDecimal cumul = cumulEncaisseTtc != null ? cumulEncaisseTtc : BigDecimal.ZERO;
        BigDecimal net = facture.getNetAPayerTtc() != null ? facture.getNetAPayerTtc() : BigDecimal.ZERO;
        String status = facture.getStatus();

        if (!isPaymentEligibleStatus(status)) {
            return;
        }

        if (cumul.compareTo(net) >= 0 && net.compareTo(BigDecimal.ZERO) > 0) {
            facture.setStatus(FactureClient.STATUS_PAYEE);
        } else if (cumul.compareTo(BigDecimal.ZERO) > 0) {
            facture.setStatus(FactureClient.STATUS_PARTIELLEMENT_PAYEE);
        } else if (FactureClient.STATUS_PARTIELLEMENT_PAYEE.equals(status)
                || FactureClient.STATUS_PAYEE.equals(status)) {
            facture.setStatus(FactureClient.STATUS_EMISE);
        }
    }

    private static boolean isPaymentEligibleStatus(String status) {
        return FactureClient.STATUS_EMISE.equals(status)
                || FactureClient.STATUS_PARTIELLEMENT_PAYEE.equals(status)
                || FactureClient.STATUS_PAYEE.equals(status);
    }

    private FactureClient loadFacture(UUID factureId) {
        return factureRepository
                .findByIdAndTenantId(factureId, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Facture client not found"));
    }

    private Chantier resolveChantier(UUID tenantId, String chantierId) {
        if (!StringUtils.hasText(chantierId)) {
            return null;
        }
        return chantierRepository
                .findByIdAndTenantId(chantierId.trim(), tenantId)
                .orElse(null);
    }

    private String normalizeMode(String mode) {
        if (!StringUtils.hasText(mode)) {
            throw new IllegalArgumentException("modePaiement is required");
        }
        return mode.trim().toUpperCase(Locale.ROOT);
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
