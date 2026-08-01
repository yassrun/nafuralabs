package com.blanner.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReactionResponse {
    private Boolean userLiked;
    private Boolean userSaved;
    private Long likeCount;
    private Long saveCount;
}

