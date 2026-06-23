package ma.nafura.finance.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import ma.nafura.finance.api.dto.VirementDto;
import ma.nafura.finance.api.dto.VirementLineDto;
import ma.nafura.finance.api.request.VirementInterneCreateDto;
import ma.nafura.finance.api.request.VirementRemiseCreateDto;
import ma.nafura.finance.domain.model.Virement;
import ma.nafura.finance.domain.model.VirementLine;
import ma.nafura.finance.repository.VirementLineRepository;
import ma.nafura.finance.repository.VirementRepository;
import ma.nafura.finance.service.virement.VirementXmlGenerator;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class VirementService {

    private final VirementRepository virementRepository;
    private final VirementLineRepository virementLineRepository;
    private final VirementXmlGenerator xmlGenerator;

    public VirementService(
            VirementRepository virementRepository,
            VirementLineRepository virementLineRepository,
            VirementXmlGenerator xmlGenerator) {
        this.virementRepository = virementRepository;
        this.virementLineRepository = virementLineRepository;
        this.xmlGenerator = xmlGenerator;
    }

    @Transactional(readOnly = true)
    public List<VirementDto> list(String type, String status) {
        String virementType = resolveType(type);
        List<Virement> rows;
        if (StringUtils.hasText(status)) {
            rows = virementRepository.findByTenantIdAndVirementTypeAndStatusOrderByVirementDateDesc(
                    tenantId(), virementType, status);
        } else {
            rows = virementRepository.findByTenantIdAndVirementTypeOrderByVirementDateDesc(tenantId(), virementType);
        }
        return rows.stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public VirementDto getById(UUID id) {
        return toDetailDto(require(id));
    }

    @Transactional
    public VirementDto createInterne(VirementInterneCreateDto request) {
        if (request.getCompteSourceId().equals(request.getCompteDestId())) {
            throw new IllegalArgumentException("Source and destination accounts must differ");
        }
        String status = StringUtils.hasText(request.getStatus()) ? request.getStatus() : Virement.STATUS_BROUILLON;
        Virement entity = Virement.builder()
                .tenantId(tenantId())
                .virementNumber(nextNumber(Virement.TYPE_INTERNE))
                .virementType(Virement.TYPE_INTERNE)
                .virementDate(request.getDate())
                .status(status)
                .amount(request.getMontant())
                .motif(request.getMotif())
                .reference(request.getReference())
                .sourceAccountId(request.getCompteSourceId())
                .sourceAccountLabel(request.getCompteSourceLibelle())
                .destAccountId(request.getCompteDestId())
                .destAccountLabel(request.getCompteDestLibelle())
                .notes(request.getNotes())
                .build();
        return toDto(virementRepository.save(entity));
    }

    @Transactional
    public VirementDto createRemise(VirementRemiseCreateDto request) {
        BigDecimal total = request.getLines().stream()
                .map(VirementRemiseCreateDto.LineInput::getMontant)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        Virement entity = Virement.builder()
                .tenantId(tenantId())
                .virementNumber(nextNumber(Virement.TYPE_REMISE))
                .virementType(Virement.TYPE_REMISE)
                .virementDate(request.getExecutionDate())
                .executionDate(request.getExecutionDate())
                .status(Virement.STATUS_PREPARATION)
                .amount(total)
                .bankCode(request.getBankCode())
                .motif("Remise virements fournisseurs")
                .build();
        entity = virementRepository.save(entity);
        saveLines(entity.getId(), request.getLines());
        return toDetailDto(entity);
    }

    @Transactional
    public VirementDto validerInterne(UUID id) {
        Virement entity = require(id);
        if (!Virement.TYPE_INTERNE.equals(entity.getVirementType())) {
            throw new IllegalArgumentException("Not an internal transfer");
        }
        entity.setStatus(Virement.STATUS_VALIDE);
        return toDto(virementRepository.save(entity));
    }

    @Transactional
    public VirementDto annulerInterne(UUID id) {
        Virement entity = require(id);
        if (!Virement.TYPE_INTERNE.equals(entity.getVirementType())) {
            throw new IllegalArgumentException("Not an internal transfer");
        }
        entity.setStatus(Virement.STATUS_ANNULE);
        return toDto(virementRepository.save(entity));
    }

    @Transactional
    public VirementDto generateXml(UUID id, String banque) {
        Virement entity = require(id);
        if (!Virement.TYPE_REMISE.equals(entity.getVirementType())) {
            throw new IllegalArgumentException("XML generation only for remittance batches");
        }
        String bankCode = StringUtils.hasText(banque) ? banque : entity.getBankCode();
        List<VirementLine> lines =
                virementLineRepository.findByTenantIdAndVirementIdOrderByLineNumberAsc(tenantId(), id);
        if (lines.isEmpty()) {
            throw new IllegalArgumentException("Remittance has no lines");
        }
        LocalDate exec = entity.getExecutionDate() != null ? entity.getExecutionDate() : entity.getVirementDate();
        entity.setBankCode(bankCode);
        entity.setGeneratedXml(xmlGenerator.generate(bankCode, exec, lines));
        return toDetailDto(virementRepository.save(entity));
    }

    @Transactional
    public VirementDto marquerEnvoye(UUID id) {
        Virement entity = require(id);
        if (!Virement.TYPE_REMISE.equals(entity.getVirementType())) {
            throw new IllegalArgumentException("Not a remittance batch");
        }
        entity.setStatus(Virement.STATUS_ENVOYE);
        return toDetailDto(virementRepository.save(entity));
    }

    @Transactional
    public void deleteInterne(UUID id) {
        Virement entity = require(id);
        if (!Virement.TYPE_INTERNE.equals(entity.getVirementType())) {
            throw new IllegalArgumentException("Not an internal transfer");
        }
        virementRepository.delete(entity);
    }

    private void saveLines(UUID virementId, List<VirementRemiseCreateDto.LineInput> inputs) {
        int n = 1;
        for (VirementRemiseCreateDto.LineInput input : inputs) {
            virementLineRepository.save(VirementLine.builder()
                    .tenantId(tenantId())
                    .virementId(virementId)
                    .lineNumber(n++)
                    .beneficiaryName(input.getBeneficiaire())
                    .beneficiaryRib(input.getRib())
                    .amount(input.getMontant())
                    .motif(input.getMotif())
                    .referencePiece(input.getReferencePiece())
                    .build());
        }
    }

    private String resolveType(String type) {
        if ("REMISE".equalsIgnoreCase(type) || "FOURNISSEUR".equalsIgnoreCase(type)) {
            return Virement.TYPE_REMISE;
        }
        if ("INTERNE".equalsIgnoreCase(type)) {
            return Virement.TYPE_INTERNE;
        }
        if (type == null || type.isBlank()) {
            return Virement.TYPE_REMISE;
        }
        return type;
    }

    private String nextNumber(String virementType) {
        String prefix =
                (Virement.TYPE_INTERNE.equals(virementType) ? "VI" : "VR") + "-" + LocalDate.now().getYear() + "-";
        String last = virementRepository
                .findTopByTenantIdAndVirementTypeOrderByVirementNumberDesc(tenantId(), virementType)
                .map(Virement::getVirementNumber)
                .orElse(null);
        int seq = 1;
        if (last != null && last.startsWith(prefix)) {
            try {
                seq = Integer.parseInt(last.substring(prefix.length())) + 1;
            } catch (NumberFormatException ignored) {
                seq = 1;
            }
        }
        return prefix + String.format("%03d", seq);
    }

    private Virement require(UUID id) {
        return virementRepository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Virement not found"));
    }

    private VirementDto toDto(Virement entity) {
        return VirementDto.builder()
                .id(entity.getId())
                .numero(entity.getVirementNumber())
                .virementType(entity.getVirementType())
                .date(entity.getVirementDate())
                .status(entity.getStatus())
                .montant(entity.getAmount())
                .motif(entity.getMotif())
                .reference(entity.getReference())
                .compteSourceId(entity.getSourceAccountId())
                .compteSourceLibelle(entity.getSourceAccountLabel())
                .compteDestId(entity.getDestAccountId())
                .compteDestLibelle(entity.getDestAccountLabel())
                .bankCode(entity.getBankCode())
                .executionDate(entity.getExecutionDate())
                .generatedXml(entity.getGeneratedXml())
                .ecritureId(entity.getJournalEntryId())
                .notes(entity.getNotes())
                .build();
    }

    private VirementDto toDetailDto(Virement entity) {
        List<VirementLineDto> lines = new ArrayList<>();
        if (Virement.TYPE_REMISE.equals(entity.getVirementType())) {
            lines = virementLineRepository
                    .findByTenantIdAndVirementIdOrderByLineNumberAsc(tenantId(), entity.getId())
                    .stream()
                    .map(this::toLineDto)
                    .toList();
        }
        return VirementDto.builder()
                .id(entity.getId())
                .numero(entity.getVirementNumber())
                .virementType(entity.getVirementType())
                .date(entity.getVirementDate())
                .status(entity.getStatus())
                .montant(entity.getAmount())
                .motif(entity.getMotif())
                .reference(entity.getReference())
                .compteSourceId(entity.getSourceAccountId())
                .compteSourceLibelle(entity.getSourceAccountLabel())
                .compteDestId(entity.getDestAccountId())
                .compteDestLibelle(entity.getDestAccountLabel())
                .bankCode(entity.getBankCode())
                .executionDate(entity.getExecutionDate())
                .generatedXml(entity.getGeneratedXml())
                .ecritureId(entity.getJournalEntryId())
                .notes(entity.getNotes())
                .lines(lines)
                .build();
    }

    private VirementLineDto toLineDto(VirementLine line) {
        return VirementLineDto.builder()
                .id(line.getId())
                .beneficiaire(line.getBeneficiaryName())
                .rib(line.getBeneficiaryRib())
                .montant(line.getAmount())
                .motif(line.getMotif())
                .referencePiece(line.getReferencePiece())
                .build();
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
