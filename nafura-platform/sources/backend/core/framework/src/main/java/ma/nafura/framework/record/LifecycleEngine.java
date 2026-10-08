package ma.nafura.platform.framework.record;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.BeanWrapperImpl;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import ma.nafura.platform.framework.domain.PlatformEntity;
import ma.nafura.platform.framework.scope.DataScope;
import ma.nafura.platform.framework.record.Lifecycle.Transition;

/** Fires lifecycle transitions: permission, source state, required fields, approval, event. */
@Service
public class LifecycleEngine {

    /** Published after every successful transition. {@code system} is a platform outcome (approval). */
    public record Transitioned(
            String entityType,
            UUID entityId,
            String transition,
            String from,
            String to,
            UUID actorId,
            UUID tenantId,
            boolean system) {
    }

    private record Binding<E extends HasStatus>(Lifecycle lifecycle, Function<UUID, Optional<E>> loader, Consumer<E> saver) {
    }

    private static final Pattern PLACEHOLDER = Pattern.compile("\\{(\\w+)}");

    private final ObjectProvider<ApprovalGateway> approvals;
    private final ApplicationEventPublisher events;
    private final ObjectProvider<DataScope> scopes;
    private final Map<String, Binding<?>> bindings = new ConcurrentHashMap<>();
    private final Map<Class<?>, Lifecycle> byRecordType = new ConcurrentHashMap<>();

    public LifecycleEngine(ObjectProvider<ApprovalGateway> approvals, ApplicationEventPublisher events,
                           ObjectProvider<DataScope> scopes) {
        this.approvals = approvals;
        this.events = events;
        this.scopes = scopes;
    }

    /** Called by each {@link RecordController} with a lifecycle, so approval outcomes find their record. */
    public <E extends HasStatus> void register(Class<?> recordType, Lifecycle lifecycle, Function<UUID, Optional<E>> loader, Consumer<E> saver) {
        bindings.put(lifecycle.entity(), new Binding<>(lifecycle, loader, saver));
        byRecordType.put(recordType, lifecycle);
    }

    public Optional<Lifecycle> lifecycleOf(String entityType) {
        Binding<?> binding = bindings.get(entityType);
        return binding == null ? Optional.empty() : Optional.of(binding.lifecycle());
    }

    /** The record a transition notified about, still in its organization. */
    public Optional<HasStatus> load(String entityType, UUID id) {
        Binding<?> binding = bindings.get(entityType);
        if (binding == null) return Optional.empty();
        return binding.loader().apply(id).map(HasStatus.class::cast);
    }

    /** Organisation-wide permission, or a grant whose closure contains this record. */
    private boolean allowed(Lifecycle lifecycle, HasStatus record, String permission) {
        if (UserContext.hasPermission(permission)) {
            return true;
        }
        DataScope scope = scopes == null ? null : scopes.getIfAvailable();
        if (scope == null || lifecycle == null || !(record instanceof PlatformEntity entity)) {
            return false;
        }
        return scope.visible(lifecycle.entity(), entity.getId(), record, permission);
    }

    /** The lifecycle declared for records of this entity class, if any. */
    public Optional<Lifecycle> lifecycleOf(Class<?> recordType) {
        return Optional.ofNullable(byRecordType.get(recordType));
    }

    /** Transitions the current user may fire now. */
    public List<Transition> available(Lifecycle lifecycle, HasStatus record) {
        return lifecycle.transitions().stream()
                .filter(t -> !t.system() && t.allowedFrom(record.getStatus()) && allowed(lifecycle, record, t.permission()))
                .toList();
    }

    public <E extends HasStatus> void fire(Lifecycle lifecycle, E record, UUID id, String transitionId, Consumer<E> saver) {
        fire(lifecycle, record, id, transitionId, saver, false);
    }

    /** A seed or another trusted caller fires a {@code system} transition. A user click cannot. */
    public <E extends HasStatus> void fireSystem(Lifecycle lifecycle, E record, UUID id, String transitionId, Consumer<E> saver) {
        fire(lifecycle, record, id, transitionId, saver, true);
    }

