package ma.nafura.consultation.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.consultation.api.request.ConsultationCreateDto;
import ma.nafura.consultation.api.request.ImportComposantDto;
import ma.nafura.consultation.api.dto.DescriptifEnrichmentResultDto;
import ma.nafura.consultation.api.request.ImportNoeudDto;
import ma.nafura.consultation.api.request.ImportTreeRequest;
import ma.nafura.consultation.service.port.CpsDescriptifExtractionPort;
import ma.nafura.consultation.domain.model.Consultation;
import ma.nafura.consultation.domain.model.ConsultationComposant;
import ma.nafura.consultation.domain.model.ConsultationNoeud;
import ma.nafura.consultation.repository.ConsultationComposantRepository;
import ma.nafura.consultation.repository.ConsultationNoeudRepository;
import ma.nafura.consultation.repository.ConsultationRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class ConsultationService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ConsultationService.class);

    private final ConsultationRepository consultationRepository;
    private final ConsultationNoeudRepository noeudRepository;
    private final ConsultationComposantRepository composantRepository;

    public ConsultationService(
            ConsultationRepository consultationRepository,
            ConsultationNoeudRepository noeudRepository,
            ConsultationComposantRepository composantRepository) {
        this.consultationRepository = consultationRepository;
        this.noeudRepository = noeudRepository;
        this.composantRepository = composantRepository;
    }

    @Transactional(readOnly = true)
    public List<Consultation> list() {
        return consultationRepository.findByTenantIdOrderByCreatedAtDesc(tenantId());
    }

    @Transactional(readOnly = true)
    public Consultation getById(UUID id) {
        Consultation consultation = requireConsultation(id);
        consultation.setArbre(loadTree(id));
        return consultation;
    }

    @Transactional
    public Consultation create(ConsultationCreateDto request) {
        UUID tenantId = tenantId();
        String numero = StringUtils.hasText(request.getNumero())
                ? request.getNumero().trim()
                : generateNumero(tenantId);
        if (consultationRepository.existsByTenantIdAndNumero(tenantId, numero)) {
            throw new IllegalArgumentException("Consultation numero already exists");
        }
        Consultation consultation = Consultation.builder()
                .tenantId(tenantId)
                .numero(numero)
                .objet(request.getObjet().trim())
                .chantierId(trimOrNull(request.getChantierId()))
                .chantierCode(trimOrNull(request.getChantierCode()))
                .chantierName(trimOrNull(request.getChantierName()))
                .cpsDocumentId(trimOrNull(request.getCpsDocumentId()))
                .bordereauDocumentId(trimOrNull(request.getBordereauDocumentId()))
                .notes(trimOrNull(request.getNotes()))
                .status(Consultation.STATUS_BROUILLON)
                .currentStep(Consultation.STEP_BORDEREAU)
                .build();
        Consultation saved = consultationRepository.save(consultation);
        saved.setArbre(new ArrayList<>());
        return saved;
    }

    /**
     * Replaces the whole tree of a consultation with the imported one (manual
     * import or extraction output share the same shape).
     */
    @Transactional
    public Consultation importTree(UUID consultationId, ImportTreeRequest request) {
        UUID tenantId = tenantId();
        Consultation consultation = requireConsultation(consultationId);
        // Clear existing nodes (composants cascade via FK ON DELETE CASCADE).
        noeudRepository.deleteByConsultationId(consultationId);
        noeudRepository.flush();

        int ordre = 0;
        for (ImportNoeudDto node : safe(request.getArbre())) {
            persistNode(node, consultationId, null, tenantId, ordre++);
        }
        consultation.setStatus(Consultation.STATUS_BROUILLON);
        consultation.setCurrentStep(Consultation.STEP_BORDEREAU);
        Consultation saved = consultationRepository.save(consultation);
        saved.setArbre(loadTree(consultationId));
        return saved;
    }

    /**
     * Flattens the consultation tree into the list of POSTE references (code +
     * libellé) the descriptif extraction pass needs to look up in the CPS.
     */
    @Transactional(readOnly = true)
    public List<CpsDescriptifExtractionPort.PosteRef> collectPosteRefs(UUID consultationId) {
        List<CpsDescriptifExtractionPort.PosteRef> refs = new ArrayList<>();
        collectPostes(loadTree(consultationId), noeud ->
                refs.add(new CpsDescriptifExtractionPort.PosteRef(noeud.getCode(), noeud.getLibelle())));
        return refs;
    }

    /**
     * Applies descriptifs returned by the CPS pass onto the matching postes.
     * Matching is done by normalized code (so {@code 1.1.3} and {@code 1-1-3}
     * collide), with a libellé fallback. Blank descriptifs are ignored so an
     * empty match never wipes an existing descriptif.
     */
    @Transactional
    public DescriptifEnrichmentResultDto applyDescriptifsFromCps(
            UUID consultationId, List<CpsDescriptifExtractionPort.DescriptifResult> results) {
        requireConsultation(consultationId);

        List<ConsultationNoeud> postes = new ArrayList<>();
        collectPostes(loadTree(consultationId), postes::add);

        Map<String, ConsultationNoeud> byCode = new LinkedHashMap<>();
        Map<String, ConsultationNoeud> byLibelle = new LinkedHashMap<>();
        for (ConsultationNoeud poste : postes) {
            String codeKey = normalizeCode(poste.getCode());
            if (codeKey != null) {
                byCode.putIfAbsent(codeKey, poste);
            }
            String libelleKey = normalizeLibelle(poste.getLibelle());
            if (libelleKey != null) {
                byLibelle.putIfAbsent(libelleKey, poste);
            }
        }

        int matched = 0;
        List<String> unresolvedResultCodes = new ArrayList<>();
        for (CpsDescriptifExtractionPort.DescriptifResult result : safe(results)) {
            if (result == null || !StringUtils.hasText(result.descriptif())) {
                continue;
            }
            ConsultationNoeud target = byCode.get(normalizeCode(result.code()));
            if (target == null) {
                target = byLibelle.get(normalizeLibelle(result.code()));
            }
            if (target == null) {
                unresolvedResultCodes.add(result.code());
                continue;
            }
            target.setDescriptif(result.descriptif().trim());
            noeudRepository.save(target);
            matched++;
        }
        log.info("Descriptif enrichment [consultation={}]: {} postes, {} results, {} matched; unresolved result codes={}",
                consultationId, postes.size(), safe(results).size(), matched, unresolvedResultCodes);

        List<String> unmatchedCodes = postes.stream()
                .filter(p -> !StringUtils.hasText(p.getDescriptif()))
                .map(ConsultationNoeud::getCode)
                .filter(StringUtils::hasText)
                .toList();

        Consultation consultation = requireConsultation(consultationId);
        consultation.setArbre(loadTree(consultationId));
        return new DescriptifEnrichmentResultDto(consultation, postes.size(), matched, unmatchedCodes);
    }

    @Transactional
    public Consultation setStep(UUID consultationId, int step) {
        if (step < Consultation.STEP_BORDEREAU || step > Consultation.STEP_CHIFFRAGE) {
            throw new IllegalArgumentException("Invalid step: " + step);
        }
        Consultation consultation = requireConsultation(consultationId);
        assertNotLocked(consultation);
        List<ConsultationNoeud> tree = loadTree(consultationId);
        int current = consultation.getCurrentStep() != null
                ? consultation.getCurrentStep()
                : Consultation.STEP_BORDEREAU;
        if (step > current) {
            for (int s = current; s < step; s++) {
                assertGate(s, tree);
            }
        }
        consultation.setCurrentStep(step);
        if (step == Consultation.STEP_CHIFFRAGE) {
            consultation.setStatus(Consultation.STATUS_EN_CHIFFRAGE);
        } else if (Consultation.STATUS_EN_CHIFFRAGE.equals(consultation.getStatus())
                && step < Consultation.STEP_CHIFFRAGE) {
            consultation.setStatus(Consultation.STATUS_BROUILLON);
        }
        Consultation saved = consultationRepository.save(consultation);
        saved.setArbre(tree);
        return saved;
    }

    @Transactional
    public Consultation submitForValidation(UUID consultationId) {
        Consultation consultation = requireConsultation(consultationId);
        assertNotLocked(consultation);
        List<ConsultationNoeud> tree = loadTree(consultationId);
        assertGate(Consultation.STEP_BORDEREAU, tree);
        assertGate(Consultation.STEP_DECOMPOSITION, tree);
        assertGate(Consultation.STEP_CHIFFRAGE, tree);
        consultation.setCurrentStep(Consultation.STEP_CHIFFRAGE);
        consultation.setStatus(Consultation.STATUS_EN_VALIDATION);
        Consultation saved = consultationRepository.save(consultation);
        saved.setArbre(tree);
        return saved;
    }

    @Transactional
    public Consultation validate(UUID consultationId) {
        Consultation consultation = requireConsultation(consultationId);
        consultation.setStatus(Consultation.STATUS_TERMINE);
        Consultation saved = consultationRepository.save(consultation);
        saved.setArbre(loadTree(consultationId));
        return saved;
    }

    @Transactional
    public void delete(UUID consultationId) {
        Consultation consultation = requireConsultation(consultationId);
        consultationRepository.delete(consultation);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private void persistNode(ImportNoeudDto dto, UUID consultationId, UUID parentId, UUID tenantId, int ordre) {
        String type = StringUtils.hasText(dto.getType())
                ? dto.getType().trim().toUpperCase()
                : ConsultationNoeud.TYPE_POSTE;
        boolean isPoste = ConsultationNoeud.TYPE_POSTE.equals(type);
        String mode = null;
        if (isPoste) {
            mode = StringUtils.hasText(dto.getMode())
                    ? dto.getMode().trim().toUpperCase()
                    : ConsultationNoeud.MODE_FOURNI;
        }
        ConsultationNoeud noeud = ConsultationNoeud.builder()
                .tenantId(tenantId)
                .consultationId(consultationId)
                .parentId(parentId)
                .type(type)
                .code(trimOrNull(dto.getCode()))
                .libelle(dto.getLibelle() != null ? dto.getLibelle().trim() : "(sans libellé)")
                .unite(trimOrNull(dto.getUnite()))
                .quantite(dto.getQuantite())
                .descriptif(trimOrNull(dto.getDescriptif()))
                .ordre(dto.getOrdre() != null ? dto.getOrdre() : ordre)
                .mode(mode)
                .build();
        ConsultationNoeud savedNoeud = noeudRepository.save(noeud);

        if (isPoste && ConsultationNoeud.MODE_DECOMPOSE.equals(mode)) {
            int cOrdre = 0;
            for (ImportComposantDto comp : safe(dto.getComposants())) {
                persistComposant(comp, savedNoeud.getId(), tenantId, cOrdre++);
            }
        }

        int childOrdre = 0;
        for (ImportNoeudDto child : safe(dto.getEnfants())) {
            persistNode(child, consultationId, savedNoeud.getId(), tenantId, childOrdre++);
        }
    }

    private void persistComposant(ImportComposantDto dto, UUID noeudId, UUID tenantId, int ordre) {
        ConsultationComposant composant = ConsultationComposant.builder()
                .tenantId(tenantId)
                .noeudId(noeudId)
                .type(StringUtils.hasText(dto.getType())
                        ? dto.getType().trim().toUpperCase()
                        : ConsultationComposant.TYPE_MATERIAU)
                .designation(dto.getDesignation() != null ? dto.getDesignation().trim() : "(composant)")
                .unite(trimOrNull(dto.getUnite()))
                .quantiteIndicative(dto.getQuantiteIndicative())
                .ordre(dto.getOrdre() != null ? dto.getOrdre() : ordre)
                .build();
        composantRepository.save(composant);
    }

    private List<ConsultationNoeud> loadTree(UUID consultationId) {
        UUID tenantId = tenantId();
        List<ConsultationNoeud> all =
                noeudRepository.findByTenantIdAndConsultationIdOrderByOrdreAsc(tenantId, consultationId);
        if (all.isEmpty()) {
            return new ArrayList<>();
        }

        List<UUID> posteIds = all.stream()
                .filter(n -> ConsultationNoeud.TYPE_POSTE.equals(n.getType()))
                .map(ConsultationNoeud::getId)
                .toList();
        Map<UUID, List<ConsultationComposant>> composantsByNoeud = new LinkedHashMap<>();
        if (!posteIds.isEmpty()) {
            for (ConsultationComposant comp : composantRepository.findByTenantIdAndNoeudIdIn(tenantId, posteIds)) {
                composantsByNoeud
                        .computeIfAbsent(comp.getNoeudId(), k -> new ArrayList<>())
                        .add(comp);
            }
        }

        Map<UUID, ConsultationNoeud> byId = new LinkedHashMap<>();
        for (ConsultationNoeud n : all) {
            n.setEnfants(new ArrayList<>());
            n.setComposants(composantsByNoeud.getOrDefault(n.getId(), new ArrayList<>()));
            byId.put(n.getId(), n);
        }

        List<ConsultationNoeud> roots = new ArrayList<>();
        for (ConsultationNoeud n : all) {
            if (n.getParentId() != null && byId.containsKey(n.getParentId())) {
                byId.get(n.getParentId()).getEnfants().add(n);
            } else {
                roots.add(n);
            }
        }
        return roots;
    }

    private void assertNotLocked(Consultation consultation) {
        String status = consultation.getStatus();
        if (Consultation.STATUS_EN_VALIDATION.equals(status)
                || Consultation.STATUS_TERMINE.equals(status)
                || Consultation.STATUS_VALIDEE.equals(status)
                || Consultation.STATUS_ANNULEE.equals(status)
                || Consultation.STATUS_CONVERTIE.equals(status)) {
            throw new IllegalStateException("Consultation is locked (status=" + status + ")");
        }
    }

    /**
     * Gate after completing {@code completedStep} before moving to the next.
     * Step 1: ≥1 POSTE. Step 2: each POSTE is DECOMPOSE with ≥1 composant, or FOURNI.
     * Step 3: each POSTE has FG% and marge% (defaults count as set).
     */
    private void assertGate(int completedStep, List<ConsultationNoeud> tree) {
        List<ConsultationNoeud> postes = new ArrayList<>();
        collectPostes(tree, postes::add);
        if (completedStep == Consultation.STEP_BORDEREAU) {
            if (postes.isEmpty()) {
                throw new IllegalArgumentException("Ajoutez au moins un poste au bordereau avant de continuer");
            }
            return;
        }
        if (completedStep == Consultation.STEP_DECOMPOSITION) {
            for (ConsultationNoeud p : postes) {
                boolean fourni = ConsultationNoeud.MODE_FOURNI.equals(p.getMode());
                boolean decomposed = ConsultationNoeud.MODE_DECOMPOSE.equals(p.getMode())
                        && p.getComposants() != null
                        && !p.getComposants().isEmpty();
                if (!fourni && !decomposed) {
                    throw new IllegalArgumentException(
                            "Poste « " + p.getLibelle()
                                    + " » : décomposez-le (composants) ou marquez-le Fourni");
                }
            }
            return;
        }
        if (completedStep == Consultation.STEP_CHIFFRAGE) {
            for (ConsultationNoeud p : postes) {
                if (p.getFraisGenerauxPercent() == null || p.getMargePercent() == null) {
                    throw new IllegalArgumentException(
                            "Poste « " + p.getLibelle() + " » : renseignez FG% et marge%");
                }
            }
        }
    }

    private Consultation requireConsultation(UUID id) {
        return consultationRepository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Consultation not found"));
    }

    private String generateNumero(UUID tenantId) {
        long count = consultationRepository.countByTenantId(tenantId);
        return String.format("CONS-%04d", count + 1);
    }

    private void collectPostes(List<ConsultationNoeud> roots, java.util.function.Consumer<ConsultationNoeud> sink) {
        for (ConsultationNoeud noeud : safe(roots)) {
            if (ConsultationNoeud.TYPE_POSTE.equals(noeud.getType())) {
                sink.accept(noeud);
            }
            collectPostes(noeud.getEnfants(), sink);
        }
    }

    /** Strips separators/whitespace so {@code 1.1.3}, {@code 1-1-3}, {@code 1 1 3} collide. */
    private String normalizeCode(String code) {
        if (!StringUtils.hasText(code)) {
            return null;
        }
        String normalized = code.trim().toUpperCase().replaceAll("[\\s._\\-/]+", "");
        return normalized.isEmpty() ? null : normalized;
    }

    private String normalizeLibelle(String libelle) {
        if (!StringUtils.hasText(libelle)) {
            return null;
        }
        String normalized = libelle.trim().toUpperCase().replaceAll("\\s+", " ");
        return normalized.isEmpty() ? null : normalized;
    }

    private <T> List<T> safe(List<T> list) {
        return list != null ? list : List.of();
    }

    private String trimOrNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
