package com.blanner.blan;

import com.blanner.categories.Category;
import com.blanner.model.entity.*;
import com.blanner.model.enums.*;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "blans")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Blan {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id", nullable = false)
    private User creator;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = true)
    private Category category;
    
    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JoinColumn(name = "blan_location_id", nullable = true)
    private BlanLocation blanLocation;
    
    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JoinColumn(name = "blan_time_id", nullable = true)
    private BlanTime blanTime;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "group_size", nullable = false)
    private GroupSize groupSize;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "gender_pref", nullable = false)
    private GenderPreference genderPref;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Mood mood;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "bill_policy")
    private BillPolicy billPolicy;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Visibility visibility;
    
    @Builder.Default
    @Column(name = "approval_required")
    private Boolean approvalRequired = false;
    
    @Column(name = "max_participants")
    private Integer maxParticipants;
    
    @Column(name = "custom_description", columnDefinition = "TEXT")
    private String customDescription;
    
    
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private BlanStatus status = BlanStatus.ACTIVE;
    
    @Builder.Default
    @Column(name = "like_count")
    private Integer likeCount = 0;
    
    @Builder.Default
    @Column(name = "comment_count")
    private Integer commentCount = 0;
    
    @Builder.Default
    @Column(name = "join_count")
    private Integer joinCount = 0;
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Relationships
    @OneToMany(mappedBy = "blan", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Participation> participations = new ArrayList<>();
    
    @OneToMany(mappedBy = "blan", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Comment> comments = new ArrayList<>();
    
    @OneToMany(mappedBy = "blan", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Reaction> reactions = new ArrayList<>();
}

