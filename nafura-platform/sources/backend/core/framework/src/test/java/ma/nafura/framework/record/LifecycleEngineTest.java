package ma.nafura.platform.framework.record;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.support.StaticListableBeanFactory;
import org.springframework.web.server.ResponseStatusException;

import ma.nafura.platform.framework.context.UserContext;

class LifecycleEngineTest {

    public static class Request implements HasStatus {
        private String status = "DRAFT";
        private String subject = "Laptops";
        private BigDecimal amount = new BigDecimal("500");

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
    }

    private final Lifecycle lifecycle = Lifecycle.load("lifecycle/test-purchase-request.json");
    private final List<String> opened = new ArrayList<>();
    private final List<Object> events = new ArrayList<>();
    private LifecycleEngine engine;
    private final Request request = new Request();
    private final UUID id = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        StaticListableBeanFactory beans = new StaticListableBeanFactory();
        beans.addBean("gateway", (ApprovalGateway) (type, entityId, title, role) -> opened.add(type + "|" + title + "|" + role));
        engine = new LifecycleEngine(beans.getBeanProvider(ApprovalGateway.class), events::add);
        engine.register(lifecycle, entityId -> Optional.of(request), r -> { });
        UserContext.setPermissions(Set.of("test.purchase.request.submit", "test.purchase.request.order"));
    }

    @AfterEach
    void tearDown() {
        UserContext.clear();
    }

    @Test
    void aSmallRequestIsApprovedAtOnceWithoutOpeningAnApproval() {
        engine.fire(lifecycle, request, id, "submit", r -> { });

        assertThat(request.getStatus()).isEqualTo("APPROVED");
        assertThat(opened).isEmpty();
        assertThat(events).hasSize(2);
    }

    @Test
    void aLargeRequestWaitsForItsApproverThenFollowsTheDecision() {
        request.setAmount(new BigDecimal("25000"));
        engine.fire(lifecycle, request, id, "submit", r -> { });

        assertThat(request.getStatus()).isEqualTo("SUBMITTED");
        assertThat(opened).containsExactly("test.purchase-request|Request Laptops|LEAD");

        engine.onApprovalDecided("test.purchase-request", id, false);
        assertThat(request.getStatus()).isEqualTo("REJECTED");

        engine.fire(lifecycle, request, id, "submit", r -> { });
        engine.onApprovalDecided("test.purchase-request", id, true);
        assertThat(request.getStatus()).isEqualTo("APPROVED");
    }

    @Test
    void theEngineRefusesWhatTheDeclarationDoesNotAllow() {
        assertThatThrownBy(() -> engine.fire(lifecycle, request, id, "order", r -> { }))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("409");
        assertThatThrownBy(() -> engine.fire(lifecycle, request, id, "approve", r -> { }))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("403");

        request.setSubject(" ");
        assertThatThrownBy(() -> engine.fire(lifecycle, request, id, "submit", r -> { }))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("subject");

        UserContext.setPermissions(Set.of());
        request.setSubject("Laptops");
        assertThatThrownBy(() -> engine.fire(lifecycle, request, id, "submit", r -> { }))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("403");
        assertThat(engine.available(lifecycle, request)).isEmpty();
        assertThat(request.getStatus()).isEqualTo("DRAFT");
    }

    @Test
    void anInconsistentDeclarationFailsAtLoading() {
        Lifecycle broken = new Lifecycle("x", "NOPE", List.of(), lifecycle.states(), lifecycle.transitions());
        assertThatThrownBy(() -> broken.validated("broken.json")).hasMessageContaining("initial state NOPE");
        assertThat(lifecycle.isEditable("DRAFT")).isTrue();
        assertThat(lifecycle.isEditable("APPROVED")).isFalse();
    }

    @Test
    void conditionsCompareNumbersTextAndEmptiness() {
        request.setAmount(new BigDecimal("10000"));
        assertThat(Condition.holds("amount > 10000", request)).isFalse();
        assertThat(Condition.holds("amount >= 10000", request)).isTrue();
        assertThat(Condition.holds("subject == 'Laptops'", request)).isTrue();
        request.setSubject(null);
        assertThat(Condition.holds("subject == null", request)).isTrue();
        assertThat(Condition.holds("", request)).isTrue();
    }
}
