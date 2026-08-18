package ma.nafura.platform.collaboration.notification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.platform.collaboration.notification.domain.model.Notification;
import ma.nafura.platform.collaboration.notification.inapp.NotificationPayload;
import ma.nafura.platform.collaboration.notification.inapp.NotificationServiceImpl;
import ma.nafura.platform.collaboration.notification.repository.NotificationRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class NotificationBaselineTest {

    private static final UUID TENANT_A = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID TENANT_B = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static final UUID PERSON_P = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID PERSON_Q = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Mock
    private NotificationRepository notificationRepository;

    private final Map<UUID, Notification> store = new LinkedHashMap<>();
    private NotificationServiceImpl notifications;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT_A);
        UserContext.setUserId(PERSON_P);
        stubRepo();
        notifications = new NotificationServiceImpl(notificationRepository);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        UserContext.clear();
        store.clear();
    }

    @Test
    void deposerEtLister() {
        Notification deposited = notifications.send(PERSON_P, "in_app", message());
        Page<Notification> listed = notifications.listForCurrentUser(PageRequest.of(0, 20));

        assertThat(listed.getContent()).extracting(Notification::getId).contains(deposited.getId());
        assertThat(listed.getContent()).extracting(Notification::getIsRead).containsOnly(false);
        assertThat(deposited.getTitle()).isEqualTo("Titre A");
        assertThat(deposited.getBody()).isEqualTo("Corps A");
    }

    @Test
    void deuxTenants() {
        notifications.send(PERSON_P, "in_app", message());

        TenantContext.setTenantId(TENANT_B);
        Page<Notification> listedB = notifications.listForCurrentUser(PageRequest.of(0, 20));

        assertThat(listedB.getContent()).isEmpty();
    }

    @Test
    void marquerLue() {
        Notification deposited = notifications.send(PERSON_P, "in_app", message());
        long unreadBefore = notifications.countUnreadForCurrentUser();

        notifications.markRead(deposited.getId());

        Page<Notification> listed = notifications.listForCurrentUser(PageRequest.of(0, 20));
        long unreadAfter = notifications.countUnreadForCurrentUser();

        assertThat(listed.getContent()).hasSize(1);
        assertThat(listed.getContent().get(0).getIsRead()).isTrue();
        assertThat(unreadBefore).isEqualTo(1);
        assertThat(unreadAfter).isLessThan(unreadBefore);
    }

    @Test
    void autreDestinataire() {
        notifications.send(PERSON_P, "in_app", message());

        UserContext.setUserId(PERSON_Q);
        Page<Notification> listedQ = notifications.listForCurrentUser(PageRequest.of(0, 20));

        assertThat(listedQ.getContent()).isEmpty();
    }

    private NotificationPayload message() {
        return NotificationPayload.builder().title("Titre A").body("Corps A").build();
    }

    private void stubRepo() {
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> {
            Notification n = inv.getArgument(0);
            if (n.getId() == null) {
                n.setId(UUID.randomUUID());
            }
            store.put(n.getId(), n);
            return n;
        });
        when(notificationRepository.findByTenantIdAndRecipientIdOrderBySentAtDesc(any(), any(), any()))
                .thenAnswer(inv -> {
                    UUID tenant = inv.getArgument(0);
                    UUID recipient = inv.getArgument(1);
                    Pageable pageable = inv.getArgument(2);
                    var items = store.values().stream()
                            .filter(n -> tenant.equals(n.getTenantId()) && recipient.equals(n.getRecipientId()))
                            .sorted(Comparator.comparing(Notification::getSentAt).reversed())
                            .toList();
                    return new PageImpl<>(items, pageable, items.size());
                });
        when(notificationRepository.countByTenantIdAndRecipientIdAndIsReadFalse(any(), any()))
                .thenAnswer(inv -> {
                    UUID tenant = inv.getArgument(0);
                    UUID recipient = inv.getArgument(1);
                    return store.values().stream()
                            .filter(n -> tenant.equals(n.getTenantId())
                                    && recipient.equals(n.getRecipientId())
                                    && Boolean.FALSE.equals(n.getIsRead()))
                            .count();
                });
        when(notificationRepository.findByIdAndTenantId(any(), any())).thenAnswer(inv -> {
            Notification n = store.get(inv.getArgument(0));
            UUID tenant = inv.getArgument(1);
            if (n == null || !tenant.equals(n.getTenantId())) {
                return Optional.empty();
            }
            return Optional.of(n);
        });
    }
}
