package ma.nafura.consultation.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import ma.nafura.consultation.api.request.ComposantInputDto;
import ma.nafura.consultation.api.request.ImportComposantDto;
import ma.nafura.consultation.api.request.NoeudCreateDto;
import ma.nafura.consultation.api.request.NoeudUpdateDto;
import ma.nafura.consultation.api.request.PostePricingDto;
import ma.nafura.consultation.domain.model.Consultation;
import ma.nafura.consultation.domain.model.ConsultationComposant;
import ma.nafura.consultation.domain.model.ConsultationNoeud;
import ma.nafura.consultation.repository.ConsultationComposantRepository;
import ma.nafura.consultation.repository.ConsultationNoeudRepository;
import ma.nafura.consultation.repository.ConsultationRepository;
import ma.nafura.etudes.api.request.ComposantDpuInputDto;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import ma.nafura.etudes.service.port.DecompositionSuggestionPort;
import ma.nafura.etudes.service.port.DescriptifResolverPort;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class ConsultationNoeudService {

    private final ConsultationRepository consultationRepository;
    private final ConsultationNoeudRepository noeudRepository;
    private final ConsultationComposantRepository composantRepository;
    private final ConsultationPricingCalculator pricingCalculator;
    private final DescriptifResolverPort descriptifResolverPort;
    private final DecompositionSuggestionPort decompositionSuggestionPort;

    public ConsultationNoeudService(
            ConsultationRepository consultationRepository,
            ConsultationNoeudRepository noeudRepository,
            ConsultationComposantRepository composantRepository,
            ConsultationPricingCalculator pricingCalculator,
            DescriptifResolverPort descriptifResolverPort,
            DecompositionSuggestionPort decompositionSuggestionPort) {
        this.consultationRepository = consultationRepository;
        this.noeudRepository = noeudRepository;
        this.composantRepository = composantRepository;
        this.pricingCalculator = pricingCalculator;
        this.descriptifResolverPort = descriptifResolverPort;
        this.decompositionSuggestionPort = decompositionSuggestionPort;
    }

    @Transactional
    public ConsultationNoeud createNoeud(UUID consultationId, NoeudCreateDto dto) {
        requireEditableConsultation(consultationId);
        String type = dto.getType().trim().toUpperCase();
        if (!ConsultationNoeud.TYPE_LOT.equals(type)
                && !ConsultationNoeud.TYPE_SOUS_LOT.equals(type)
                && !ConsultationNoeud.TYPE_POSTE.equals(type)) {
            throw new IllegalArgumentException("Invalid node type: " + type);
        }
        UUID parentId = dto.getParentId();
        if (parentId != null) {
            ConsultationNoeud parent = requireNoeud(parentId);
            if (!consultationId.equals(parent.getConsultationId())) {
                throw new IllegalArgumentException("Parent node does not belong to this consultation");
            }
            if (ConsultationNoeud.TYPE_POSTE.equals(parent.getType())) {
                throw new IllegalArgumentException("Cannot add a child under a POSTE");
            }
        }
        boolean isPoste = ConsultationNoeud.TYPE_POSTE.equals(type);
        String mode = null;
        if (isPoste) {
            mode = StringUtils.hasText(dto.getMode())
                    ? dto.getMode().trim().toUpperCase()
                    : ConsultationNoeud.MODE_FOURNI;
        }
        int ordre = dto.getOrdre() != null
                ? dto.getOrdre()
                : nextOrdre(consultationId, parentId);
        ConsultationNoeud noeud = ConsultationNoeud.builder()
                .tenantId(tenantId())
                .consultationId(consultationId)
                .parentId(parentId)
                .type(type)
                .code(trimOrNull(dto.getCode()))
                .libelle(dto.getLibelle().trim())
                .unite(trimOrNull(dto.getUnite()))
                .quantite(dto.getQuantite())
                .descriptif(trimOrNull(dto.getDescriptif()))
                .ordre(ordre)
                .mode(mode)
                .fraisGenerauxPercent(isPoste ? new BigDecimal("8") : null)
                .margePercent(isPoste ? BigDecimal.ZERO : null)
                .deboursSec(isPoste ? BigDecimal.ZERO : null)
                .prixVenteHt(isPoste ? BigDecimal.ZERO : null)
                .build();
        return attachComposants(noeudRepository.save(noeud));
    }

    @Transactional
    public ConsultationNoeud updateNoeud(UUID noeudId, NoeudUpdateDto dto) {
        ConsultationNoeud noeud = requireNoeud(noeudId);
        requireEditableConsultation(noeud.getConsultationId());
        if (StringUtils.hasText(dto.getLibelle())) {
            noeud.setLibelle(dto.getLibelle().trim());
        }
        if (dto.getCode() != null) {
            noeud.setCode(trimOrNull(dto.getCode()));
        }
        if (dto.getUnite() != null) {
            noeud.setUnite(trimOrNull(dto.getUnite()));
        }
        if (dto.getQuantite() != null) {
            noeud.setQuantite(dto.getQuantite());
        }
        if (dto.getDescriptif() != null) {
            noeud.setDescriptif(trimOrNull(dto.getDescriptif()));
        }
        if (dto.getOrdre() != null) {
            noeud.setOrdre(dto.getOrdre());
        }
        if (StringUtils.hasText(dto.getMode()) && ConsultationNoeud.TYPE_POSTE.equals(noeud.getType())) {
            String mode = dto.getMode().trim().toUpperCase();
            if (!ConsultationNoeud.MODE_FOURNI.equals(mode)
                    && !ConsultationNoeud.MODE_DECOMPOSE.equals(mode)) {
                throw new IllegalArgumentException("Invalid mode: " + mode);
            }
            noeud.setMode(mode);
        }
        return attachComposants(noeudRepository.save(noeud));
    }

    @Transactional
    public void deleteNoeud(UUID noeudId) {
        ConsultationNoeud noeud = requireNoeud(noeudId);
        requireEditableConsultation(noeud.getConsultationId());
        deleteSubtree(noeud);
    }

    @Transactional
    public ConsultationNoeud setMode(UUID noeudId, String mode) {
        ConsultationNoeud noeud = requireNoeud(noeudId);
        requireEditableConsultation(noeud.getConsultationId());
        if (!ConsultationNoeud.TYPE_POSTE.equals(noeud.getType())) {
            throw new IllegalArgumentException("Mode can only be set on a POSTE node");
        }
        String normalized = mode != null ? mode.trim().toUpperCase() : null;
        if (!ConsultationNoeud.MODE_FOURNI.equals(normalized)
                && !ConsultationNoeud.MODE_DECOMPOSE.equals(normalized)) {
            throw new IllegalArgumentException("Invalid mode: " + mode);
        }
        noeud.setMode(normalized);
        return attachComposants(noeudRepository.save(noeud));
    }

    @Transactional
    public ConsultationNoeud updateDescriptif(UUID noeudId, String descriptif) {
        ConsultationNoeud noeud = requireNoeud(noeudId);
        requireEditableConsultation(noeud.getConsultationId());
        noeud.setDescriptif(StringUtils.hasText(descriptif) ? descriptif.trim() : null);
        return attachComposants(noeudRepository.save(noeud));
    }

    @Transactional
    public ConsultationNoeud updatePricing(UUID noeudId, PostePricingDto dto) {
        ConsultationNoeud noeud = requireNoeud(noeudId);
        requireEditableConsultation(noeud.getConsultationId());
        if (!ConsultationNoeud.TYPE_POSTE.equals(noeud.getType())) {
            throw new IllegalArgumentException("Pricing can only be set on a POSTE");
        }
        if (dto.getFraisGenerauxPercent() != null) {
            noeud.setFraisGenerauxPercent(dto.getFraisGenerauxPercent());
        }
        if (dto.getMargePercent() != null) {
            noeud.setMargePercent(dto.getMargePercent());
        }
        recalculatePostePricing(noeud);
        return attachComposants(noeudRepository.save(noeud));
    }

    @Transactional
    public ConsultationComposant addComposant(UUID noeudId, ComposantInputDto input) {
        ConsultationNoeud noeud = requireNoeud(noeudId);
        requireEditableConsultation(noeud.getConsultationId());
        if (!ConsultationNoeud.TYPE_POSTE.equals(noeud.getType())) {
            throw new IllegalArgumentException("Composants can only be added on a POSTE");
        }
        if (!ConsultationNoeud.MODE_DECOMPOSE.equals(noeud.getMode())) {
            noeud.setMode(ConsultationNoeud.MODE_DECOMPOSE);
            noeudRepository.save(noeud);
        }
        int ordre = input.getOrdre() != null
                ? input.getOrdre()
                : composantRepository.findByTenantIdAndNoeudIdOrderByOrdreAsc(tenantId(), noeud.getId()).size();
        BigDecimal quantite = input.getQuantite() != null ? input.getQuantite() : input.getRendement();
        BigDecimal pu = input.getPrixUnitaire();
        ConsultationComposant composant = ConsultationComposant.builder()
                .tenantId(tenantId())
                .noeudId(noeud.getId())
                .type(StringUtils.hasText(input.getType())
                        ? input.getType().trim().toUpperCase()
                        : ConsultationComposant.TYPE_MATERIAU)
                .designation(input.getDesignation().trim())
                .unite(trimOrNull(input.getUnite()))
                .rendement(input.getRendement() != null ? input.getRendement() : quantite)
                .quantite(quantite)
                .prixUnitaire(pu)
                .total(pricingCalculator.computeLineTotal(quantite, pu))
                .ordre(ordre)
                .build();
        ConsultationComposant saved = composantRepository.save(composant);
        recalculatePostePricing(noeud);
        noeudRepository.save(noeud);
        return saved;
    }

    @Transactional
    public ConsultationComposant updateComposant(UUID composantId, ComposantInputDto input) {
        ConsultationComposant composant = requireComposant(composantId);
        ConsultationNoeud noeud = requireNoeud(composant.getNoeudId());
        requireEditableConsultation(noeud.getConsultationId());
        if (StringUtils.hasText(input.getType())) {
            composant.setType(input.getType().trim().toUpperCase());
        }
        if (StringUtils.hasText(input.getDesignation())) {
            composant.setDesignation(input.getDesignation().trim());
        }
        if (input.getUnite() != null) {
            composant.setUnite(trimOrNull(input.getUnite()));
        }
        if (input.getRendement() != null) {
            composant.setRendement(input.getRendement());
        }
        if (input.getQuantite() != null) {
            composant.setQuantite(input.getQuantite());
        } else if (input.getRendement() != null && composant.getQuantite() == null) {
            composant.setQuantite(input.getRendement());
        }
        if (input.getPrixUnitaire() != null) {
            composant.setPrixUnitaire(input.getPrixUnitaire());
        }
        if (input.getOrdre() != null) {
            composant.setOrdre(input.getOrdre());
        }
        composant.setTotal(pricingCalculator.computeLineTotal(composant.getQuantite(), composant.getPrixUnitaire()));
        ConsultationComposant saved = composantRepository.save(composant);
        recalculatePostePricing(noeud);
        noeudRepository.save(noeud);
        return saved;
    }

    @Transactional
    public void deleteComposant(UUID composantId) {
        ConsultationComposant composant = requireComposant(composantId);
        ConsultationNoeud noeud = requireNoeud(composant.getNoeudId());
        requireEditableConsultation(noeud.getConsultationId());
        composantRepository.delete(composant);
        recalculatePostePricing(noeud);
        noeudRepository.save(noeud);
    }

    @Transactional(readOnly = true)
    public String suggestDescriptif(UUID noeudId) {
        ConsultationNoeud noeud = requireNoeud(noeudId);
        return descriptifResolverPort.resolveDescriptif(toDpgfBridge(noeud));
    }

    @Transactional(readOnly = true)
    public List<ImportComposantDto> suggestDecomposition(UUID noeudId) {
        ConsultationNoeud noeud = requireNoeud(noeudId);
        return decompositionSuggestionPort.suggest(toDpgfBridge(noeud)).stream()
                .map(this::toImportComposant)
                .toList();
    }

    public boolean isDescriptifResolverAvailable() {
        return descriptifResolverPort.isAvailable();
    }

    public boolean isDecompositionSuggestionAvailable() {
        return decompositionSuggestionPort.isAvailable();
    }

    void recalculatePostePricing(ConsultationNoeud poste) {
        List<ConsultationComposant> composants =
                composantRepository.findByTenantIdAndNoeudIdOrderByOrdreAsc(tenantId(), poste.getId());
        BigDecimal debours = pricingCalculator.computeDeboursSec(composants);
        poste.setDeboursSec(debours);
        if (poste.getFraisGenerauxPercent() == null) {
            poste.setFraisGenerauxPercent(new BigDecimal("8"));
        }
        if (poste.getMargePercent() == null) {
            poste.setMargePercent(BigDecimal.ZERO);
        }
        poste.setPrixVenteHt(pricingCalculator.computePrixVenteHt(
                debours, poste.getFraisGenerauxPercent(), poste.getMargePercent()));
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private void deleteSubtree(ConsultationNoeud noeud) {
        List<ConsultationNoeud> children = noeudRepository
                .findByTenantIdAndConsultationIdOrderByOrdreAsc(tenantId(), noeud.getConsultationId())
                .stream()
                .filter(n -> noeud.getId().equals(n.getParentId()))
                .toList();
        for (ConsultationNoeud child : children) {
            deleteSubtree(child);
        }
        composantRepository.deleteByNoeudId(noeud.getId());
        noeudRepository.delete(noeud);
    }

    private int nextOrdre(UUID consultationId, UUID parentId) {
        return (int) noeudRepository
                .findByTenantIdAndConsultationIdOrderByOrdreAsc(tenantId(), consultationId)
                .stream()
                .filter(n -> parentId == null ? n.getParentId() == null : parentId.equals(n.getParentId()))
                .count();
    }

    private ConsultationNoeud attachComposants(ConsultationNoeud noeud) {
        noeud.setComposants(
                composantRepository.findByTenantIdAndNoeudIdOrderByOrdreAsc(tenantId(), noeud.getId()));
        return noeud;
    }

    private void requireEditableConsultation(UUID consultationId) {
        Consultation c = consultationRepository
                .findByIdAndTenantId(consultationId, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Consultation not found"));
        if (Consultation.STATUS_EN_VALIDATION.equals(c.getStatus())
                || Consultation.STATUS_TERMINE.equals(c.getStatus())
                || Consultation.STATUS_VALIDEE.equals(c.getStatus())
                || Consultation.STATUS_ANNULEE.equals(c.getStatus())
                || Consultation.STATUS_CONVERTIE.equals(c.getStatus())) {
            throw new IllegalStateException("Consultation is locked (status=" + c.getStatus() + ")");
        }
    }

    private ConsultationNoeud requireNoeud(UUID id) {
        return noeudRepository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Noeud not found"));
    }

    private ConsultationComposant requireComposant(UUID id) {
        return composantRepository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Composant not found"));
    }

    private DpgfNoeud toDpgfBridge(ConsultationNoeud noeud) {
        return DpgfNoeud.builder()
                .id(noeud.getId())
                .tenantId(noeud.getTenantId())
                .code(noeud.getCode())
                .libelle(noeud.getLibelle())
                .descriptif(noeud.getDescriptif())
                .type(DpgfNoeud.TYPE_ARTICLE)
                .unite(noeud.getUnite())
                .quantite(noeud.getQuantite())
                .build();
    }

    private ImportComposantDto toImportComposant(ComposantDpuInputDto input) {
        ImportComposantDto dto = new ImportComposantDto();
        dto.setType(input.getType());
        dto.setDesignation(input.getArticleOuPosteId());
        dto.setUnite(input.getUnite());
        dto.setRendement(input.getRendement());
        return dto;
    }

    private String trimOrNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
