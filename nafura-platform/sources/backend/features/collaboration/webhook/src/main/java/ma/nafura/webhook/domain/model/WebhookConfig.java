package ma.nafura.platform.collaboration.webhook.domain.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import ma.nafura.platform.framework.domain.TenantEntity;
import org.hibernate.annotations.Formula;

import java.util.ArrayList;
import java.util.List;

/** An outgoing webhook of the organization. Its secret signs the deliveries and is never sent back. */
@Entity
@Table(name = "webhook_configs")
@Getter
@Setter
public class WebhookConfig extends TenantEntity {

    @NotBlank
    @Size(max = 100)
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @NotBlank
    @Size(max = 500)
    @Pattern(regexp = "^https?://.+", message = "Adresse http(s) attendue")
    @Column(name = "url", nullable = false, length = 500)
    private String url;

    /** Written by a request, never read back: a blank one on update keeps the stored secret. */
    @Size(max = 200)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(name = "secret", nullable = false, length = 200)
    private String secret;

    @NotEmpty
    @ElementCollection(fetch = FetchType.EAGER)
    @Enumerated(EnumType.STRING)
    @CollectionTable(name = "webhook_config_events", joinColumns = @JoinColumn(name = "webhook_id"))
    @Column(name = "event", nullable = false, length = 100)
    private List<WebhookEvent> events = new ArrayList<>();

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    /** Outcome of the latest delivery, in words: what the list shows and filters on. */
    @Setter(AccessLevel.NONE)
    @Formula("(select case d.status when 'SUCCESS' then 'Réussie' when 'FAILED' then 'Échouée' else 'En attente' end"
            + " from webhook_deliveries d where d.webhook_id = id order by d.created_at desc limit 1)")
    private String lastDeliveryStatus;

    @Setter(AccessLevel.NONE)
    @Formula("(select count(*) from webhook_config_events e where e.webhook_id = id)")
    private Integer eventCount;
}
