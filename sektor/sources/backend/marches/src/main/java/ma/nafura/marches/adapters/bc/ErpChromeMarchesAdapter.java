package ma.nafura.marches.adapters.bc;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.marches.domain.caution.CautionMarche;
import ma.nafura.marches.domain.facture.FactureMarche;
import ma.nafura.marches.repository.CautionMarcheRepository;
import ma.nafura.marches.repository.FactureMarcheRepository;
import ma.nafura.sektor.socle.port.bc.ErpChromeMarchesPort;
import org.springframework.stereotype.Service;

@Service
public class ErpChromeMarchesAdapter implements ErpChromeMarchesPort {

    private static final List<String> NOT_OVERDUE_STATUSES =
            List.of(FactureMarche.STATUS_PAYEE, FactureMarche.STATUS_BROUILLON);

    private static final List<String> ACTIVE_CAUTION_STATUSES =
            List.of(CautionMarche.STATUS_ACTIVE, CautionMarche.STATUS_RENOUVELEE);

    private final FactureMarcheRepository factureRepository;
    private final CautionMarcheRepository cautionRepository;

    public ErpChromeMarchesAdapter(
            FactureMarcheRepository factureRepository, CautionMarcheRepository cautionRepository) {
        this.factureRepository = factureRepository;
        this.cautionRepository = cautionRepository;
    }

    @Override
    public List<OverdueInvoice> overdueInvoices(UUID tenantId, LocalDate today) {
        return factureRepository
                .findByTenantIdAndStatusNotInAndDateEcheanceLessThan(tenantId, NOT_OVERDUE_STATUSES, today)
                .stream()
                .map(f -> new OverdueInvoice(
                        f.getId(),
                        f.getNumero(),
                        f.getClientNom(),
                        f.getNetAPayer(),
                        f.getDateEcheance()))
                .toList();
    }

    @Override
    public List<ExpiringCaution> expiringCautions(UUID tenantId, LocalDate today, int days) {
        LocalDate limit = today.plusDays(Math.max(days, 0));
        return cautionRepository
                .findByTenantIdAndStatusInAndDateExpirationBetweenOrderByDateExpirationAsc(
                        tenantId, ACTIVE_CAUTION_STATUSES, today, limit)
                .stream()
                .map(c -> new ExpiringCaution(
                        c.getId(),
                        c.getNumero(),
                        c.getBanqueNom(),
                        c.getMontant(),
                        c.getDateExpiration(),
                        c.getContratMarcheId()))
                .toList();
    }
}
