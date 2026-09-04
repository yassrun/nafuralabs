package ma.nafura.achats.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import ma.nafura.achats.api.request.PartnerContactCreateDto;
import ma.nafura.achats.api.request.PartnerContactUpdateDto;
import ma.nafura.achats.domain.fournisseur.PartnerContact;
import ma.nafura.achats.mapper.PartnerContactMapper;
import ma.nafura.achats.repository.PartnerContactRepository;
import ma.nafura.achats.repository.PartnerRepository;
import ma.nafura.achats.service.base.PartnerContactServiceBase;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PartnerContactService extends PartnerContactServiceBase {

    private final PartnerRepository partnerRepository;

    public PartnerContactService(
            PartnerContactRepository repository,
            PartnerContactMapper mapper,
            PartnerRepository partnerRepository) {
        super(repository, mapper);
        this.partnerRepository = partnerRepository;
    }

    @Override
    @Transactional
    public PartnerContact create(PartnerContactCreateDto request) {
        partnerRepository
                .findByIdAndTenantId(request.getPartnerId(), tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Partner not found"));
        if (Boolean.TRUE.equals(request.getIsPrimary())) {
            clearPrimary(request.getPartnerId());
        }
        return super.create(request);
    }

    @Override
    @Transactional
    public PartnerContact update(UUID id, PartnerContactUpdateDto request) {
        PartnerContact current = getByIdOrThrow(id);
        if (Boolean.TRUE.equals(request.getIsPrimary())) {
            clearPrimary(current.getPartnerId());
        }
        return super.update(id, request);
    }

    @Transactional(readOnly = true)
    public List<PartnerContact> listForPartner(UUID partnerId) {
        List<PartnerContact> rows = new ArrayList<>(
                contactRepository.findByTenantIdAndPartnerIdOrderByNomAsc(tenantId(), partnerId));
        rows.sort(Comparator
                .comparing((PartnerContact c) -> !Boolean.TRUE.equals(c.getIsPrimary()))
                .thenComparing(c -> c.getNom() == null ? "" : c.getNom(), String.CASE_INSENSITIVE_ORDER));
        return rows;
    }

    private void clearPrimary(UUID partnerId) {
        contactRepository.clearPrimaryForPartner(tenantId(), partnerId);
        contactRepository.flush();
    }
}
