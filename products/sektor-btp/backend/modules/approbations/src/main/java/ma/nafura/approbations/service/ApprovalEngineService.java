package ma.nafura.approbations.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.approbations.api.dto.ApprovalEtapeDto;
import ma.nafura.approbations.api.dto.ApprovalEventDto;
import ma.nafura.approbations.api.dto.ApprovalRequestDto;
import ma.nafura.approbations.api.request.ApprovalActionDto;
import ma.nafura.approbations.api.request.ApprovalRequestSubmitDto;
import ma.nafura.approbations.domain.model.ApprovalEvent;
import ma.nafura.approbations.domain.model.ApprovalRequest;
import ma.nafura.approbations.domain.model.ApprovalWorkflow;
import ma.nafura.approbations.repository.ApprovalEventRepository;
import ma.nafura.approbations.repository.ErpApprovalRequestRepository;
import ma.nafura.approbations.repository.ApprovalWorkflowRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.event.ErpNotificationPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class ApprovalEngineService {

    private static final List<String> OPEN_STATUSES =
            List.of(ApprovalRequest.STATUS_EN_COURS, ApprovalRequest.STATUS_EN_ATTENTE);

    private static final Map<String, String> ROLE_LABELS = Map.of(
            "CONDUCTEUR_TRAVAUX", "Karim El Idrissi",
            "DAF", "Amal Bennani",
            "DG", "Omar Tazi",
            "COMPTABLE", "Service comptabilité",
            "MANAGER", "Manager direct");

    private final ApprovalWorkflowRepository workflowRepository;
    private final ErpApprovalRequestRepository requestRepository;
    private final ApprovalEventRepository eventRepository;
    private final ApprovalEventService eventService;
    private final ApprovalWorkflowSeedService workflowSeedService;
    private final ApprovalRequestSeedService requestSeedService;
    private final MatricePouvoirService matricePouvoirService;
    private final DelegationApprobationService delegationApprobationService;
    private final ObjectMapper objectMapper;
    private final ErpNotificationPublisher erpNotificationPublisher;

    public ApprovalEngineService(
            ApprovalWorkflowRepository workflowRepository,
            ErpApprovalRequestRepository requestRepository,
            ApprovalEventRepository eventRepository,
            ApprovalEventService eventService,
            ApprovalWorkflowSeedService workflowSeedService,
            ApprovalRequestSeedService requestSeedService,
            MatricePouvoirService matricePouvoirService,
            DelegationApprobationService delegationApprobationService,
            ObjectMapper objectMapper,
            ErpNotificationPublisher erpNotificationPublisher) {
        this.workflowRepository = workflowRepository;
        this.requestRepository = requestRepository;
        this.eventRepository = eventRepository;
        this.eventService = eventService;
        this.workflowSeedService = workflowSeedService;
        this.requestSeedService = requestSeedService;
        this.matricePouvoirService = matricePouvoirService;
        this.delegationApprobationService = delegationApprobationService;
        this.objectMapper = objectMapper;
        this.erpNotificationPublisher = erpNotificationPublisher;
    }

    @Transactional(readOnly = true)
    public ApprovalWorkflow selectWorkflow(String entityType, Map<String, Object> context) {
        workflowSeedService.seedIfEmpty();
        UUID tenantId = tenantId();
        enrichContextFromMatrice(entityType, context);
        List<ApprovalWorkflow> candidates = workflowRepository
                .findByTenantIdAndEntityTypeAndIsActiveTrueOrderByLabelAsc(tenantId, entityType.toUpperCase(Locale.ROOT))
                .stream()
                .filter(w -> matchesWorkflow(w, context))
                .sorted(Comparator.comparingInt(w -> -conditionCount(w)))
                .toList();
        if (candidates.isEmpty()) {
            throw new IllegalArgumentException("No active workflow for entity type: " + entityType);
        }
        return candidates.get(0);
    }

    @Transactional
    public ApprovalRequestDto submit(ApprovalRequestSubmitDto dto) {
        workflowSeedService.seedIfEmpty();
        UUID tenantId = tenantId();

        Optional<ApprovalRequest> existing = requestRepository.findByTenantIdAndEntityTypeAndEntityIdAndStatusIn(
                tenantId, dto.getEntityType(), dto.getEntityId(), OPEN_STATUSES);
        if (existing.isPresent()) {
            return toDto(existing.get());
        }

        Map<String, Object> context = new HashMap<>();
        context.put("montant", dto.getMontantConcerne() != null ? dto.getMontantConcerne() : BigDecimal.ZERO);
        ApprovalWorkflow workflow = selectWorkflow(dto.getEntityType(), context);

        String requestId = StringUtils.hasText(dto.getId()) ? dto.getId().trim() : nextRequestId(tenantId);
        String initiatorId = StringUtils.hasText(dto.getInitiateurUserId()) ? dto.getInitiateurUserId() : "me";
        String initiatorNom = StringUtils.hasText(dto.getInitiateurNom()) ? dto.getInitiateurNom() : initiatorId;

        ApprovalRequest request = ApprovalRequest.builder()
                .id(requestId)
                .tenantId(tenantId)
                .workflowId(workflow.getId())
                .entityType(dto.getEntityType().toUpperCase(Locale.ROOT))
                .entityId(dto.getEntityId())
                .entityRef(dto.getEntityRef())
                .entitySummary(dto.getEntitySummary())
                .montantConcerne(dto.getMontantConcerne())
                .chantierId(trimOrNull(dto.getChantierId()))
                .initiateurUserId(initiatorId)
                .initiateurNom(initiatorNom)
                .status(ApprovalRequest.STATUS_EN_COURS)
                .etapeCouranteIndex(0)
                .dateSoumission(LocalDate.now())
                .urgence(normalizeUrgence(dto.getUrgence()))
                .build();
        requestRepository.save(request);

        eventService.appendEvent(
                requestId,
                ApprovalEvent.ACTION_SOUMIS,
                initiatorId,
                initiatorNom,
                "Soumission pour approbation",
                null);

        publishApprovalSubmitted(request, workflow);

        return toDto(request);
    }

    @Transactional
    public ApprovalRequestDto approve(String requestId, ApprovalActionDto action) {
        return decide(requestId, action, true);
    }

    @Transactional
    public ApprovalRequestDto reject(String requestId, ApprovalActionDto action) {
        return decide(requestId, action, false);
    }

    @Transactional
    public ApprovalRequestDto demandeComplement(String requestId, ApprovalActionDto action) {
        return appendAction(requestId, action, ApprovalEvent.ACTION_DEMANDE_COMPLEMENT);
    }

    @Transactional
    public ApprovalRequestDto commenter(String requestId, ApprovalActionDto action) {
        return appendAction(requestId, action, ApprovalEvent.ACTION_COMMENTE);
    }

    @Transactional
    public ApprovalRequestDto deleguer(String requestId, ApprovalActionDto action) {
        return appendAction(requestId, action, ApprovalEvent.ACTION_DELEGUE);
    }

    @Transactional(readOnly = true)
    public List<ApprovalRequestDto> listRequests(String status) {
        requestSeedService.seedIfEmpty();
        UUID tenantId = tenantId();
        List<ApprovalRequest> rows;
        if (StringUtils.hasText(status)) {
            rows = requestRepository.findByTenantIdAndStatusInOrderByDateSoumissionDescCreatedAtDesc(
                    tenantId, List.of(status.trim().toUpperCase(Locale.ROOT)));
        } else {
            rows = requestRepository.findByTenantIdOrderByDateSoumissionDescCreatedAtDesc(tenantId);
        }
        return rows.stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public ApprovalRequestDto getRequest(String id) {
        requestSeedService.seedIfEmpty();
        ApprovalRequest request = resolveRequest(id);
        return toDto(request);
    }

    @Transactional(readOnly = true)
    public long countPending() {
        requestSeedService.seedIfEmpty();
        return requestRepository.countByTenantIdAndStatusIn(tenantId(), OPEN_STATUSES);
    }

    ApprovalRequestDto toDto(ApprovalRequest request) {
        ApprovalWorkflow workflow = workflowRepository
                .findByIdAndTenantId(request.getWorkflowId(), request.getTenantId())
                .orElseThrow(() -> new IllegalStateException("Workflow not found: " + request.getWorkflowId()));
        List<ApprovalEvent> events =
                eventRepository.findByTenantIdAndRequestIdOrderByCreatedAtAsc(request.getTenantId(), request.getId());
        List<ApprovalEtapeDto> etapes = buildEtapes(workflow, request, events);
        List<ApprovalEventDto> historique = events.stream()
                .map(e -> ApprovalEventDto.builder()
                        .id(e.getId())
                        .action(e.getAction())
                        .userId(e.getUserId())
                        .userNom(e.getUserNom())
                        .commentaire(e.getCommentaire())
                        .payloadJson(e.getPayloadJson())
                        .previousHash(e.getPreviousHash())
                        .eventHash(e.getEventHash())
                        .createdAt(e.getCreatedAt())
                        .build())
                .toList();

        return ApprovalRequestDto.builder()
                .id(request.getId())
                .workflowId(request.getWorkflowId())
                .entityType(request.getEntityType())
                .entityId(request.getEntityId())
                .entityRef(request.getEntityRef())
                .entitySummary(request.getEntitySummary())
                .montantConcerne(request.getMontantConcerne())
                .chantierId(request.getChantierId())
                .initiateurUserId(request.getInitiateurUserId())
                .initiateurNom(request.getInitiateurNom())
                .status(mapStatusForUi(request.getStatus()))
                .etapeCouranteIndex(request.getEtapeCouranteIndex())
                .dateSoumission(request.getDateSoumission())
                .dateCloture(request.getDateCloture())
                .urgence(request.getUrgence())
                .createdAt(request.getCreatedAt())
                .etapes(etapes)
                .historique(historique)
                .build();
    }

    private ApprovalRequestDto decide(String requestId, ApprovalActionDto action, boolean approve) {
        ApprovalRequest request = resolveRequest(requestId);
        if (!OPEN_STATUSES.contains(request.getStatus())) {
            throw new IllegalStateException("Request is not open for decisions");
        }

        ApprovalWorkflow workflow = workflowRepository
                .findByIdAndTenantId(request.getWorkflowId(), request.getTenantId())
                .orElseThrow(() -> new IllegalStateException("Workflow not found"));
        int stepCount = parseEtapes(workflow).size();
        String userId = resolveUserId(action);
        String userNom = resolveUserNom(action, userId);

        eventService.appendEvent(
                requestId,
                approve ? ApprovalEvent.ACTION_APPROUVE : ApprovalEvent.ACTION_REJETE,
                userId,
                userNom,
                action != null ? action.getCommentaire() : null,
                action != null ? action.getPayloadJson() : null);

        if (approve) {
            if (request.getEtapeCouranteIndex() >= stepCount - 1) {
                request.setStatus(ApprovalRequest.STATUS_APPROUVE);
                request.setDateCloture(LocalDate.now());
            } else {
                request.setEtapeCouranteIndex(request.getEtapeCouranteIndex() + 1);
            }
        } else {
            request.setStatus(ApprovalRequest.STATUS_REJETE);
            request.setDateCloture(LocalDate.now());
        }
        requestRepository.save(request);
        publishApprovalDecision(request, workflow, approve);
        return toDto(request);
    }

    private ApprovalRequestDto appendAction(String requestId, ApprovalActionDto action, String eventAction) {
        ApprovalRequest request = resolveRequest(requestId);
        if (!OPEN_STATUSES.contains(request.getStatus())) {
            throw new IllegalStateException("Request is not open");
        }
        String userId = resolveUserId(action);
        String userNom = resolveUserNom(action, userId);
        eventService.appendEvent(
                requestId,
                eventAction,
                userId,
                userNom,
                action != null ? action.getCommentaire() : null,
                action != null ? action.getPayloadJson() : null);
        return toDto(request);
    }

    private List<ApprovalEtapeDto> buildEtapes(
            ApprovalWorkflow workflow, ApprovalRequest request, List<ApprovalEvent> events) {
        List<Map<String, Object>> rawSteps = parseEtapes(workflow);
        List<ApprovalEtapeDto> result = new ArrayList<>();
        LocalDate ref = request.getDateSoumission();
        int approveIndex = 0;

        for (int i = 0; i < rawSteps.size(); i++) {
            Map<String, Object> step = rawSteps.get(i);
            String roleRef = firstRoleRef(step);
            String roleLabel = ROLE_LABELS.getOrDefault(roleRef, roleRef);
            if (stepHasPersonApprover(step)) {
                roleRef = delegationApprobationService.resolveApprobateur(roleRef, request.getDateSoumission());
                roleLabel = roleRef;
            }
            int slaDays = workflow.getSlaJours() + i * 2;
            LocalDate dateLimite = ref.plusDays(slaDays);

            ApprovalEtapeDto.ApprovalEtapeDtoBuilder builder = ApprovalEtapeDto.builder()
                    .ordre(i)
                    .approbateurRoleId(roleRef)
                    .approbateurNom(roleLabel)
                    .dateLimite(dateLimite.toString());

            Optional<ApprovalEvent> decisionEvent = findDecisionEvent(events, approveIndex, i < request.getEtapeCouranteIndex());
            if (decisionEvent.isPresent()) {
                ApprovalEvent ev = decisionEvent.get();
                builder.decision(ev.getAction().equals(ApprovalEvent.ACTION_APPROUVE) ? "APPROUVE" : "REJETE");
                builder.decisionPar(ev.getUserNom());
                builder.decisionAt(ev.getCreatedAt().toString());
                builder.commentaire(ev.getCommentaire());
                approveIndex++;
            }
            result.add(builder.build());
        }
        return result;
    }

    private Optional<ApprovalEvent> findDecisionEvent(List<ApprovalEvent> events, int approveIndex, boolean completed) {
        List<ApprovalEvent> decisions = events.stream()
                .filter(e -> ApprovalEvent.ACTION_APPROUVE.equals(e.getAction())
                        || ApprovalEvent.ACTION_REJETE.equals(e.getAction()))
                .toList();
        if (completed && approveIndex < decisions.size()) {
            return Optional.of(decisions.get(approveIndex));
        }
        if (!completed && approveIndex < decisions.size() && approveIndex == decisions.size() - 1) {
            return Optional.of(decisions.get(approveIndex));
        }
        return Optional.empty();
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> parseEtapes(ApprovalWorkflow workflow) {
        if (!StringUtils.hasText(workflow.getEtapesJson())) {
            return List.of();
        }
        try {
            return objectMapper.readValue(workflow.getEtapesJson(), new TypeReference<>() {});
        } catch (Exception ex) {
            throw new IllegalStateException("Invalid etapes_json for workflow " + workflow.getId(), ex);
        }
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> parseConditions(ApprovalWorkflow workflow) {
        if (!StringUtils.hasText(workflow.getConditionsJson())) {
            return List.of();
        }
        try {
            return objectMapper.readValue(workflow.getConditionsJson(), new TypeReference<>() {});
        } catch (Exception ex) {
            throw new IllegalStateException("Invalid conditions_json for workflow " + workflow.getId(), ex);
        }
    }

    private boolean matchesWorkflow(ApprovalWorkflow workflow, Map<String, Object> context) {
        List<Map<String, Object>> conditions = parseConditions(workflow);
        return conditions.stream().allMatch(c -> matchesCondition(c, context));
    }

    private boolean matchesCondition(Map<String, Object> cond, Map<String, Object> context) {
        String champ = String.valueOf(cond.get("champ"));
        String operateur = String.valueOf(cond.get("operateur"));
        Object valeur = cond.get("valeur");
        Object raw = contextValue(context, champ);

        return switch (operateur) {
            case "<" -> toDouble(raw) < toDouble(valeur);
            case "<=" -> toDouble(raw) <= toDouble(valeur);
            case "=" -> String.valueOf(raw).equals(String.valueOf(valeur));
            case ">=" -> toDouble(raw) >= toDouble(valeur);
            case ">" -> toDouble(raw) > toDouble(valeur);
            case "IN" -> valeur instanceof List<?> list && list.stream().map(String::valueOf).anyMatch(v -> v.equals(String.valueOf(raw)));
            default -> false;
        };
    }

    private Object contextValue(Map<String, Object> context, String champ) {
        if ("montant".equals(champ)) {
            return context.getOrDefault("montant", BigDecimal.ZERO);
        }
        return context.getOrDefault(champ, "");
    }

    private double toDouble(Object value) {
        if (value instanceof BigDecimal bd) {
            return bd.doubleValue();
        }
        if (value instanceof Number n) {
            return n.doubleValue();
        }
        return Double.parseDouble(String.valueOf(value));
    }

    private int conditionCount(ApprovalWorkflow workflow) {
        return parseConditions(workflow).size();
    }

    private void enrichContextFromMatrice(String entityType, Map<String, Object> context) {
        Object montantObj = context.get("montant");
        if (!(montantObj instanceof BigDecimal montant)) {
            return;
        }
        matricePouvoirService.resolve(entityType, montant).ifPresent(row -> {
            context.put("approbateurRole", row.getApprobateurRole());
            context.put("matriceLabel", row.getLabel());
            context.put("matriceOrdre", row.getOrdre());
        });
    }

    @SuppressWarnings("unchecked")
    private boolean stepHasPersonApprover(Map<String, Object> step) {
        Object approbateurs = step.get("approbateurs");
        if (approbateurs instanceof List<?> list && !list.isEmpty() && list.get(0) instanceof Map<?, ?> map) {
            return "PERSONNE".equals(String.valueOf(map.get("type")));
        }
        return false;
    }

    @SuppressWarnings("unchecked")
    private String firstRoleRef(Map<String, Object> step) {
        Object approbateurs = step.get("approbateurs");
        if (approbateurs instanceof List<?> list && !list.isEmpty() && list.get(0) instanceof Map<?, ?> map) {
            Object ref = map.get("ref");
            return ref != null ? ref.toString() : "UNKNOWN";
        }
        return "UNKNOWN";
    }

    private ApprovalRequest resolveRequest(String id) {
        return requestRepository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Approval request not found: " + id));
    }

    private String nextRequestId(UUID tenantId) {
        int max = 0;
        for (ApprovalRequest row : requestRepository.findByTenantIdOrderByDateSoumissionDescCreatedAtDesc(tenantId)) {
            if (row.getId().startsWith("apr-")) {
                try {
                    max = Math.max(max, Integer.parseInt(row.getId().substring(4)));
                } catch (NumberFormatException ignored) {
                    // skip non-numeric suffixes
                }
            }
        }
        return String.format(Locale.ROOT, "apr-%03d", max + 1);
    }

    private String resolveUserId(ApprovalActionDto action) {
        if (action != null && StringUtils.hasText(action.getUserId())) {
            return action.getUserId();
        }
        return "me";
    }

    private String resolveUserNom(ApprovalActionDto action, String userId) {
        if (action != null && StringUtils.hasText(action.getUserNom())) {
            return action.getUserNom();
        }
        return userId;
    }

    private String mapStatusForUi(String status) {
        if (ApprovalRequest.STATUS_EN_COURS.equals(status)) {
            return ApprovalRequest.STATUS_EN_ATTENTE;
        }
        return status;
    }

    private String normalizeUrgence(String urgence) {
        if (!StringUtils.hasText(urgence)) {
            return "NORMALE";
        }
        return urgence.trim().toUpperCase(Locale.ROOT);
    }

    private String trimOrNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }

    private void publishApprovalSubmitted(ApprovalRequest request, ApprovalWorkflow workflow) {
        String role = roleAtStep(workflow, request.getEtapeCouranteIndex());
        if (role == null) {
            return;
        }
        String ref = StringUtils.hasText(request.getEntityRef()) ? request.getEntityRef() : request.getId();
        erpNotificationPublisher.notifyRoles(
                request.getTenantId(),
                "APPROBATION",
                request.getId(),
                ref,
                "SOUMIS",
                "Approbation en attente : " + ref,
                summaryOrDefault(request),
                "/approbations?highlight=" + request.getId(),
                role);
    }

    private void publishApprovalDecision(ApprovalRequest request, ApprovalWorkflow workflow, boolean approved) {
        String ref = StringUtils.hasText(request.getEntityRef()) ? request.getEntityRef() : request.getId();
        String actionUrl = "/approbations?highlight=" + request.getId();

        if (approved && OPEN_STATUSES.contains(request.getStatus())) {
            String nextRole = roleAtStep(workflow, request.getEtapeCouranteIndex());
            if (nextRole != null) {
                erpNotificationPublisher.notifyRoles(
                        request.getTenantId(),
                        "APPROBATION",
                        request.getId(),
                        ref,
                        "ETAPE",
                        "Approbation en attente : " + ref,
                        summaryOrDefault(request),
                        actionUrl,
                        nextRole);
            }
            return;
        }

        String transition = approved ? "APPROUVE" : "REJETE";
        String title = (approved ? "Approbation validée : " : "Approbation rejetée : ") + ref;
        erpNotificationPublisher.notifyRoles(
                request.getTenantId(),
                "APPROBATION",
                request.getId(),
                ref,
                transition,
                title,
                summaryOrDefault(request),
                actionUrl,
                "MANAGER",
                "CONDUCTEUR_TRAVAUX");
    }

    private String summaryOrDefault(ApprovalRequest request) {
        if (StringUtils.hasText(request.getEntitySummary())) {
            return request.getEntitySummary().trim();
        }
        return "Demande " + request.getEntityType();
    }

    private String roleAtStep(ApprovalWorkflow workflow, int stepIndex) {
        List<Map<String, Object>> steps = parseEtapes(workflow);
        if (stepIndex < 0 || stepIndex >= steps.size()) {
            return null;
        }
        return firstRoleRef(steps.get(stepIndex));
    }
}
