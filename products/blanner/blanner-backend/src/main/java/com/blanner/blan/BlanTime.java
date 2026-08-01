package com.blanner.blan;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "blan_times")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlanTime {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    // Date spécifique si connue (format: "2025-10-20")
    private LocalDate date;
    
    // Heure spécifique si connue (format: "18:30")
    private LocalTime time;
    
    // Phrase temporelle flexible (ex: "this weekend", "Saturday night", "after work")
    @Column(name = "time_phrase")
    private String timePhrase;
    
    // DateTime combiné pour tri/filtrage (si date & time connus)
    @Column(name = "start_datetime")
    private LocalDateTime startDatetime;
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

