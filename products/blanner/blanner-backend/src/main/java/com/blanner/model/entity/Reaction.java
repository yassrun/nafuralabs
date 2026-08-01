package com.blanner.model.entity;

import com.blanner.blan.Blan;
import com.blanner.model.enums.ReactionType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "blan_reaction", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "blan_id", "type"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Reaction {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blan_id", nullable = false)
    private Blan blan;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReactionType type;
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
