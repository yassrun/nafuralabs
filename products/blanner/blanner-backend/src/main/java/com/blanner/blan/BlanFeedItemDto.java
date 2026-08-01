package com.blanner.blan;

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
public class BlanFeedItemDto {
    private UUID id;
    private String title;
    private String category;
    private LocalDateTime dateTime;
    private String locationMode;

    private Integer participantsCount;
    private Integer maxParticipants;
    private Boolean userParticipating;
    private String userParticipationStatus;  // Status of user's participation (NOT_REQUESTED, REQUESTED, etc.)

    private Integer likeCount;
    private Integer saveCount;
    private Boolean userLiked;
    private Boolean userSaved;

    private Double distanceKm;

    private UUID ownerId;
    private String ownerName;
    private String ownerAvatarUrl;

    private String coverImageUrl;
}

