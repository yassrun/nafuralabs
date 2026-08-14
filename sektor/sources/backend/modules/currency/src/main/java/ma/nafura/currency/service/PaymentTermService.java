package ma.nafura.currency.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.currency.api.dto.PaymentTermDetailDto;
import ma.nafura.currency.api.request.PaymentTermCreateDto;
import ma.nafura.currency.api.request.PaymentTermInstallmentInputDto;
import ma.nafura.currency.api.request.PaymentTermUpdateDto;
import ma.nafura.currency.domain.model.PaymentTerm;
import ma.nafura.currency.domain.model.PaymentTermInstallment;
import ma.nafura.currency.mapper.PaymentTermMapper;
import ma.nafura.currency.repository.PaymentTermInstallmentRepository;
import ma.nafura.currency.repository.PaymentTermRepository;
import ma.nafura.currency.service.base.PaymentTermServiceBase;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class PaymentTermService extends PaymentTermServiceBase {

    private final PaymentTermRepository paymentTermRepository;
    private final PaymentTermInstallmentRepository installmentRepository;

    public PaymentTermService(
            PaymentTermRepository repository,
            PaymentTermMapper mapper,
            PaymentTermInstallmentRepository installmentRepository) {
        super(repository, mapper);
        this.paymentTermRepository = repository;
        this.installmentRepository = installmentRepository;
    }

    @Transactional(readOnly = true)
    public Page<PaymentTermDetailDto> listDetailed(int page, int size, String search, String sort) {
        Pageable pageable = PageRequest.of(page, size, parseSort(sort));
        Page<PaymentTerm> terms =
                StringUtils.hasText(search)
                        ? paymentTermRepository.findByTenantId(currentTenantId(), pageable)
                        : paymentTermRepository.findByTenantId(currentTenantId(), pageable);

        List<UUID> ids = terms.getContent().stream().map(PaymentTerm::getId).toList();
        Map<UUID, List<PaymentTermInstallmentInputDto>> installmentsByTerm = loadInstallmentInputs(ids);

        List<PaymentTermDetailDto> content = terms.getContent().stream()
                .map(term -> toDetail(term, installmentsByTerm.getOrDefault(term.getId(), List.of())))
                .toList();
        return new PageImpl<>(content, pageable, terms.getTotalElements());
    }

    @Transactional(readOnly = true)
    public PaymentTermDetailDto getDetailed(UUID id) {
        PaymentTerm term = paymentTermRepository
                .findByIdAndTenantId(id, currentTenantId())
                .orElseThrow(() -> new IllegalArgumentException("Payment term not found"));
        List<PaymentTermInstallmentInputDto> installments = loadInstallmentInputs(List.of(id)).getOrDefault(id, List.of());
        return toDetail(term, installments);
    }

    @Transactional
    public PaymentTermDetailDto createDetailed(PaymentTermCreateDto request) {
        applyDefaults(request);
        PaymentTerm saved = super.create(request);
        applyBtpFields(saved, request.getTermType(), request.getIsDefault(), request.getNotes());
        saved = paymentTermRepository.save(saved);
        replaceInstallments(saved.getId(), request.getInstallments());
        if (Boolean.TRUE.equals(saved.getIsDefault())) {
            clearOtherDefaults(saved.getId());
        }
        return getDetailed(saved.getId());
    }

    @Transactional
    public PaymentTermDetailDto updateDetailed(UUID id, PaymentTermUpdateDto request) {
        PaymentTerm term = paymentTermRepository
                .findByIdAndTenantId(id, currentTenantId())
                .orElseThrow(() -> new IllegalArgumentException("Payment term not found"));
        super.update(id, request);
        if (request.getTermType() != null) {
            term.setTermType(request.getTermType());
        }
        if (request.getIsDefault() != null) {
            term.setIsDefault(request.getIsDefault());
        }
        if (request.getNotes() != null) {
            term.setNotes(request.getNotes());
        }
        paymentTermRepository.save(term);
        if (request.getInstallments() != null) {
            replaceInstallments(id, request.getInstallments());
        }
        if (Boolean.TRUE.equals(term.getIsDefault())) {
            clearOtherDefaults(id);
        }
        return getDetailed(id);
    }

    private void applyDefaults(PaymentTermCreateDto request) {
        if (request.getDays() == null) {
            request.setDays(0);
        }
        if (request.getTermType() == null) {
            request.setTermType("DELAI_SIMPLE");
        }
        if (request.getIsDefault() == null) {
            request.setIsDefault(false);
        }
    }

    private void applyBtpFields(PaymentTerm term, String termType, Boolean isDefault, String notes) {
        if (termType != null) {
            term.setTermType(termType);
        }
        if (isDefault != null) {
            term.setIsDefault(isDefault);
        }
        if (notes != null) {
            term.setNotes(notes);
        }
    }

    private void replaceInstallments(UUID paymentTermId, List<PaymentTermInstallmentInputDto> installments) {
        UUID tenantId = currentTenantId();
        installmentRepository.deleteByTenantIdAndPaymentTermId(tenantId, paymentTermId);
        if (installments == null || installments.isEmpty()) {
            return;
        }
        int order = 1;
        for (PaymentTermInstallmentInputDto input : installments) {
            PaymentTermInstallment row = PaymentTermInstallment.builder()
                    .tenantId(tenantId)
                    .paymentTermId(paymentTermId)
                    .lineOrder(input.getLineOrder() != null ? input.getLineOrder() : order++)
                    .percentage(input.getPercentage())
                    .daysOffset(input.getDaysOffset() != null ? input.getDaysOffset() : 0)
                    .description(input.getDescription())
                    .build();
            installmentRepository.save(row);
        }
    }

    private Map<UUID, List<PaymentTermInstallmentInputDto>> loadInstallmentInputs(List<UUID> paymentTermIds) {
        if (paymentTermIds.isEmpty()) {
            return Map.of();
        }
        List<PaymentTermInstallment> rows =
                installmentRepository.findByTenantIdAndPaymentTermIdInOrderByPaymentTermIdAscLineOrderAsc(
                        currentTenantId(), paymentTermIds);
        Map<UUID, List<PaymentTermInstallmentInputDto>> map = new LinkedHashMap<>();
        for (PaymentTermInstallment row : rows) {
            map.computeIfAbsent(row.getPaymentTermId(), k -> new ArrayList<>())
                    .add(toInstallmentInput(row));
        }
        return map;
    }

    private static PaymentTermInstallmentInputDto toInstallmentInput(PaymentTermInstallment row) {
        PaymentTermInstallmentInputDto dto = new PaymentTermInstallmentInputDto();
        dto.setLineOrder(row.getLineOrder());
        dto.setPercentage(row.getPercentage());
        dto.setDaysOffset(row.getDaysOffset());
        dto.setDescription(row.getDescription());
        return dto;
    }

    private static PaymentTermDetailDto toDetail(
            PaymentTerm term, List<PaymentTermInstallmentInputDto> installments) {
        return new PaymentTermDetailDto(
                term.getId(),
                term.getCode(),
                term.getName(),
                term.getDays(),
                term.getDiscountDays(),
                term.getDiscountPercent(),
                term.getDescription(),
                term.getTermType(),
                term.getIsDefault(),
                term.getNotes(),
                term.getIsActive(),
                term.getCreatedAt(),
                term.getUpdatedAt(),
                installments);
    }

    private void clearOtherDefaults(UUID keepId) {
        UUID tenantId = currentTenantId();
        for (PaymentTerm row : paymentTermRepository.findByTenantId(tenantId)) {
            if (!keepId.equals(row.getId()) && Boolean.TRUE.equals(row.getIsDefault())) {
                row.setIsDefault(false);
                paymentTermRepository.save(row);
            }
        }
    }

    private static Sort parseSort(String sort) {
        if (!StringUtils.hasText(sort)) {
            return Sort.by(Sort.Direction.ASC, "code");
        }
        String[] parts = sort.split(",", 2);
        Sort.Direction direction =
                parts.length > 1 && "desc".equalsIgnoreCase(parts[1].trim())
                        ? Sort.Direction.DESC
                        : Sort.Direction.ASC;
        return Sort.by(direction, parts[0].trim());
    }

    private static UUID currentTenantId() {
        return TenantContext.getTenantId();
    }
}
