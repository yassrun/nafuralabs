package ma.nafura.sandbox.domain;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "sandbox_product")
public class SandboxProduct {

    @Id
    @Column(length = 64, nullable = false)
    private String id;

    @Column(nullable = false, length = 64)
    private String code;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, length = 32)
    private String status;

    @Column(nullable = false, length = 64)
    private String category;

    @Column(length = 1024)
    private String description;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected SandboxProduct() {
    }

    public SandboxProduct(
        String id,
        String code,
        String name,
        String status,
        String category,
        String description,
        Instant createdAt
    ) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.status = status;
        this.category = category;
        this.description = description;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
