package com.blanner.dto;

import com.blanner.model.enums.ParticipationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParticipationDto {
    private UUID id;
    private UUID blanId;
    private UUID userId;
    private ParticipationStatus status;
    private LocalDateTime joinedAt;
    private LocalDateTime updatedAt;
}















