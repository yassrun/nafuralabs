package com.blanner.dto;

import com.blanner.model.enums.ParticipationStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateParticipationRequest {
    
    @NotNull(message = "Blan ID is required")
    private UUID blanId;
    
    @NotNull(message = "User ID is required")
    private UUID userId;
    
    @Builder.Default
    private ParticipationStatus status = ParticipationStatus.REQUESTED;
}

