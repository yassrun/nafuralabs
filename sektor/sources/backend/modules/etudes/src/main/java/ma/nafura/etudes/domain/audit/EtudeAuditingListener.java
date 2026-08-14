package ma.nafura.etudes.domain.audit;

import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import java.util.UUID;
import ma.nafura.platform.framework.context.UserContext;

/**
 * Remplit createdBy / updatedBy depuis {@link UserContext}.
 * Aucun AuditingEntityListener Spring Data n'existe dans platform/ — listener local.
 */
public class EtudeAuditingListener {

    @PrePersist
    public void onCreate(Object target) {
        if (!(target instanceof AuditableEtude auditable)) {
            return;
        }
        String user = currentUser();
        if (auditable.getCreatedBy() == null) {
            auditable.setCreatedBy(user);
        }
        auditable.setUpdatedBy(user);
    }

    @PreUpdate
    public void onUpdate(Object target) {
        if (target instanceof AuditableEtude auditable) {
            auditable.setUpdatedBy(currentUser());
        }
    }

    private static String currentUser() {
        UUID id = UserContext.getUserIdOrNull();
        if (id != null) {
            return id.toString();
        }
        String email = UserContext.getUserEmail();
        if (email != null && !email.isBlank()) {
            return email;
        }
        return "system";
    }
}
