package ma.nafura.marches.service;

import java.util.List;
import java.util.UUID;
import ma.nafura.marches.domain.model.IndiceBtp;
import ma.nafura.marches.repository.IndiceBtpRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class IndiceBtpService {

    private final IndiceBtpRepository indiceRepository;
    private final IndiceBtpSeedService seedService;

    public IndiceBtpService(IndiceBtpRepository indiceRepository, IndiceBtpSeedService seedService) {
        this.indiceRepository = indiceRepository;
        this.seedService = seedService;
    }

    @Transactional(readOnly = true)
    public List<IndiceBtp> listByPeriode(String periode) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        if (!StringUtils.hasText(periode)) {
            throw new IllegalArgumentException("periode is required");
        }
        return indiceRepository.findByTenantIdAndPeriodeOrderByCodeAsc(tenantId, periode.trim());
    }

    @Transactional
    public void importCsvStub() {
        throw new ResponseStatusException(
                HttpStatus.NOT_IMPLEMENTED, "CSV import ANP/HCP not implemented yet");
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
