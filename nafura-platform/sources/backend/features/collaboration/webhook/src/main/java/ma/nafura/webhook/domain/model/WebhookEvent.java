package ma.nafura.platform.collaboration.webhook.domain.model;

public enum WebhookEvent {
    // Entity lifecycle
    ENTITY_CREATED,
    ENTITY_UPDATED,
    ENTITY_DELETED,

    // Workflow
    APPROVAL_REQUESTED,
    APPROVAL_APPROVED,
    APPROVAL_REJECTED,

    // System
    MEMBER_INVITED,
    MEMBER_ACTIVATED,
    DOMAIN_ACTIVATED
}

