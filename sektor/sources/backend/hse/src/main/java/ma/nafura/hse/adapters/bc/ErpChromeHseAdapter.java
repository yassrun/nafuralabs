package ma.nafura.hse.adapters.bc;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.hse.repository.FormationHseRepository;
import ma.nafura.sektor.socle.port.bc.ErpChromeHsePort;
import org.springframework.stereotype.Service;

@Service
public class ErpChromeHseAdapter implements ErpChromeHsePort {

    private final FormationHseRepository formationRepository;

    public ErpChromeHseAdapter(FormationHseRepository formationRepository) {
        this.formationRepository = formationRepository;
    }

    @Override
    public List<ExpiringFormation> expiringFormations(UUID tenantId, LocalDate from, LocalDate to) {
        return formationRepository
                .findByTenantIdAndAttestationValiditeBetweenOrderByAttestationValiditeAsc(tenantId, from, to)
                .stream()
                .map(f -> new ExpiringFormation(
                        f.getId(), f.getTitre(), f.getFormateur(), f.getAttestationValidite()))
                .toList();
    }
}
