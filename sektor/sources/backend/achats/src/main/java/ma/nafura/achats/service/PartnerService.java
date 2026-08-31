package ma.nafura.achats.service;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import ma.nafura.achats.api.request.PartnerCreateDto;
import ma.nafura.achats.api.request.PartnerUpdateDto;
import ma.nafura.achats.domain.fournisseur.Partner;
import ma.nafura.achats.domain.fournisseur.PartnerRole;
import ma.nafura.achats.domain.fournisseur.PartnerRoleType;
import ma.nafura.achats.mapper.PartnerMapper;
import ma.nafura.achats.repository.PartnerRepository;
import ma.nafura.achats.repository.PartnerRoleRepository;
import ma.nafura.achats.service.base.PartnerServiceBase;
import ma.nafura.achats.validation.IceValidation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PartnerService extends PartnerServiceBase {

    private final PartnerRoleRepository roleRepository;

    public PartnerService(
            PartnerRepository repository, PartnerMapper mapper, PartnerRoleRepository roleRepository) {
        super(repository, mapper);
        this.roleRepository = roleRepository;
    }

    @Override
    @Transactional
    public Partner create(PartnerCreateDto request) {
        IceValidation.requireValid(request.getIce());
        UUID tenantId = tenantId();
        if (partnerRepository.existsByTenantIdAndCode(tenantId, request.getCode())) {
            throw new IllegalArgumentException("Partner code already exists for tenant");
        }
        Partner partner = super.create(request);
        assignRoles(partner.getId(), request.getRoles());
        return partner;
    }

    @Override
    @Transactional
    public Partner update(UUID id, PartnerUpdateDto request) {
        if (request.getIce() != null) {
            IceValidation.requireValid(request.getIce());
        }
        return super.update(id, request);
    }

    @Transactional(readOnly = true)
    public Page<Partner> listByRole(PartnerRoleType role, int page, int size, Sort sort, String q) {
        String query = q == null ? null : q.trim();
        if (query != null && !query.isEmpty()) {
            Pageable pageable = PageRequest.of(page, size, Sort.by("raisonSociale"));
            Page<Partner> pageResult =
                    partnerRepository.findByTenantIdAndRoleAndQuery(tenantId(), role, query, pageable);
            List<Partner> ranked = rankExactCodeFirst(pageResult.getContent(), query);
            return new PageImpl<>(ranked, pageable, pageResult.getTotalElements());
        }
        Pageable pageable = sort != null ? PageRequest.of(page, size, sort) : PageRequest.of(page, size);
        return partnerRepository.findByTenantIdAndRole(tenantId(), role, pageable);
    }

    @Transactional(readOnly = true)
    public List<PartnerRole> listRoles(UUID partnerId) {
        return roleRepository.findByTenantIdAndPartnerId(tenantId(), partnerId);
    }

    @Transactional
    public PartnerRole addRole(UUID partnerId, PartnerRoleType role) {
        getById(partnerId).orElseThrow(() -> new IllegalArgumentException("Partner not found"));
        UUID tenantId = tenantId();
        if (roleRepository.existsByTenantIdAndPartnerIdAndRole(tenantId, partnerId, role)) {
            throw new IllegalArgumentException("Role already assigned");
        }
        PartnerRole partnerRole = PartnerRole.builder()
                .tenantId(tenantId)
                .partnerId(partnerId)
                .role(role)
                .build();
        return roleRepository.save(partnerRole);
    }

    @Transactional
    public void removeRole(UUID partnerId, PartnerRoleType role) {
        getById(partnerId).orElseThrow(() -> new IllegalArgumentException("Partner not found"));
        roleRepository.deleteByTenantIdAndPartnerIdAndRole(tenantId(), partnerId, role);
    }

    private void assignRoles(UUID partnerId, List<PartnerRoleType> roles) {
        if (roles == null || roles.isEmpty()) {
            return;
        }
        UUID tenantId = tenantId();
        for (PartnerRoleType role : roles) {
            if (!roleRepository.existsByTenantIdAndPartnerIdAndRole(tenantId, partnerId, role)) {
                roleRepository.save(PartnerRole.builder()
                        .tenantId(tenantId)
                        .partnerId(partnerId)
                        .role(role)
                        .build());
            }
        }
    }

    private static List<Partner> rankExactCodeFirst(List<Partner> partners, String query) {
        String needle = query.trim().toLowerCase();
        return partners.stream()
                .sorted(Comparator.comparing(
                        (Partner p) -> !needle.equals(p.getCode() == null ? "" : p.getCode().toLowerCase())))
                .toList();
    }
}
