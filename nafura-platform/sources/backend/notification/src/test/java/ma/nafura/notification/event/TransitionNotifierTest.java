package ma.nafura.platform.collaboration.notification.event;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import ma.nafura.platform.authorization.repository.TenantUserRoleRepository;
import ma.nafura.platform.authorization.service.PermissionService;
import ma.nafura.platform.collaboration.notification.service.NotificationRouter;
import ma.nafura.platform.framework.domain.TenantEntity;
import ma.nafura.platform.framework.record.HasStatus;
import ma.nafura.platform.framework.record.Lifecycle;
import ma.nafura.platform.framework.record.LifecycleEngine;
import ma.nafura.platform.identity.repository.AppUserRepository;

@ExtendWith(MockitoExtension.class)
class TransitionNotifierTest {

    private static final UUID ACTOR = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID RECORD = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    @Mock LifecycleEngine lifecycles;
    @Mock NotificationRouter router;
    @Mock AppUserRepository users;
    @Mock TenantUserRoleRepository memberships;
    @Mock PermissionService permissions;

    @Test
    void systemOutcomeNotifiesTheAuthorEvenWhenTheyFiredIt() {
        Row row = row();
        stub(lifecycle(true), row);
        notifier().onTransitioned(event(true));
        verify(router).send(argThat(message -> message.recipientId().equals(ACTOR)
                && message.event().equals("demo.row.done") && message.values() == row));
    }

    @Test
    void userTransitionDoesNotNotifyTheActor() {
        Row row = row();
        stub(lifecycle(false), row);
        notifier().onTransitioned(event(false));
        verify(router, never()).send(any());
    }

    private TransitionNotifier notifier() {
        return new TransitionNotifier(lifecycles, router, users, memberships, permissions);
    }

    private void stub(Lifecycle lifecycle, Row row) {
        when(lifecycles.lifecycleOf("demo.row")).thenReturn(Optional.of(lifecycle));
        when(lifecycles.load("demo.row", RECORD)).thenReturn(Optional.of(row));
    }

    private LifecycleEngine.Transitioned event(boolean system) {
        return new LifecycleEngine.Transitioned("demo.row", RECORD, "go", "A", "B", ACTOR, UUID.randomUUID(), system);
    }

    private static Lifecycle lifecycle(boolean system) {
        Lifecycle.Notify notify = new Lifecycle.Notify("demo.row.done", "createdBy");
        Lifecycle.Transition transition = new Lifecycle.Transition(
                "go", "Aller", List.of("A"), "B", system ? null : "demo.row.go", system, List.of(), null, List.of(notify));
        return new Lifecycle("demo.row", "A", List.of(), List.of(new Lifecycle.State("A", "A", "default"), new Lifecycle.State("B", "B", "success")), List.of(transition));
    }

    private static Row row() {
        Row row = new Row();
        row.setId(RECORD);
        row.setCreatedBy(ACTOR);
        row.setStatus("B");
        return row;
    }

    static class Row extends TenantEntity implements HasStatus {
        private String status;
        private final String subject = "Serveurs";

        @Override public String getStatus() { return status; }
        @Override public void setStatus(String status) { this.status = status; }
        public String getSubject() { return subject; }
    }
}