    private <E extends HasStatus> void fire(Lifecycle lifecycle, E record, UUID id, String transitionId, Consumer<E> saver, boolean systemAllowed) {
        Transition transition = lifecycle.transition(transitionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown transition: " + transitionId));
        if (transition.system()) {
            if (!systemAllowed) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Transition not permitted: " + transitionId);
            }
        } else if (!allowed(lifecycle, record, transition.permission())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Transition not permitted: " + transitionId);
        }
        if (!transition.allowedFrom(record.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Transition " + transitionId + " is not possible from " + record.getStatus());
        }
        List<String> missing = missingFields(record, transition.requires());
        if (!missing.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT, "Required fields: " + String.join(", ", missing));
        }
        apply(lifecycle, record, id, transition);
        Lifecycle.Approval approval = transition.approval();
        if (approval != null) {
            if (Condition.holds(approval.when(), record)) {
                ApprovalGateway gateway = approvals.getIfAvailable();
                if (gateway == null) {
                    throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Approvals are not available");
                }
                saver.accept(record);
                gateway.request(lifecycle.entity(), id, title(approval.title(), record, transition), approval.permission());
                return;
            }
            apply(lifecycle, record, id, lifecycle.transition(approval.approved()).orElseThrow());
        }
        saver.accept(record);
    }

    /** The approval opened by a transition ended: fire its outcome on the record it waits on. */
    public void onApprovalDecided(String entityType, UUID entityId, boolean approved) {
        Binding<?> binding = bindings.get(entityType);
        if (binding != null) {
            decide(binding, entityId, approved);
        }
    }

    private <E extends HasStatus> void decide(Binding<E> binding, UUID entityId, boolean approved) {
        Lifecycle lifecycle = binding.lifecycle();
        binding.loader().apply(entityId).ifPresent(record -> lifecycle.transitions().stream()
                .filter(t -> t.approval() != null && t.to().equals(record.getStatus()))
                .findFirst()
                .flatMap(t -> lifecycle.transition(approved ? t.approval().approved() : t.approval().rejected()))
                .filter(outcome -> outcome.allowedFrom(record.getStatus()))
                .ifPresent(outcome -> {
                    apply(lifecycle, record, entityId, outcome);
                    binding.saver().accept(record);
                }));
    }

    private void apply(Lifecycle lifecycle, HasStatus record, UUID id, Transition transition) {
        String from = record.getStatus();
        record.setStatus(transition.to());
        events.publishEvent(new Transitioned(
                lifecycle.entity(), id, transition.id(), from, transition.to(),
                UserContext.getUserIdOrNull(), TenantContext.getTenantIdOrNull(), transition.system()));
    }

    static List<String> missingFields(Object record, List<String> required) {
        List<String> missing = new ArrayList<>();
        if (required == null) {
            return missing;
        }
        BeanWrapperImpl wrapper = new BeanWrapperImpl(record);
        for (String field : required) {
            Object value = wrapper.getPropertyValue(field);
            if (value == null || (value instanceof String s && s.isBlank())) {
                missing.add(field);
            }
        }
        return missing;
    }

    public static String fill(String template, Object record, String fallback) {
        if (template == null || template.isBlank()) return fallback == null ? "" : fallback;
        BeanWrapperImpl wrapper = new BeanWrapperImpl(record);
        Matcher m = PLACEHOLDER.matcher(template);
        StringBuilder out = new StringBuilder();
        while (m.find()) {
            Object value = wrapper.isReadableProperty(m.group(1)) ? wrapper.getPropertyValue(m.group(1)) : "";
            m.appendReplacement(out, Matcher.quoteReplacement(value == null ? "" : value.toString()));
        }
        m.appendTail(out);
        return out.toString();
    }

    private static String title(String template, Object record, Transition transition) {
        return fill(template, record, transition.label());
    }
}
