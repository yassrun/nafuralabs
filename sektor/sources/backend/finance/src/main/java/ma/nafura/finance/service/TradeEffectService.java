package ma.nafura.finance.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.finance.api.dto.TradeEffectDto;
import ma.nafura.finance.api.request.TradeEffectCreateDto;
import ma.nafura.finance.domain.model.TradeEffect;
import ma.nafura.finance.repository.TradeEffectRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class TradeEffectService {

    private final TradeEffectRepository repository;
    private final TradeEffectSeedService seedService;

    public TradeEffectService(TradeEffectRepository repository, TradeEffectSeedService seedService) {
        this.repository = repository;
        this.seedService = seedService;
    }

    @Transactional(readOnly = true)
    public List<TradeEffectDto> list(String status) {
        seedService.seedIfEmpty();
        List<TradeEffect> rows = StringUtils.hasText(status)
                ? repository.findByTenantIdAndStatusOrderByDueDateDesc(tenantId(), status)
                : repository.findByTenantIdOrderByDueDateDesc(tenantId());
        return rows.stream().map(this::toDto).toList();
    }

    @Transactional
    public TradeEffectDto create(TradeEffectCreateDto request) {
        TradeEffect entity = TradeEffect.builder()
                .tenantId(tenantId())
                .effectNumber(nextNumber(request.getType()))
                .effectType(request.getType())
                .invoiceId(request.getFactureId())
                .clientId(request.getClientId())
                .clientName(request.getClientName())
                .domicileBank(request.getBanqueDomicile())
                .drawnBankId(request.getBanqueTireeId())
                .amount(request.getMontant())
                .dueDate(request.getDateEcheance())
                .status(TradeEffect.STATUS_PORTEFEUILLE)
                .build();
        return toDto(repository.save(entity));
    }

    @Transactional
    public TradeEffectDto remiseEncaissement(UUID id) {
        return transition(id, TradeEffect.STATUS_REMIS_ENCAISSEMENT, LocalDate.now(), null);
    }

    @Transactional
    public TradeEffectDto escompte(UUID id, BigDecimal frais) {
        return transition(id, TradeEffect.STATUS_ESCOMPTE, null, LocalDate.now(), frais);
    }

    @Transactional
    public TradeEffectDto impaye(UUID id) {
        return transition(id, TradeEffect.STATUS_IMPAYE, null, null);
    }

    private TradeEffectDto transition(UUID id, String status, LocalDate remiseDate, BigDecimal frais) {
        return transition(id, status, remiseDate, null, frais);
    }

    private TradeEffectDto transition(
            UUID id, String status, LocalDate remiseDate, LocalDate discountDate, BigDecimal frais) {
        TradeEffect entity = require(id);
        entity.setStatus(status);
        if (remiseDate != null) {
            entity.setRemittanceDate(remiseDate);
        }
        if (discountDate != null) {
            entity.setDiscountDate(discountDate);
        }
        if (frais != null) {
            entity.setDiscountFee(frais);
        }
        return toDto(repository.save(entity));
    }

    private String nextNumber(String type) {
        String prefix = type + "-" + LocalDate.now().getYear() + "-";
        String last = repository.findTopByTenantIdOrderByEffectNumberDesc(tenantId())
                .map(TradeEffect::getEffectNumber)
                .orElse(null);
        int seq = 1;
        if (last != null && last.startsWith(prefix)) {
            try {
                seq = Integer.parseInt(last.substring(prefix.length())) + 1;
            } catch (NumberFormatException ignored) {
                seq = (int) repository.countByTenantId(tenantId()) + 1;
            }
        }
        return prefix + String.format("%03d", seq);
    }

    private TradeEffect require(UUID id) {
        return repository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Trade effect not found"));
    }

    private TradeEffectDto toDto(TradeEffect entity) {
        return TradeEffectDto.builder()
                .id(entity.getId())
                .numero(entity.getEffectNumber())
                .type(entity.getEffectType())
                .factureId(entity.getInvoiceId())
                .clientId(entity.getClientId())
                .clientName(entity.getClientName())
                .banqueDomicile(entity.getDomicileBank())
                .banqueTireeId(entity.getDrawnBankId())
                .montant(entity.getAmount())
                .dateEcheance(entity.getDueDate())
                .dateRemise(entity.getRemittanceDate())
                .dateEscompte(entity.getDiscountDate())
                .status(entity.getStatus())
                .fraisEscompte(entity.getDiscountFee())
                .build();
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
